export type UUID = string;

export enum ConnectionStatus {
    Pending = 'PENDING',
    Accepted = 'ACCEPTED',
    Blocked = 'BLOCKED',
}

export interface RegisterInput {
    email: string;
    username: string;
    passwordRaw: string;
}

export interface LoginInput {
    email: string;
    passwordRaw: string;
}

export interface CreatePostInput {
    content: string;
    mediaUrl?: string;
}

export interface CreateCommentInput {
    postId: UUID;
    content: string;
}

export interface UpdateProfileInput {
    displayName?: string;
    bio?: string;
    profilePictureUrl?: string;
}

export interface UserSummary {
    id: UUID;
    username: string;
    displayName: string;
    profilePictureUrl: string | null;
}

export interface PostResponse {
    id: UUID;
    content: string;
    mediaUrl: string | null;
    createdAt: Date;
    author: UserSummary;
    stats: {
        likes: number;
        comments: number;
    };
    currentUserInteractions: {
        hasLiked: boolean;
    };
}

export interface ProfileResponse extends UserSummary {
    email: string;
    bio: string | null;
    stats: {
        followerCount: number;
        followingCount: number;
        postCount: number;
    };
}

export interface ConnectionResponse {
    id: UUID;
    user: UserSummary;
    status: ConnectionStatus;
}
