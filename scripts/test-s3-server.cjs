const http = require('node:http');
const nodeCrypto = require('node:crypto');

const PORT = parseInt(process.env.PORT || '9000', 10);
const storage = new Map(); // key -> { buffer, contentType, etag, sha256, lastModified }
const buckets = new Set(['novyx-evidence']);

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost:9000'}`);
  const pathname = decodeURIComponent(url.pathname);
  const parts = pathname.replace(/^\/+/, '').split('/');
  const bucket = parts[0];
  const key = parts.slice(1).join('/');

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, PUT, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Expose-Headers', 'ETag, Content-Length, Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Root or ping
  if (!bucket || pathname === '/' || pathname === '/minio/health/live') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
    return;
  }

  // Bucket-level operations
  if (!key) {
    if (req.method === 'PUT') {
      buckets.add(bucket);
      res.writeHead(200);
      res.end();
      return;
    }
    if (req.method === 'HEAD' || req.method === 'GET') {
      if (buckets.has(bucket)) {
        res.writeHead(200);
        res.end();
      } else {
        res.writeHead(404, { 'Content-Type': 'application/xml' });
        res.end('<Error><Code>NoSuchBucket</Code></Error>');
      }
      return;
    }
    if (req.method === 'DELETE') {
      buckets.delete(bucket);
      res.writeHead(204);
      res.end();
      return;
    }
  }

  // Object-level operations
  const fullKey = `${bucket}/${key}`;

  if (req.method === 'PUT') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const etag = `"${nodeCrypto.createHash('md5').update(buffer).digest('hex')}"`;
      const sha256 = nodeCrypto.createHash('sha256').update(buffer).digest('hex');
      const contentType = req.headers['content-type'] || 'application/octet-stream';
      const lastModified = new Date().toUTCString();

      storage.set(fullKey, { buffer, contentType, etag, sha256, lastModified });

      res.writeHead(200, {
        ETag: etag,
        'x-amz-meta-sha256': sha256,
        'Content-Type': 'text/plain',
      });
      res.end();
    });
    return;
  }

  if (req.method === 'HEAD') {
    const item = storage.get(fullKey);
    if (!item) {
      res.writeHead(404, { 'Content-Type': 'application/xml' });
      res.end('<Error><Code>NoSuchKey</Code></Error>');
      return;
    }
    res.writeHead(200, {
      'Content-Type': item.contentType,
      'Content-Length': item.buffer.length,
      ETag: item.etag,
      'Last-Modified': item.lastModified,
      'x-amz-meta-sha256': item.sha256,
    });
    res.end();
    return;
  }

  if (req.method === 'GET') {
    const item = storage.get(fullKey);
    if (!item) {
      res.writeHead(404, { 'Content-Type': 'application/xml' });
      res.end('<Error><Code>NoSuchKey</Code></Error>');
      return;
    }
    res.writeHead(200, {
      'Content-Type': item.contentType,
      'Content-Length': item.buffer.length,
      ETag: item.etag,
      'Last-Modified': item.lastModified,
      'x-amz-meta-sha256': item.sha256,
    });
    res.end(item.buffer);
    return;
  }

  if (req.method === 'DELETE') {
    storage.delete(fullKey);
    res.writeHead(204);
    res.end();
    return;
  }

  res.writeHead(405);
  res.end();
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Standalone Mock S3 Server listening on port ${PORT}`);
});
