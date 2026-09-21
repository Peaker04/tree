import { eq, and, sql, ilike, or } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Tree } from '../../../modules/tree-asset-registry/domain/tree.entity';
import type {
  ITreeRepository,
  ListTreesParams,
  ListTreesResult,
} from '../../../modules/tree-asset-registry/application/ports/tree-repository.port';
import * as schema from '../schema';

export class DrizzleTreeRepository implements ITreeRepository {
  constructor(private readonly db: NodePgDatabase<typeof schema>) {}

  private mapRowToEntity(row: schema.TreeRow): Tree {
    return new Tree({
      id: row.id,
      version: row.version,
      name: row.name,
      species: row.species,
      lat: Number(row.lat),
      lng: Number(row.lng),
      address: row.address,
      qrCode: row.qrCode,
      healthStatus: row.healthStatus,
      ageYears: row.ageYears,
      riskStatus: row.riskStatus ?? undefined,
      isRetired: row.isRetired,
      retiredAt: row.retiredAt ?? undefined,
      retiredReason: row.retiredReason ?? undefined,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  async findById(id: string): Promise<Tree | null> {
    const rows = await this.db.select().from(schema.trees).where(eq(schema.trees.id, id)).limit(1);
    if (!rows || rows.length === 0 || !rows[0]) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async findByQrCode(qrCode: string): Promise<Tree | null> {
    const rows = await this.db.select().from(schema.trees).where(eq(schema.trees.qrCode, qrCode)).limit(1);
    if (!rows || rows.length === 0 || !rows[0]) return null;
    return this.mapRowToEntity(rows[0]);
  }

  async save(tree: Tree): Promise<void> {
    await this.db.insert(schema.trees).values({
      id: tree.id,
      version: tree.version,
      name: tree.name,
      species: tree.species,
      lat: String(tree.lat),
      lng: String(tree.lng),
      address: tree.address,
      qrCode: tree.qrCode,
      healthStatus: tree.healthStatus,
      ageYears: tree.ageYears,
      riskStatus: tree.riskStatus ?? null,
      isRetired: tree.isRetired,
      retiredAt: tree.retiredAt ?? null,
      retiredReason: tree.retiredReason ?? null,
      createdAt: tree.createdAt,
      updatedAt: tree.updatedAt,
    });
  }

  async update(tree: Tree, expectedVersion: number): Promise<boolean> {
    const result = await this.db
      .update(schema.trees)
      .set({
        version: tree.version,
        name: tree.name,
        species: tree.species,
        lat: String(tree.lat),
        lng: String(tree.lng),
        address: tree.address,
        qrCode: tree.qrCode,
        healthStatus: tree.healthStatus,
        ageYears: tree.ageYears,
        riskStatus: tree.riskStatus ?? null,
        isRetired: tree.isRetired,
        retiredAt: tree.retiredAt ?? null,
        retiredReason: tree.retiredReason ?? null,
        updatedAt: tree.updatedAt,
      })
      .where(and(eq(schema.trees.id, tree.id), eq(schema.trees.version, expectedVersion)));

    return (result.rowCount ?? 0) > 0;
  }

  async list(params: ListTreesParams): Promise<ListTreesResult> {
    const limit = Math.min(params.limit ?? 50, 100);
    const conditions = [];

    if (params.q && params.q.trim()) {
      const searchTerm = `%${params.q.trim()}%`;
      conditions.push(
        or(
          ilike(schema.trees.name, searchTerm),
          ilike(schema.trees.species, searchTerm),
          ilike(schema.trees.address, searchTerm),
          ilike(schema.trees.qrCode, searchTerm),
          ilike(schema.trees.id, searchTerm),
        ),
      );
    }

    if (params.riskStatus) {
      conditions.push(eq(schema.trees.riskStatus, params.riskStatus));
    }

    if (params.cursor) {
      conditions.push(sql`${schema.trees.id} > ${params.cursor}`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const rows = await this.db
      .select()
      .from(schema.trees)
      .where(whereClause)
      .orderBy(schema.trees.id)
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const itemRows = hasMore ? rows.slice(0, limit) : rows;
    const trees = itemRows.map((r) => this.mapRowToEntity(r));
    const nextCursor = hasMore && trees.length > 0 ? (trees[trees.length - 1]?.id ?? null) : null;

    return {
      trees,
      nextCursor,
      hasMore,
    };
  }
}
