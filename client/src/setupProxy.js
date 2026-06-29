const { createProxyMiddleware } = require("http-proxy-middleware");
const fs = require("fs");
const path = require("path");

// ── Read port from config.json ────────────────────────────────
let port = 3001; // fallback default

try {
  // Go up from client/src → client → project root
  const configPath = path.join(__dirname, "..", "..", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  port = config.port || 3001;
  console.log(`[Proxy] Backend port from config.json: ${port}`);
} catch (e) {
  console.warn("[Proxy] Could not read config.json — using fallback port 3001");
}

module.exports = function (app) {
  app.use(
    "/api",
    createProxyMiddleware({
      target: `http://localhost:${port}`,
      changeOrigin: true,
      logLevel: "warn",
      onError: (err, req, res) => {
        console.error("[Proxy Error]", err.message);
        res.status(502).json({ error: "Backend not reachable" });
      },
    }),
  );
};
