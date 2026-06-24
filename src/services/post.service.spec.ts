import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostService } from './post.service.js';
import {
  PostRepository,
  PostWithCounts,
} from '../repositories/post.repository.js';
import { CreatePostDto } from '../dto/post/create-post.dto.js';
import { UpdatePostDto } from '../dto/post/update-post.dto.js';

function makePost(overrides: Partial<PostWithCounts> = {}): PostWithCounts {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Titre',
    authorId: 'user-1',
    content: 'Contenu',
    mediaUrl: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    _count: { likes: 3, comments: 2 },
    ...overrides,
  } as PostWithCounts;
}

describe('PostService', () => {
  let service: PostService;
  let repo: jest.Mocked<PostRepository>;

  beforeEach(() => {
    repo = {
      create: jest.fn(),
      findManyWithCounts: jest.fn(),
      findUniqueWithCounts: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      delete: jest.fn(),
      findLike: jest.fn(),
      createLike: jest.fn(),
      deleteLike: jest.fn(),
    } as unknown as jest.Mocked<PostRepository>;

    service = new PostService(repo);
  });

  describe('create', () => {
    it('délègue au repository en connectant l’auteur', async () => {
      const dto: CreatePostDto = {
        title: 'T',
        content: 'C',
        mediaUrl: 'https://ex.com/i.png',
      };
      const created = makePost();
      repo.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(repo.create).toHaveBeenCalledWith({
        title: 'T',
        content: 'C',
        mediaUrl: 'https://ex.com/i.png',
        author: { connect: { keycloakId: 'user-1' } },
      });
      expect(result).toBe(created);
    });
  });

  describe('list', () => {
    it('utilise la pagination par défaut (page 1, limit 20) sans filtre', async () => {
      const items = [makePost()];
      repo.findManyWithCounts.mockResolvedValue(items);
      repo.count.mockResolvedValue(1);

      const result = await service.list({});

      expect(repo.findManyWithCounts).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: undefined,
        orderBy: { createdAt: 'desc' },
      });
      expect(repo.count).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ items, total: 1, page: 1, limit: 20 });
    });

    it('calcule le skip et filtre par authorId', async () => {
      repo.findManyWithCounts.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);

      await service.list({ page: 3, limit: 10, authorId: 'user-9' });

      expect(repo.findManyWithCounts).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
        where: { authorId: 'user-9' },
        orderBy: { createdAt: 'desc' },
      });
      expect(repo.count).toHaveBeenCalledWith({ authorId: 'user-9' });
    });
  });

  describe('getOne', () => {
    it('retourne le post trouvé', async () => {
      const post = makePost();
      repo.findUniqueWithCounts.mockResolvedValue(post);

      await expect(service.getOne(post.id)).resolves.toBe(post);
    });

    it('lève NotFoundException si absent', async () => {
      repo.findUniqueWithCounts.mockResolvedValue(null);

      await expect(service.getOne('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('met à jour quand l’appelant est le propriétaire', async () => {
      const post = makePost({ authorId: 'user-1' });
      const updated = makePost({ title: 'Nouveau' });
      repo.findUniqueWithCounts.mockResolvedValue(post);
      repo.update.mockResolvedValue(updated);
      const dto: UpdatePostDto = { title: 'Nouveau' };

      const result = await service.update(post.id, 'user-1', dto);

      expect(repo.update).toHaveBeenCalledWith(post.id, {
        title: 'Nouveau',
        content: undefined,
        mediaUrl: undefined,
      });
      expect(result).toBe(updated);
    });

    it('lève NotFoundException si le post n’existe pas', async () => {
      repo.findUniqueWithCounts.mockResolvedValue(null);

      await expect(
        service.update('missing', 'user-1', {}),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.update).not.toHaveBeenCalled();
    });

    it('lève ForbiddenException si l’appelant n’est pas l’auteur', async () => {
      repo.findUniqueWithCounts.mockResolvedValue(
        makePost({ authorId: 'someone-else' }),
      );

      await expect(
        service.update('id', 'user-1', { title: 'x' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('supprime quand l’appelant est le propriétaire', async () => {
      const post = makePost({ authorId: 'user-1' });
      repo.findUniqueWithCounts.mockResolvedValue(post);
      repo.delete.mockResolvedValue(undefined);

      await service.remove(post.id, 'user-1');

      expect(repo.delete).toHaveBeenCalledWith(post.id);
    });

    it('lève NotFoundException si le post n’existe pas', async () => {
      repo.findUniqueWithCounts.mockResolvedValue(null);

      await expect(service.remove('missing', 'user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it('lève ForbiddenException si l’appelant n’est pas l’auteur', async () => {
      repo.findUniqueWithCounts.mockResolvedValue(
        makePost({ authorId: 'someone-else' }),
      );

      await expect(service.remove('id', 'user-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  describe('toggleLike', () => {
    it('lève NotFoundException si le post n’existe pas', async () => {
      repo.findUniqueWithCounts.mockResolvedValue(null);

      await expect(
        service.toggleLike('missing', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('retire le like existant (unlike) et décrémente le compteur', async () => {
      const post = makePost({ _count: { likes: 3, comments: 0 } });
      repo.findUniqueWithCounts.mockResolvedValue(post);
      repo.findLike.mockResolvedValue({
        id: 'like-1',
        userId: 'user-1',
        postId: post.id,
      });

      const result = await service.toggleLike(post.id, 'user-1');

      expect(repo.deleteLike).toHaveBeenCalledWith('user-1', post.id);
      expect(repo.createLike).not.toHaveBeenCalled();
      expect(result).toEqual({ liked: false, likesCount: 2 });
    });

    it('ajoute un like et incrémente le compteur', async () => {
      const post = makePost({ _count: { likes: 3, comments: 0 } });
      repo.findUniqueWithCounts.mockResolvedValue(post);
      repo.findLike.mockResolvedValue(null);

      const result = await service.toggleLike(post.id, 'user-1');

      expect(repo.createLike).toHaveBeenCalledWith('user-1', post.id);
      expect(repo.deleteLike).not.toHaveBeenCalled();
      expect(result).toEqual({ liked: true, likesCount: 4 });
    });
  });
});
