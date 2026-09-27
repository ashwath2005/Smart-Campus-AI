import api from './client';
import { ENDPOINTS } from './endpoints';

export const forumApi = {
  getPosts: (params) => api.get(ENDPOINTS.FORUM.POSTS, { params }),
  getPost: (id) => api.get(ENDPOINTS.FORUM.POST(id)),
  createPost: (data) => api.post(ENDPOINTS.FORUM.POSTS, data),
  addComment: (postId, data) => api.post(ENDPOINTS.FORUM.COMMENTS(postId), data),
};

export default forumApi;
