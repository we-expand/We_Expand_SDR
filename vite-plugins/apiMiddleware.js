import path from 'node:path';

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export function apiDevMiddleware() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();

        const fnName = req.url.split('?')[0].replace('/api/', '');
        const modulePath = path.resolve(process.cwd(), 'api', `${fnName}.js`);

        let handlerModule;
        try {
          handlerModule = await server.ssrLoadModule(modulePath);
        } catch (err) {
          res.statusCode = 404;
          res.end(`API function not found: ${fnName}`);
          return;
        }

        let body = undefined;
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          const raw = await readBody(req);
          try {
            body = raw ? JSON.parse(raw) : {};
          } catch {
            body = {};
          }
        }

        const fakeReq = { method: req.method, body, query: {} };
        const fakeRes = {
          statusCode: 200,
          status(code) {
            this.statusCode = code;
            return this;
          },
          json(payload) {
            res.statusCode = this.statusCode;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(payload));
          },
        };

        try {
          await handlerModule.default(fakeReq, fakeRes);
        } catch (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}
