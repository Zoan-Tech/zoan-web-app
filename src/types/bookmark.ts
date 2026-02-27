import { Post } from "./feed";

export interface BookmarkCollection {
  id: string;
  name: string;
  description?: string;
  is_private: boolean;
  bookmark_count: number;
  created_at: string;
}

export interface BookmarkItem {
  id: string;
  collection_id?: string;
  post: Post;
  created_at: string;
}
