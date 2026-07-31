import axios from 'axios';

// ASSUMPTION: your FastAPI server runs at this base URL. Override by setting
// VITE_API_BASE_URL in a .env file (see .env.example) if it's different.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const client = axios.create({ baseURL });

// Attach the JWT (stored at login) to every request.
// ASSUMPTION: token is sent as a standard `Authorization: Bearer <token>` header.
// If your backend expects a different header/scheme, update here.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('mm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If any request comes back 401, the token is invalid/expired — clear it
// and bounce to login rather than leaving the app in a broken state.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('mm_token');
      localStorage.removeItem('mm_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
