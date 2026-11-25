import http from 'node:http';

const NEXT_PORT = parseInt(process.env.NEXT_PORT || '3000', 10);
const BACKEND_PORT = parseInt(process.env.BACKEND_PORT || '4000', 10);
const ADMIN_PORT = parseInt(process.env.ADMIN_PORT || '3001', 10);

const server = http.createServer((req, res) => {
  req.on('error', () => {});
  res.on('error', () => {});

  const url = req.url || '/';

  if (url === '/' || url === '') {
    res.writeHead(302, {
      Location: '/admin',
      'Content-Type': 'text/plain; charset=utf-8',
    });
    res.end('Redirigiendo al Panel de Administracion de Ferreteria Mica...');
    return;
  }

  const sanitizedUrl = url.replace(/[\r\n]/g, '');
  const isApi = sanitizedUrl.startsWith('/api/');
  const targetPort = isApi ? BACKEND_PORT : NEXT_PORT;

  const hopByHopHeaders = new Set([
    'connection',
    'upgrade',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailer',
    'transfer-encoding',
  ]);
  const forwardHeaders = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!hopByHopHeaders.has(key.toLowerCase())) {
      forwardHeaders[key] = value;
    }
  }

  const options = {
    hostname: '127.0.0.1',
    port: targetPort,
    path: sanitizedUrl,
    method: req.method,
    headers: {
      ...forwardHeaders,
      host: `127.0.0.1:${targetPort}`,
      'x-forwarded-host': `localhost:${ADMIN_PORT}`,
      'x-forwarded-proto': 'http',
      'x-forwarded-for': req.headers['x-forwarded-for']
        ? `${req.headers['x-forwarded-for']}, ${req.socket.remoteAddress || '127.0.0.1'}`
        : req.socket.remoteAddress || '127.0.0.1',
    },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    proxyRes.on('error', () => {});
    if (!res.headersSent) {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
    }
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error(`[Admin Gateway Error -> Port ${targetPort}]:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Servicio temporalmente no disponible en el puerto administrador.');
    }
  });

  if (req.method === 'GET' || req.method === 'HEAD') {
    proxyReq.end();
  } else {
    req.pipe(proxyReq, { end: true });
  }
});

server.on('upgrade', (req, socket) => {
  socket.on('error', () => {});
  const proxyReq = http.request({
    hostname: '127.0.0.1',
    port: NEXT_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  });

  proxyReq.on('upgrade', (proxyRes, proxySocket) => {
    proxySocket.on('error', () => socket.destroy());
    if (socket.destroyed) {
      proxySocket.destroy();
      return;
    }
    try {
      socket.write(
        `HTTP/1.1 101 Switching Protocols\r\n` +
          Object.entries(proxyRes.headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\r\n') +
          '\r\n\r\n'
      );
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    } catch {
      socket.destroy();
      proxySocket.destroy();
    }
  });

  proxyReq.on('error', () => socket.destroy());
  proxyReq.end();
});

server.listen(ADMIN_PORT, () => {
  console.log('=======================================================');
  console.log('  FERRETERIA MICA - PUERTO ADMINISTRADOR ACTIVO        ');
  console.log(`  Acceso Admin directo: http://localhost:${ADMIN_PORT}/  `);
  console.log(`  (API al puerto ${BACKEND_PORT}, UI al puerto ${NEXT_PORT})`);
  console.log('=======================================================');
});
