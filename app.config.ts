import { defineConfig } from '@solidjs/start/config';

export default defineConfig({
    vite: {
        server: {
            hmr: {
                port: 4000,
                clientPort: 4001
            }
        }
    },
    server: {
        experimental: {
            websocket: true
        }
    }
}).addRouter({
    name: 'ws/map',
    type: 'http',
    handler: './src/server/ws/map.ts',
    target: 'server',
    base: '/ws/map'
});
