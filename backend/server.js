import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Helper for __dirname/filename (works in ESM source and safely handled in CJS bundle)
const __filename = typeof fileURLToPath === 'function' && import.meta.url ? fileURLToPath(import.meta.url) : (typeof __filename !== 'undefined' ? __filename : '');
const __dirname = typeof path.dirname === 'function' ? path.dirname(__filename) : (typeof __dirname !== 'undefined' ? __dirname : '.');

// Load Configuration from JSON
const loadConfig = () => {
    const configPath = path.join(__dirname, 'config.json');
    const rootConfigPath = path.join(__dirname, '..', 'config.json');
    let finalPath = fs.existsSync(configPath) ? configPath : rootConfigPath;
    
    try {
        if (fs.existsSync(finalPath)) {
            return JSON.parse(fs.readFileSync(finalPath, 'utf8'));
        }
    } catch (err) {
        console.error('Error reading config.json:', err.message);
    }
    
    return {
        server: { port: 3000, snapserver: { host: '127.0.0.1', rpc_port: 1780, stream_port: 1704 } },
        meta: { author: "Proviox Bridge" }
    };
};

const config = loadConfig();
const app = express();

const PORT = config.server.port || 3000;
const SNAP_HOST = config.server.snapserver.host || '127.0.0.1';
const RPC_PORT = config.server.snapserver.rpc_port || 1780;
const STREAM_PORT = config.server.snapserver.stream_port || RPC_PORT;

console.log(`\n--- Proviox Bridge Gateway ---`);
console.log(`Config Loaded from: json`);
console.log(`Backend Port:    ${PORT}`);
console.log(`Snapserver Host: ${SNAP_HOST}`);
console.log(`RPC Port:        ${RPC_PORT}`);
console.log(`Stream Port:     ${STREAM_PORT}`);
console.log(`------------------------------\n`);

// Create specialized proxies
const rpcProxy = createProxyMiddleware({
    target: `ws://${SNAP_HOST}:${RPC_PORT}`,
  ws: true,
  changeOrigin: true,
  pathRewrite: { '^/jsonrpc': '/jsonrpc' } // Ensure path is preserved if needed
});

const streamProxy = createProxyMiddleware({
    target: `ws://${SNAP_HOST}:${STREAM_PORT}`,
  ws: true,
  changeOrigin: true,
  pathRewrite: { '^/stream': '/stream' }
});

// Endpoint to provide meta information to the frontend (JSON)
app.get('/api/config', (req, res) => {
    res.json(config);
});

// Endpoint to provide meta information to the frontend (Script Injection)
app.get('/api/config.js', (req, res) => {
    res.type('application/javascript');
    res.send(`window.BRIDGE_CONFIG = ${JSON.stringify(config)};`);
});

// Serve frontend static files
app.use(express.static(path.join(__dirname, 'public')));

// Mount specialized proxies
app.use('/jsonrpc', rpcProxy);
app.use('/stream', streamProxy);

// Handle SPA routing
app.use((req, res, next) => {
    // Avoid intercepting API or Proxy routes
    if (req.url.startsWith('/api') || req.url.startsWith('/jsonrpc') || req.url.startsWith('/stream')) {
        return next();
    }
    
    if (req.accepts('html')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    } else {
        res.status(404).send('Not Found');
    }
});

const server = app.listen(PORT, () => {
  console.log(`\nBridge is alive at http://localhost:${PORT}`);
});

// WebSocket upgrade handling - Route to the correct proxy based on URL
server.on('upgrade', (req, socket, head) => {
    if (req.url.startsWith('/jsonrpc')) {
        rpcProxy.upgrade(req, socket, head);
    } else if (req.url.startsWith('/stream')) {
        streamProxy.upgrade(req, socket, head);
    } else {
        socket.destroy();
    }
});
