import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PostService } from './post.service.js';
import {
  PostRepository,
  PostWithCounts,
} from '../repositories/post.repository.js';
import { CreatePostDto } from '../dto/post/create-post.dto.js';
import { UpdatePostDto } from '../dto/post/update-post.dto.js';
import { PostSortBy } from '../dto/post/get-posts-query.dto.js';
import { SortOrder } from '../dto/common/sort-order.enum.js';
import { StorageService } from '../storage/storage.service.js';

function makePost(overrides: Partial<PostWithCounts> = {}): PostWithCounts {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    title: 'Titre',
    authorId: 'user-1',
    content: 'Contenu',
    mediaKey: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    _count: { likes: 3, comments: 2 },
    ...overrides,
  } as PostWithCounts;
}

describe('PostService', () => {
  let service: PostService;
  let repo: jest.Mocked<PostRepository>;
  let storage: jest.Mocked<StorageService>;

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

    storage = {
      put: jest.fn(),
      delete: jest.fn(),
      presign: jest.fn(),
    } as unknown as jest.Mocked<StorageService>;

    service = new PostService(repo, storage);
  });

  describe('create', () => {
    it('délègue au repository en connectant l’auteur', async () => {
      const dto: CreatePostDto = { title: 'T', content: 'C' };
      const created = makePost();
      repo.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(repo.create).toHaveBeenCalledWith({
        title: 'T',
        content: 'C',
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
        where: {},
        orderBy: { createdAt: 'desc' },
      });
      expect(repo.count).toHaveBeenCalledWith({});
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

    it('construit le tri par compteur de likes et la recherche insensible à la casse', async () => {
      repo.findManyWithCounts.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);

      await service.list({
        search: 'Vaccin',
        sortBy: PostSortBy.Likes,
        sortOrder: SortOrder.Asc,
      });

      expect(repo.findManyWithCounts).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        where: {
          OR: [
            { title: { contains: 'Vaccin', mode: 'insensitive' } },
            { content: { contains: 'Vaccin', mode: 'insensitive' } },
          ],
        },
        orderBy: { likes: { _count: 'asc' } },
      });
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

    it('supprime aussi l’objet média associé', async () => {
      const post = makePost({ authorId: 'user-1', mediaKey: 'posts/abc.png' });
      repo.findUniqueWithCounts.mockResolvedValue(post);
      repo.delete.mockResolvedValue(undefined);

      await service.remove(post.id, 'user-1');

      expect(storage.delete).toHaveBeenCalledWith('posts/abc.png');
    });

    it('ne touche pas au stockage quand il n’y a pas de média', async () => {
      const post = makePost({ authorId: 'user-1', mediaKey: null });
      repo.findUniqueWithCounts.mockResolvedValue(post);
      repo.delete.mockResolvedValue(undefined);

      await service.remove(post.id, 'user-1');

      expect(storage.delete).not.toHaveBeenCalled();
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

  describe('setMedia', () => {
    const file = { buffer: Buffer.from('x'), originalname: 'i.png' } as never;

    it('téléverse, enregistre la clé et renvoie le post mis à jour', async () => {
      const post = makePost({ authorId: 'user-1', mediaKey: null });
      const updated = makePost({ mediaKey: 'posts/new.png' });
      repo.findUniqueWithCounts.mockResolvedValue(post);
      storage.put.mockResolvedValue('posts/new.png');
      repo.update.mockResolvedValue(updated);

      const result = await service.setMedia(post.id, 'user-1', file);

      expect(storage.put).toHaveBeenCalledWith(file);
      expect(repo.update).toHaveBeenCalledWith(post.id, {
        mediaKey: 'posts/new.png',
      });
      expect(storage.delete).not.toHaveBeenCalled();
      expect(result).toBe(updated);
    });

    it('supprime l’ancien objet quand on remplace le média', async () => {
      const post = makePost({ authorId: 'user-1', mediaKey: 'posts/old.png' });
      repo.findUniqueWithCounts.mockResolvedValue(post);
      storage.put.mockResolvedValue('posts/new.png');
      repo.update.mockResolvedValue(makePost({ mediaKey: 'posts/new.png' }));

      await service.setMedia(post.id, 'user-1', file);

      expect(storage.delete).toHaveBeenCalledWith('posts/old.png');
    });

    it('refuse si l’appelant n’est pas l’auteur', async () => {
      repo.findUniqueWithCounts.mockResolvedValue(
        makePost({ authorId: 'someone-else' }),
      );

      await expect(
        service.setMedia('id', 'user-1', file),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(storage.put).not.toHaveBeenCalled();
    });
  });

  describe('clearMedia', () => {
    it('supprime l’objet et remet mediaUrl à null', async () => {
      const post = makePost({ authorId: 'user-1', mediaKey: 'posts/x.png' });
      const updated = makePost({ mediaKey: null });
      repo.findUniqueWithCounts.mockResolvedValue(post);
      repo.update.mockResolvedValue(updated);

      const result = await service.clearMedia(post.id, 'user-1');

      expect(repo.update).toHaveBeenCalledWith(post.id, { mediaKey: null });
      expect(storage.delete).toHaveBeenCalledWith('posts/x.png');
      expect(result).toBe(updated);
    });

    it('ne fait rien quand il n’y a pas de média', async () => {
      const post = makePost({ authorId: 'user-1', mediaKey: null });
      repo.findUniqueWithCounts.mockResolvedValue(post);

      const result = await service.clearMedia(post.id, 'user-1');

      expect(repo.update).not.toHaveBeenCalled();
      expect(storage.delete).not.toHaveBeenCalled();
      expect(result).toBe(post);
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
