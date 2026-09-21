import type { ISessionRepository } from '../ports/session-repository.port';
import type { ITokenService } from '../ports/token-service.port';

export class LogoutUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly tokenService: ITokenService,
  ) {}

  async execute(accessToken: string): Promise<void> {
    const accessTokenHash = this.tokenService.hashToken(accessToken);
    const session = await this.sessionRepository.findSessionByAccessTokenHash(accessTokenHash);
    if (session && session.revokedAt === null) {
      await this.sessionRepository.revokeSession(session.id);
    }
  }
}
