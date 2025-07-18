import axios from 'axios';
const API_URL = process.env.REACT_APP_API_URL;

// const API_URL = 'http://127.0.0.1:8000/';

export const axiosInstance = axios.create({
    baseURL: API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});
