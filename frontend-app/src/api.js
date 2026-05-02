import axios from 'axios';

// Instancia para hablar con Laravel (Puerto 8000)
export const apiLaravel = axios.create({
    baseURL: 'http://localhost:8000/api',
});

// Instancia para hablar con Node.js (Puerto 3001)
export const apiNode = axios.create({
    baseURL: 'http://192.168.0.105:3001',
});