import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CommentService } from './comment.service.js';
import {
  CommentRepository,
  CommentWithCounts,
} from '../repositories/comment.repository.js';
import {
  PostRepository,
  PostWithCounts,
} from '../repositories/post.repository.js';
import { CreateCommentDTO } from '../dto/comment/create-comment.dto.js';
import { CommentSortBy } from '../dto/comment/get-comments-query.dto.js';
import { SortOrder } from '../dto/common/sort-order.enum.js';

function makeComment(
  overrides: Partial<CommentWithCounts> = {},
): CommentWithCounts {
  return {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    postId: 'pppppppp-pppp-pppp-pppp-pppppppppppp',
    authorId: 'user-1',
    content: 'Contenu',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    _count: { likes: 3 },
    author: {
      keycloakId: 'user-1',
      username: 'tester',
      displayName: null,
      profileMediaKey: null,
    },
    likes: [],
    ...overrides,
  } as CommentWithCounts;
}

describe('CommentService', () => {
  let service: CommentService;
  let repo: jest.Mocked<CommentRepository>;
  let postRepo: jest.Mocked<PostRepository>;

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
    } as unknown as jest.Mocked<CommentRepository>;

    postRepo = {
      findUniqueWithCounts: jest.fn(),
    } as unknown as jest.Mocked<PostRepository>;

    service = new CommentService(repo, postRepo);
  });

  describe('create', () => {
    it('connecte le post et l’auteur quand le post existe', async () => {
      const dto: CreateCommentDTO = { postId: 'post-1', content: 'C' };
      const created = makeComment();
      postRepo.findUniqueWithCounts.mockResolvedValue({} as PostWithCounts);
      repo.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(repo.create).toHaveBeenCalledWith(
        {
          content: 'C',
          post: { connect: { id: 'post-1' } },
          author: { connect: { keycloakId: 'user-1' } },
        },
        'user-1',
      );
      expect(result).toBe(created);
    });

    it('lève NotFoundException si le post n’existe pas', async () => {
      postRepo.findUniqueWithCounts.mockResolvedValue(null);

      await expect(
        service.create('user-1', { postId: 'missing', content: 'C' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('filtre par postId avec pagination par défaut', async () => {
      const items = [makeComment()];
      repo.findManyWithCounts.mockResolvedValue(items);
      repo.count.mockResolvedValue(1);

      const result = await service.list({ postId: 'post-1' }, 'user-1');

      expect(repo.findManyWithCounts).toHaveBeenCalledWith('user-1', {
        skip: 0,
        take: 20,
        where: { postId: 'post-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(repo.count).toHaveBeenCalledWith({ postId: 'post-1' });
      expect(result).toEqual({ items, total: 1, page: 1, limit: 20 });
    });

    it('applique recherche, tri par likes et pagination', async () => {
      repo.findManyWithCounts.mockResolvedValue([]);
      repo.count.mockResolvedValue(0);

      await service.list(
        {
          postId: 'post-1',
          search: 'Bravo',
          sortBy: CommentSortBy.Likes,
          sortOrder: SortOrder.Asc,
          page: 2,
          limit: 10,
        },
        'user-1',
      );

      expect(repo.findManyWithCounts).toHaveBeenCalledWith('user-1', {
        skip: 10,
        take: 10,
        where: {
          postId: 'post-1',
          content: { contains: 'Bravo', mode: 'insensitive' },
        },
        orderBy: { likes: { _count: 'asc' } },
      });
    });
  });

  describe('getOne', () => {
    it('retourne le commentaire trouvé', async () => {
      const comment = makeComment();
      repo.findUniqueWithCounts.mockResolvedValue(comment);

      await expect(service.getOne(comment.id, 'user-1')).resolves.toBe(comment);
    });

    it('lève NotFoundException si absent', async () => {
      repo.findUniqueWithCounts.mockResolvedValue(null);

      await expect(service.getOne('missing', 'user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('met à jour le contenu quand l’appelant est le propriétaire', async () => {
      const comment = makeComment({ authorId: 'user-1' });
      const updated = makeComment({ content: 'Nouveau' });
      repo.findUniqueWithCounts.mockResolvedValue(comment);
      repo.update.mockResolvedValue(updated);

      const result = await service.update(comment.id, 'user-1', {
        content: 'Nouveau',
      });

      expect(repo.update).toHaveBeenCalledWith(
        comment.id,
        { content: 'Nouveau' },
        'user-1',
      );
      expect(result).toBe(updated);
    });

    it('lève ForbiddenException si l’appelant n’est pas l’auteur', async () => {
      repo.findUniqueWithCounts.mockResolvedValue(
        makeComment({ authorId: 'someone-else' }),
      );

      await expect(
        service.update('id', 'user-1', { content: 'x' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('supprime quand l’appelant est le propriétaire', async () => {
      const comment = makeComment({ authorId: 'user-1' });
      repo.findUniqueWithCounts.mockResolvedValue(comment);
      repo.delete.mockResolvedValue(undefined);

      await service.remove(comment.id, 'user-1');

      expect(repo.delete).toHaveBeenCalledWith(comment.id);
    });

    it('lève ForbiddenException si l’appelant n’est pas l’auteur', async () => {
      repo.findUniqueWithCounts.mockResolvedValue(
        makeComment({ authorId: 'someone-else' }),
      );

      await expect(service.remove('id', 'user-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.delete).not.toHaveBeenCalled();
    });
  });

  describe('toggleLike', () => {
    it('lève NotFoundException si le commentaire n’existe pas', async () => {
      repo.findUniqueWithCounts.mockResolvedValue(null);

      await expect(
        service.toggleLike('missing', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('retire le like existant et décrémente le compteur', async () => {
      const comment = makeComment({ _count: { likes: 3 } });
      repo.findUniqueWithCounts.mockResolvedValue(comment);
      repo.findLike.mockResolvedValue({
        id: 'like-1',
        userId: 'user-1',
        commentId: comment.id,
      });

      const result = await service.toggleLike(comment.id, 'user-1');

      expect(repo.deleteLike).toHaveBeenCalledWith('user-1', comment.id);
      expect(repo.createLike).not.toHaveBeenCalled();
      expect(result).toEqual({ liked: false, likesCount: 2 });
    });

    it('ajoute un like et incrémente le compteur', async () => {
      const comment = makeComment({ _count: { likes: 3 } });
      repo.findUniqueWithCounts.mockResolvedValue(comment);
      repo.findLike.mockResolvedValue(null);

      const result = await service.toggleLike(comment.id, 'user-1');

      expect(repo.createLike).toHaveBeenCalledWith('user-1', comment.id);
      expect(repo.deleteLike).not.toHaveBeenCalled();
      expect(result).toEqual({ liked: true, likesCount: 4 });
    });
  });
});
