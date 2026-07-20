import axios from "axios";
import { toast } from 'react-toastify';

export const createApiClient = () => {
  const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Add response interceptor for handling errors
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      let errorMessage = 'An error occurred';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please login again.';
        // Redirect to login after 2 seconds
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }, 2000);
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.status === 500) {
        errorMessage = 'Internal server error. Please try again later.';
      }

      toast.error(errorMessage);
      
      return Promise.reject(error);
    }
  );

  return api;
};