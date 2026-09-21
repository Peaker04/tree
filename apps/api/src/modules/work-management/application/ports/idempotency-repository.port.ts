export interface IdempotencyRecord {
  id: string;
  idempotencyKey: string;
  actorId: string;
  requestRoute: string;
  requestHash: string;
  status: 'PROCESSING' | 'COMPLETED';
  responseStatus?: number | null | undefined;
  responseBody?: string | null | undefined;
  createdAt?: Date | undefined;
}

export interface IIdempotencyRepository {
  findByKey(actorId: string, idempotencyKey: string): Promise<IdempotencyRecord | null>;
  claim(record: {
    id: string;
    idempotencyKey: string;
    actorId: string;
    requestRoute: string;
    requestHash: string;
  }): Promise<boolean>;
  complete(params: {
    actorId: string;
    idempotencyKey: string;
    responseStatus: number;
    responseBody: string;
  }): Promise<void>;
  delete(actorId: string, idempotencyKey: string): Promise<void>;
  save(record: IdempotencyRecord): Promise<void>;
}
