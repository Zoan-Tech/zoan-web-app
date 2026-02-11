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

export interface Post {
  id: string;
  content: string;
  user: User;
  media_urls: string[];
  like_count: number;
  repost_count: number;
  reply_count: number;
  is_liked: boolean;
  is_reposted: boolean;
  is_bookmarked: boolean;
  visibility: "public" | "followers" | "mentioned";
  reply_settings: "everyone" | "followers" | "mentioned";
  created_at: string;
  original_post?: Post;
  poll?: Poll;
  entities?: PostEntities;
}

export interface PostEntities {
  hashtags: string[];
  mentions: Mention[];
}

export interface Mention {
  username: string;
  start: number;
  end: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  total_votes: number;
  ends_at: string;
  has_voted: boolean;
  selected_option_id?: string;
}

export interface PollOption {
  id: string;
  text: string;
  vote_count: number;
  percentage: number;
}

export interface Comment {
  id: string;
  post_id: string;
  parent_id?: string;
  content: string;
  user: User;
  like_count: number;
  reply_count: number;
  is_liked: boolean;
  created_at: string;
  replies?: Comment[];
}

export interface CreatePostRequest {
  content: string;
  media_urls?: string[];
  visibility?: "public" | "followers" | "mentioned";
  reply_settings?: "everyone" | "followers" | "mentioned";
  poll?: CreatePollRequest;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
  duration_hours: number;
}

export interface CreateCommentRequest {
  post_id: string;
  parent_id?: string;
  content: string;
}
