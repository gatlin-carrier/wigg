// Social data layer type definitions

export interface Comment {
  id: string;
  userId: string;
  username: string;
  content: string;
  createdAt: string;
}

export interface FollowerCounts {
  followers: number;
  following: number;
}