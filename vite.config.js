import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api/clinical': {
                target: 'http://localhost:8082',
                changeOrigin: true
            },
            '/api/messages': {
                target: 'http://localhost:8083',
                changeOrigin: true
            },
            '/api/search': {
                target: 'http://localhost:8084',
                changeOrigin: true,
            }
        }
    }
})