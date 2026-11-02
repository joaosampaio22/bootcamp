import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClockService } from '../common/clock.service.js';
import { PasswordService } from './password.service.js';
import { AUTH_SETTINGS } from './auth-settings.js';
import type { AuthSettings } from './auth-settings.js';
import { SessionTokenCodec, SESSION_TTL_SECONDS } from './session-token.js';
import type { SessionIdentity } from './session-token.js';
import type { LoginDto, RegisterDto } from './auth.dto.js';

export const PUBLIC_USER = { id: true, name: true, emailNormalized: true, timeZone: true, isDemo: true, createdAt: true } as const;

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly codec: SessionTokenCodec;
  private dummyHash = '';

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(PasswordService) private readonly passwords: PasswordService,
    @Inject(ClockService) private readonly clock: ClockService,
    @Inject(AUTH_SETTINGS) settings: AuthSettings
  ) { this.codec = new SessionTokenCodec(settings.key); }

  async onModuleInit() { this.dummyHash = await this.passwords.hash(randomBytes(32).toString('hex')); }

  private async sessionData(userId: string) {
    const now = this.clock.now();
    const identity = { userId, sessionId: randomUUID(), csrfToken: randomBytes(32).toString('base64url') };
    const token = await this.codec.issue(identity, now);
    return { identity, token, expiresAt: new Date(Math.floor(now.getTime() / 1000) * 1000 + SESSION_TTL_SECONDS * 1000) };
  }

  async register(dto: RegisterDto) {
    const passwordHash = await this.passwords.hash(dto.password);
    const id = randomUUID();
    const session = await this.sessionData(id);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({ data: { id, name: dto.name, emailNormalized: dto.email, passwordHash, timeZone: dto.timeZone }, select: PUBLIC_USER });
        await tx.authSession.create({ data: { id: session.identity.sessionId, userId: id, expiresAt: session.expiresAt } });
        return user;
      });
      return { user, ...session };
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
        throw new ConflictException('Não foi possível cadastrar este e-mail.');
      }
      throw error;
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { emailNormalized: dto.email }, select: { ...PUBLIC_USER, passwordHash: true } });
    const valid = await this.passwords.verify(user?.passwordHash ?? this.dummyHash, dto.password);
    if (!user || !valid) throw new UnauthorizedException('E-mail ou senha inválidos.');
    const session = await this.sessionData(user.id);
    await this.prisma.authSession.create({ data: { id: session.identity.sessionId, userId: user.id, expiresAt: session.expiresAt } });
    const { passwordHash: _hash, ...profile } = user;
    void _hash;
    return { user: profile, ...session };
  }

  async authenticate(token: string) {
    const now = this.clock.now();
    const identity = await this.codec.verify(token, now);
    const session = await this.prisma.authSession.findFirst({
      where: { id: identity.sessionId, userId: identity.userId, revokedAt: null, expiresAt: { gt: now } },
      include: { user: { select: PUBLIC_USER } }
    });
    if (!session) throw new UnauthorizedException('Sessão inválida ou expirada.');
    return { identity, user: session.user };
  }

  async logout(identity: SessionIdentity): Promise<void> {
    await this.prisma.authSession.updateMany({ where: { id: identity.sessionId, userId: identity.userId, revokedAt: null }, data: { revokedAt: this.clock.now() } });
  }
}
