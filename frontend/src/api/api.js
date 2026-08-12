import axios from 'axios';

const API_URL = 'http://localhost:8000/api'; // 🔥 /api 추가

export const getPosts = async () => {
  const response = await axios.get(`${API_URL}/posts`);
  return response.data;
};

export const createPost = async (postData) => {
  const response = await axios.post(`${API_URL}/posts`, postData);
  return response.data;
};

export const updatePost = async (id, postData) => {
  const response = await axios.put(`${API_URL}/posts/${id}`, postData);
  return response.data;
};

export const deletePost = async (id) => {
  const response = await axios.delete(`${API_URL}/posts/${id}`);
  return response.data;
};

export const likePost = async (id) => {
  const response = await axios.post(`${API_URL}/posts/${id}/like`);
  return response.data;
};

// 🔥 조회수 증가 API 추가
export const increaseViews = async (id) => {
  const response = await axios.post(`${API_URL}/posts/${id}/view`);
  return response.data;
};

export const createComment = async (postId, commentData) => {
  const response = await axios.post(`${API_URL}/posts/${postId}/comments`, commentData);
  return response.data;
};

export const deleteComment = async (commentId) => {
  const response = await axios.delete(`${API_URL}/comments/${commentId}`);
  return response.data;
};