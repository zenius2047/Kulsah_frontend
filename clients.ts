import axios from 'axios';

const api = axios.create({
  baseURL: 'https://unamended-monkishly-gaylord.ngrok-free.dev/api/v1/',
  headers: {
    "Content-Type": "application/json",
  },
//   timeout: 10000,
});

export default api;