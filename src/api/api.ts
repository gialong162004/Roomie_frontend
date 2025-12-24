import axios from "./axios.customize";
import type { RegisterPayload, LoginPayload } from "../types/auth.type";
import type { PostFormData, searchFilter } from "../types/post.type";
import type { UpdateProfilePayload } from "../types/user.type";
import type { INoteItem } from "../types/note.type";

const register = (data: RegisterPayload) => {
  return axios.post("/api/auth/register", data);
};
const verifyRegister = (data: { email: string; code: string }) => {
  return axios.post("/api/auth/verify-register", data);
};
const login = (data: LoginPayload) => {
  return axios.post("/api/auth/login", data);
};
const getPostDetail = (idPost: string) => {
  return axios.get(`/api/posts/${idPost}`);
};
const getPost = () => {
  return axios.get("/api/posts/approved");
};
const createPost = (data: PostFormData) => {
  const form = new FormData();
  form.append("title", data.title);
  form.append("description", data.description);
  form.append("price", data.price.toString());
  form.append("city", data.city);
  form.append("district", data.district);
  if (data.ward) form.append("ward", data.ward);
  form.append("address", data.address);
  form.append("superficies", data.superficies.toString());
  form.append("category", data.category);

  // append images nếu có file
  data.imageFiles?.forEach(file => form.append("media", file));

  return axios.post("/api/posts", form);
};
const getCategory = () => {
  return axios.get("/api/categories");
};
const getProfile = () => {
  return axios.get("/api/auth/profile");
};
const updateProfile = (data: UpdateProfilePayload) => {
  return axios.put("/api/auth/profile", data);
};
const updateAvatar = (avatar: File) => {
  const form = new FormData();
  form.append("avatar", avatar);
  return axios.put("/api/auth/profile/avatar", form);
};
const getMyPost = () => {
  return axios.get("/api/posts/me/all");
};
const deletePost = (idPost: string) => {
  return axios.delete(`/api/posts/${idPost}`);
};
const updatePost = (idPost: string, data: PostFormData) => {
  const form = new FormData();
  form.append("title", data.title);
  form.append("description", data.description);
  form.append("price", data.price.toString());
  form.append("city", data.city);
  form.append("district", data.district);
  if (data.ward) form.append("ward", data.ward);
  form.append("address", data.address);
  form.append("superficies", data.superficies.toString());
  form.append("category", data.category);

  // append images nếu có file
  data.imageFiles?.forEach(file => form.append("media", file));

  return axios.put(`/api/posts/${idPost}`, form);
};
const getPublicProfile = (userId: string) => {
  return axios.get(`/api/auth/profile/public/${userId}`);
};
const getUserPost = (userId: string) => {
  return axios.get(`/api/posts/approved/user/${userId}`);
};
const getConversation = () => {
  return axios.get("/api/conversations");
};
const createConversation = (receiverId: string) => {
  return axios.post("/api/conversations", { receiverId });
};
const deleteConversation = (conversationId: string) => {
  return axios.delete(`/api/conversations/${conversationId}`);
};
const getMessages = (conversationId: string) => {
  return axios.get(`/api/messages/${conversationId}`);
};
const createNote = (date: Date, items: INoteItem[]) => {
  return axios.post("/api/notes", { 
    date: date.toISOString().split('T')[0],
    items 
  });
};
const updateNote = (noteId: string, items: INoteItem[]) => {
  return axios.put(`/api/notes/${noteId}`, { items });
};
const getNote = (date: Date) => {
  return axios.get(`/api/notes/date/${date.toISOString().split('T')[0]}`);
};
const deleteNote = (noteId: string) => {
  return axios.delete(`/api/notes/${noteId}`);
};
const getFavoritePosts = () => {
  return axios.get("/api/favorites");
};
const addFavoritePost = (postId: string) => {
  return axios.post(`/api/favorites/${postId}`);
};
const removeFavoritePost = (postId: string) => {
  return axios.delete(`/api/favorites/${postId}`);
};
const getAllNotifications = () => {
  return axios.get("/api/notifications/all");
};
const searchPosts = (filter: searchFilter) => {
  return axios.get("/api/posts/search", { params: filter });
};
const createNewNotifications = () => {
  return axios.post("/api/notifications");
};
const readNotifications = (notificationId: string) => {
  return axios.put(`/api/notifications/read/${notificationId}`);
};
const readAllNotifications = (userId: string) => {
  return axios.put(`/api/notifications/read-all/${userId}`);
};
const deleteNotifications = (notificationId: string) => {
  return axios.delete(`/api/notifications/${notificationId}`);
};

export const AuthAPI = { register, verifyRegister, login, getProfile };
export const PostAPI = { getPostDetail, getPost, createPost, getCategory, getMyPost, deletePost, updatePost, getUserPost, getFavoritePosts, 
  addFavoritePost, removeFavoritePost, searchPosts };
export const UserAPI = { getProfile, updateProfile, updateAvatar, getPublicProfile };
export const MessageAPI = { getConversation, createConversation, deleteConversation, getMessages };
export const NoteAPI = { createNote, updateNote, getNote, deleteNote };
export const NotificationAPI = { getAllNotifications, createNewNotifications, readNotifications, readAllNotifications,
  deleteNotifications };