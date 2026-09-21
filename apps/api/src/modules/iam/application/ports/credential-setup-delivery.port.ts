export interface ICredentialSetupDeliveryPort {
  /**
   * Delivers credential setup / reset invitation to the recipient.
   * Delivery channel is abstracted via this port.
   */
  deliverSetupToken(recipient: { email: string; phone?: string | null }, token: string): Promise<void>;
}
