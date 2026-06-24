import { ClsService } from 'nestjs-cls';
import { CurrentUserService } from './current-user.service.js';
import { PrismaService } from '../../helpers/prisma.service.js';
import type { JwtPayload } from '../types/jwt-payload.type.js';

describe('CurrentUserService', () => {
  let service: CurrentUserService;
  let cls: { get: jest.Mock; set: jest.Mock };
  let prisma: { user: { upsert: jest.Mock } };

  const jwtUser: JwtPayload = {
    sub: 'kc-123',
    preferred_username: 'tester',
    email: 'tester@example.com',
  };

  const dbUser = {
    keycloakId: 'kc-123',
    email: 'tester@example.com',
    username: 'tester',
    profilePictureUrl: null,
    displayName: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    cls = { get: jest.fn(), set: jest.fn() };
    prisma = { user: { upsert: jest.fn() } };
    service = new CurrentUserService(
      cls as unknown as ClsService,
      prisma as unknown as PrismaService,
    );
  });

  describe('jwtUser', () => {
    it('lit l’utilisateur JWT depuis le CLS', () => {
      cls.get.mockReturnValue(jwtUser);

      expect(service.jwtUser).toBe(jwtUser);
      expect(cls.get).toHaveBeenCalledWith('user');
    });
  });

  describe('getDbUser', () => {
    it('retourne l’utilisateur en cache sans toucher la base', async () => {
      cls.get.mockImplementation((key: string) =>
        key === 'dbUser' ? dbUser : undefined,
      );

      const result = await service.getDbUser();

      expect(result).toBe(dbUser);
      expect(prisma.user.upsert).not.toHaveBeenCalled();
    });

    it('upsert l’utilisateur puis le met en cache en cas de cache miss', async () => {
      cls.get.mockImplementation((key: string) =>
        key === 'user' ? jwtUser : undefined,
      );
      prisma.user.upsert.mockResolvedValue(dbUser);

      const result = await service.getDbUser();

      expect(prisma.user.upsert).toHaveBeenCalledWith({
        where: { keycloakId: 'kc-123' },
        update: { email: 'tester@example.com', username: 'tester' },
        create: {
          keycloakId: 'kc-123',
          email: 'tester@example.com',
          username: 'tester',
        },
      });
      expect(cls.set).toHaveBeenCalledWith('dbUser', dbUser);
      expect(result).toBe(dbUser);
    });
  });
});
