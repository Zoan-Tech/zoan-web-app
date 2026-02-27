import { api } from "@/lib/api";
import { BookmarkCollection, BookmarkItem } from "@/types/bookmark";

export const bookmarkService = {
  async getCollections(): Promise<BookmarkCollection[]> {
    const response = await api.get("/bookmarks/collections");
    return response.data.data;
  },

  async createCollection(data: {
    name: string;
    description?: string;
    is_private?: boolean;
  }): Promise<BookmarkCollection> {
    const response = await api.post("/bookmarks/collections", data);
    return response.data.data;
  },

  async bookmarkPost(postId: string, collectionId?: string): Promise<void> {
    const body: { post_id: string; collection_id?: string } = { post_id: postId };
    if (collectionId) body.collection_id = collectionId;
    await api.post("/bookmarks", body);
  },

  async removeBookmark(postId: string): Promise<void> {
    await api.delete(`/bookmarks/${postId}`);
  },

  async bookmarkComment(commentId: string, collectionId?: string): Promise<void> {
    const body: { comment_id: string; collection_id?: string } = { comment_id: commentId };
    if (collectionId) body.collection_id = collectionId;
    await api.post("/bookmarks", body);
  },

  async removeCommentBookmark(commentId: string): Promise<void> {
    await api.delete(`/bookmarks/${commentId}`);
  },

  async getCollectionPosts(collectionId: string, page: number = 1): Promise<BookmarkItem[]> {
    const response = await api.get(`/bookmarks/collections/${collectionId}/posts`, {
      params: { page, per_page: 20 },
    });
    return response.data.data;
  },

  async getQuickSaves(page: number = 1): Promise<BookmarkItem[]> {
    const response = await api.get("/bookmarks/quicksave", {
      params: { page, per_page: 20 },
    });
    return response.data.data;
  },
};
