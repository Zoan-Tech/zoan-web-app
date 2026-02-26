import { User } from "./auth";

export interface FeedResponse {
  data: Post[];
  meta?: Meta;
}

export interface Meta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface Media {
  url: string;
  type: string; // mimetype, e.g. "image/png"
} 

export interface Post {
  id: string;
  user: User;
  content: string;
  medias: Media[];
  reposted_from_post?: Post;
  reposted_from_comment?: Comment;
  like_count: number;
  repost_count: number;
  reply_count: number;
  view_count: number;
  bookmark_count: number;
  visibility: "public" | "followers" | "mentioned";
  reply_settings: "everyone" | "followers" | "mentioned";
  edited_at?: string;
  created_at: string;
  poll?: Poll;
  entities?: PostEntities;
  // User-specific state (when authenticated)
  is_liked: boolean;
  is_reposted: boolean;
  is_bookmarked: boolean;
}

export interface PostEntities {
  hashtags: string[];
  mentions: Mention[];
}

export interface Mention {
  username: string;
  start: number;
  user_id: string;
  end: number;
}

export interface Poll {
  id: string;
  options: PollOption[];
  total_votes: number;
  ends_at: string;
  is_ended: boolean;
  // User-specific fields
  voted_option_id?: string;
}

export interface PollOption {
  id: string;
  text: string;
  vote_count: number;
  vote_percentage: number;
  position: number;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_comment_id?: string;
  content: string;
  medias: Media[];
  user: User;
  like_count: number;
  repost_count: number;
  reply_count: number;
  created_at: string;
  replies?: Comment[];
  mentions?: Mention[];
  poll?: Poll;
  // User-specific state (when authenticated)
  is_liked: boolean;
  is_reposted: boolean;
  is_bookmarked: boolean;
}

export interface CreatePostRequest {
  content: string;
  medias?: File[];
  visibility?: "public" | "followers" | "mentioned";
  reply_settings?: "everyone" | "followers" | "mentioned";
  poll?: CreatePollRequest;
	repost_post_id?: string;
  repost_comment_id?: string;
}

export interface CreatePollRequest {
  options: string[];
  duration_hours: number;
}

export interface CreateCommentRequest {
  post_id: string;
  parent_comment_id?: string;
  content: string;
  medias?: File[];
  poll?: CreatePollRequest;
}

// SSE Event Types
export interface CommentEventData {
  id: string;
  post_id: string;
  user: User;
  content: string;
  parent_comment_id?: string;
  like_count?: number;
  reply_count?: number;
  is_liked?: boolean;
  created_at?: string;
  mentions?: Mention[];
}

export interface SSEStatus {
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  reconnectAttempts: number;
}
