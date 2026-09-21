import type { ICredentialSetupDeliveryPort } from '../../modules/iam/application/ports/credential-setup-delivery.port';

export interface DeliveredSetupMessage {
  recipient: { email: string; phone?: string | null };
  token: string;
  deliveredAt: Date;
}

export class InMemoryCredentialSetupDelivery implements ICredentialSetupDeliveryPort {
  public readonly delivered: DeliveredSetupMessage[] = [];

  async deliverSetupToken(recipient: { email: string; phone?: string | null }, token: string): Promise<void> {
    this.delivered.push({
      recipient,
      token,
      deliveredAt: new Date(),
    });
  }

  clear(): void {
    this.delivered.length = 0;
  }
}
