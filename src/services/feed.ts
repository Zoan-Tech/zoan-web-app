import { api } from "@/lib/api";
import {
  FeedResponse,
  Post,
  Comment,
  CreatePostRequest,
  CreateCommentRequest,
} from "@/types/feed";

export const feedService = {
  async getFeed(page: number = 1, limit: number = 20): Promise<FeedResponse> {
    const response = await api.get("/feed/global", {
      params: { page, per_page: limit },
    });
    return response.data;
  },

  async getHomeFeed(page: number = 1, limit: number = 20): Promise<FeedResponse> {
    const response = await api.get("/feed/home", {
      params: { page, per_page: limit },
    });
    return response.data;
  },

  async getPost(postId: string): Promise<Post> {
    const response = await api.get(`/posts/${postId}`);
    return response.data.data;
  },

  async createPost(data: CreatePostRequest): Promise<Post> {
    const response = await api.post("/posts", data);
    return response.data.data;
  },

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/posts/${postId}`);
  },

  async likePost(postId: string): Promise<void> {
    await api.post(`/posts/${postId}/like`);
  },

  async unlikePost(postId: string): Promise<void> {
    await api.delete(`/posts/${postId}/like`);
  },

  async repost(postId: string): Promise<void> {
    await api.post(`/posts/${postId}/repost`, { post_id: postId });
  },

  async unrepost(postId: string): Promise<void> {
    await api.delete(`/posts/${postId}/repost`);
  },

  async bookmarkPost(postId: string): Promise<void> {
    await api.post(`/posts/${postId}/bookmark`);
  },

  async unbookmarkPost(postId: string): Promise<void> {
    await api.delete(`/posts/${postId}/bookmark`);
  },

  async getComments(postId: string, page: number = 1): Promise<Comment[]> {
    const response = await api.get(`/posts/${postId}/comments`, {
      params: { page, per_page: 20 },
    });
    return response.data.data;
  },

  async createComment(data: CreateCommentRequest): Promise<Comment> {
    const response = await api.post(`/posts/${data.post_id}/comments`, {
      content: data.content,
      parent_id: data.parent_id,
    });
    return response.data.data;
  },

  async likeComment(commentId: string): Promise<void> {
    await api.post(`/comments/${commentId}/like`);
  },

  async unlikeComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}/like`);
  },

  async getComment(commentId: string): Promise<Comment> {
    const response = await api.get(`/comments/${commentId}`);
    return response.data.data;
  },

  async getCommentReplies(commentId: string, page: number = 1): Promise<Comment[]> {
    const response = await api.get(`/comments/${commentId}/replies`, {
      params: { page, per_page: 20 },
    });
    return response.data.data;
  },

  async getUserPosts(userId: string, page: number = 1): Promise<FeedResponse> {
    const response = await api.get(`/posts/user/${userId}`, {
      params: { page, per_page: 20 },
    });
    return response.data;
  },

  async votePoll(pollId: string, optionId: string): Promise<void> {
    await api.post(`/polls/${pollId}/vote`, {
      option_id: optionId,
    });
  },
};
