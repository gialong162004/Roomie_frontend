import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

// request interceptor
instance.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

// response interceptor
instance.interceptors.response.use(
  function (response) {
    return response?.data ?? response;
  },
  function (error) {
    const status = error?.response?.status;

    // ⚠️ nếu backend trả về 401 (token sai/hết hạn)
    if (status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error?.response?.data ?? error);
  }
);

export default instance;
