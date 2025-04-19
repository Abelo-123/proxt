// proxyServer.js
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

// Enable CORS for all routes
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// Proxy requests to the Majid Kids TV M3U8 playlist
app.use('/proxy', createProxyMiddleware({
    target: 'https://admdn4.cdn.mangomolo.com/majid/smil:majid.stream.smil/playlist.m3u8?adtv',
    changeOrigin: true,
    pathRewrite: {
        '^/proxy': '', // Remove '/proxy' from the URL path
    },
    onProxyRes: (proxyRes, req, res) => {
        // Add CORS headers to the response
        res.header('Access-Control-Allow-Origin', '*');
    },
}));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Proxy server is running on http://localhost:${PORT}`);
});
