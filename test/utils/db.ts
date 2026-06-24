import { PrismaService } from '../../src/helpers/prisma.service.js';
import { OTHER_USER, TEST_USER } from './auth-bypass.js';
import type { JwtPayload } from '../../src/auth/types/jwt-payload.type.js';

// Vide la base puis recrée les utilisateurs de test.
// L'ordre de suppression suit les clés étrangères (enfants avant parents).
export async function resetDb(prisma: PrismaService): Promise<void> {
  await prisma.commentLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  await seedUser(prisma, TEST_USER);
  await seedUser(prisma, OTHER_USER);
}

async function seedUser(
  prisma: PrismaService,
  user: JwtPayload,
): Promise<void> {
  await prisma.user.create({
    data: {
      keycloakId: user.sub,
      email: user.email,
      username: user.preferred_username,
    },
  });
}
