/**
 * Dev proxy → production API.
 * Timeouts / unreachable host are handled quietly so the terminal stays clean;
 * the Angular app already falls back when API calls fail.
 */
module.exports = {
  '/api': {
    target: 'https://waseela.somee.com',
    secure: true,
    changeOrigin: true,
    logLevel: 'silent',
    timeout: 20000,
    proxyTimeout: 20000,
    onError(err, _req, res) {
      if (res.headersSent || res.writableEnded) {
        return;
      }
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, message: 'upstream_unavailable' }));
    },
  },
};
