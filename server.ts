import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initializeSocket } from './lib/socket';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Next.js handler runs first; we skip /api/socket so Socket.IO (second listener) can handle it
  const httpServer = createServer(async (req, res) => {
    const url = req.url || '';
    if (url.startsWith('/socket.io')) {
      // Do not respond — Socket.IO's request listener will handle this
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Server] Request to /socket.io (handled by Socket.IO)');
      }
      return;
    }
    try {
      const parsedUrl = parse(url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  initializeSocket(httpServer);

  httpServer.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO path: /socket.io (run with "npm run dev", not "next dev")`);
  });
});
