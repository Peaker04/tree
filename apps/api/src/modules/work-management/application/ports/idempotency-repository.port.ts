export interface IdempotencyRecord {
  id: string;
  idempotencyKey: string;
  actorId: string;
  requestRoute: string;
  requestHash: string;
  responseStatus: number;
  responseBody: string;
  createdAt?: Date | undefined;
}

export interface IIdempotencyRepository {
  findByKey(actorId: string, idempotencyKey: string): Promise<IdempotencyRecord | null>;
  save(record: IdempotencyRecord): Promise<void>;
}
