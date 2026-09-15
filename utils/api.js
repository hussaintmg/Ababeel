import axios from "axios";
import { toast } from 'react-toastify';

export const createApiClient = () => {
  // In the browser, always use relative path '' so requests go to the current origin
  // (preventing CORS failures between www and non-www subdomains).
  const isBrowser = typeof window !== "undefined";
  let baseURL = isBrowser ? "" : (process.env.NEXT_PUBLIC_API_URL || "");
  if (baseURL.endsWith("/api")) {
    baseURL = baseURL.slice(0, -4);
  }

  const api = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // Request interceptor: ensure leading /api is never duplicated (e.g. /api/api/...)
  api.interceptors.request.use((config) => {
    if (config.url) {
      config.url = config.url.replace(/^\/api\/api\//, "/api/");
    }
    return config;
  });

  // Add response interceptor for handling errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      const isSilent = Boolean(error?.config?.silent);
      let errorMessage = 'An error occurred';
      
      if (error.response?.status === 401) {
        if (!isSilent) {
          errorMessage = 'Session expired. Please login again.';
          setTimeout(() => {
            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
              window.location.href = '/login';
            }
          }, 2000);
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      }

      if (!isSilent) {
        toast.error(errorMessage);
      }
      
      return Promise.reject(error);
    }
  );

  return api;
};