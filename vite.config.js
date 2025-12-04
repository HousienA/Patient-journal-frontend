import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'


export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '')

    return {
        plugins: [react()],
        server: {
            proxy: {
                '/api/clinical': {
                    target: env.VITE_CLINICAL_API_URL || 'http://localhost:8082',
                    changeOrigin: true
                },
                '/api/messages': {
                    target: env.VITE_MESSAGE_API_URL || 'http://localhost:8083',
                    changeOrigin: true
                },
                '/api/search': {
                    target: env.VITE_SEARCH_API_URL || 'http://localhost:8085',
                    changeOrigin: true,
                }
            }
        }
    }
})