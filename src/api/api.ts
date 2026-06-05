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
const getPost = (params?: any) => {
  return axios.get("/api/posts/approved", { params });
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
const getNearbyPosts = (params: { lat: number; lng: number; maxDistance: number; page?: number; limit?: number }) => {
  return axios.get("/api/posts/nearby", { params });
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
const getAllPackages = () => {
  return axios.get("/api/subscriptions/packages");
}
const paySubscription = (packageId: string) => {
  return axios.post("/api/subscriptions/zalo/create", { packageId });
}
const editAvailable = (postId: string, available: boolean) => {
  return axios.put(`/api/posts/available/${postId}`, { available });
}
const getNewPosts = (params: {page?: number; limit?: number }) => {
  return axios.get("/api/posts/newest", { params });
};
const getReviewsForMe = () => {
  return axios.get("/api/reviews/me/about");
}
const getReviewsByMe = () => {
  return axios.get("/api/reviews/me");
}
const createReview = (revieweeId: string, rating: number, text: string) => {
  return axios.post("/api/reviews", { revieweeId, rating, text });
}
const getReview = (reviewId: string) => {
  return axios.get(`/api/reviews/about/${reviewId}`);
}
const checkReviewEligibility = (userId: string) => {
  return axios.get(`/api/reviews/eligibility/${userId}`);
}
const chatBot = (message: string) => {
  return axios.post("/api/chatbot", { message });
}
const reportPost = (postId: string, reason: string) => {
  return axios.post("/api/reports", { postId, reason });
}
const forgotPassword = (email: string) => {
  return axios.post("/api/auth/forgot-password", { email });
}
const resetPassword = (email: string, code: string, newPassword: string) => {
  return axios.post("/api/auth/reset-password", { email, code, newPassword });
}
const checkServerStatus = () => {
  return axios.get("/api/surveys/status");
}
const getSurvey = () => {
  return axios.get("/api/surveys/template");
}
const submitSurvey = (answers: Record<string, string>) => {
  return axios.post("/api/surveys/submit", { answers });
}

export const AuthAPI = { register, verifyRegister, login, getProfile, forgotPassword, resetPassword };
export const PostAPI = { getPostDetail, getPost, createPost, getCategory, getMyPost, deletePost, updatePost, getUserPost, getFavoritePosts, 
  addFavoritePost, removeFavoritePost, searchPosts, getNearbyPosts, editAvailable, getNewPosts, reportPost };
export const UserAPI = { getProfile, updateProfile, updateAvatar, getPublicProfile };
export const MessageAPI = { getConversation, createConversation, deleteConversation, getMessages, chatBot};
export const NoteAPI = { createNote, updateNote, getNote, deleteNote };
export const NotificationAPI = { getAllNotifications, createNewNotifications, readNotifications, readAllNotifications,
  deleteNotifications };
export const SubscriptionAPI = { getAllPackages, paySubscription };
export const ReviewAPI = { getReviewsForMe, getReviewsByMe, createReview, getReview, checkReviewEligibility };
export const SurveyAPI = { getSurvey, checkServerStatus, submitSurvey };