const express = require("express");
const fs = require("fs");
const path = require("path");
const mime = require("mime-types");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// ─── Load Config ──────────────────────────────────────────────
const config = JSON.parse(
  fs.readFileSync(path.join(__dirname, "config.json"), "utf-8"),
);
const SHARED_FOLDERS = config.sharedFolders.map((f) => path.normalize(f));
const PORT = config.port || 3001;

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors({ origin: `http://localhost:${config.clientPort || 3000}` }));
app.use(express.json());

// ─── Hardcoded user ──────────────────────────────────────────
const user = {
  username: "admin",
  password: "admin123",
};

// ─── Security Helpers ────────────────────────────────────────

function resolveSafePath(userPath) {
  if (!userPath || typeof userPath !== "string") return null;
  const normalized = path.normalize(userPath);
  if (!path.isAbsolute(normalized)) return null;

  const allowed = SHARED_FOLDERS.some((root) => {
    const relative = path.relative(root, normalized);
    return !relative.startsWith("..") && !path.isAbsolute(relative);
  });

  return allowed ? normalized : null;
}

function isHiddenOrSystem(name) {
  const blocked = [
    "System Volume Information",
    "$Recycle.Bin",
    "$RECYCLE.BIN",
    "pagefile.sys",
    "hiberfil.sys",
    "swapfile.sys",
    "bootmgr",
    "BOOTNXT",
    "desktop.ini",
    "thumbs.db",
  ];
  return name.startsWith(".") || blocked.includes(name);
}

// ─── Config endpoint (exposes port to client) ────────────────
app.get("/api/config", (req, res) => {
  res.json({ port: PORT });
});

// ══════════════════════════════════════════════════════════════
// ALL API ROUTES MUST BE DEFINED BEFORE THE CATCH-ALL
// ══════════════════════════════════════════════════════════════

// ─── Login ───────────────────────────────────────────────────
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (username === user.username && password === user.password) {
    res.json({ success: true, message: "Login successful." });
  } else {
    res.status(401).json({ success: false, message: "Invalid credentials." });
  }
});

// ─── List root folders ───────────────────────────────────────
app.get("/api/folders", (req, res) => {
  const result = SHARED_FOLDERS.map((folder) => ({
    name: path.basename(folder),
    path: folder,
    isFolder: true,
  }));
  res.json(result);
});

// ─── List directory contents ─────────────────────────────────
app.get("/api/list", (req, res) => {
  const targetPath = resolveSafePath(req.query.path);
  if (!targetPath) {
    return res.status(400).json({ error: "Invalid or unauthorized path." });
  }

  let stat;
  try {
    stat = fs.statSync(targetPath);
  } catch {
    return res.status(404).json({ error: "Path not found." });
  }

  if (!stat.isDirectory()) {
    return res.status(400).json({ error: "Path is not a directory." });
  }

  let entries;
  try {
    entries = fs.readdirSync(targetPath, { withFileTypes: true });
  } catch (err) {
    return res
      .status(403)
      .json({ error: "Cannot read directory: " + err.message });
  }

  const result = entries
    .filter((entry) => !isHiddenOrSystem(entry.name))
    .map((entry) => {
      const fullPath = path.join(targetPath, entry.name);
      const isFolder = entry.isDirectory();
      let size = null;
      let modified = null;

      try {
        const s = fs.statSync(fullPath);
        size = isFolder ? null : s.size;
        modified = s.mtime.toISOString();
      } catch {}

      return {
        name: entry.name,
        path: fullPath,
        isFolder,
        size,
        modified,
        extension: isFolder ? null : path.extname(entry.name).toLowerCase(),
      };
    })
    .sort((a, b) => {
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  res.json(result);
});

// ─── View file (inline) ─────────────────────────────────────
app.get("/api/view", (req, res) => {
  console.log("[VIEW] Request received:", req.query.path);

  const targetPath = resolveSafePath(req.query.path);

  if (!targetPath) {
    console.log("[VIEW] Invalid path");
    return res.status(400).json({ error: "Invalid or unauthorized path." });
  }

  let stat;
  try {
    stat = fs.statSync(targetPath);
  } catch {
    console.log("[VIEW] File not found:", targetPath);
    return res.status(404).json({ error: "File not found." });
  }

  if (!stat.isFile()) {
    return res.status(400).json({ error: "Path is not a file." });
  }

  const fileName = path.basename(targetPath);
  const mimeType = mime.lookup(targetPath) || "application/octet-stream";
  const fileSize = stat.size;

  console.log(
    "[VIEW] Serving:",
    fileName,
    "Type:",
    mimeType,
    "Size:",
    fileSize,
  );

  // ── Range request support (for video/audio seeking) ────────
  const rangeHeader = req.headers.range;

  if (rangeHeader) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mimeType,
      "X-Content-Type-Options": "nosniff",
    });

    const stream = fs.createReadStream(targetPath, { start, end });
    stream.on("error", (err) => {
      console.error("[VIEW] Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream file." });
      }
    });
    stream.pipe(res);
  } else {
    // ── Normal full-file response ────────────────────────────
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", fileSize);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Accept-Ranges", "bytes");

    // Don't set Content-Disposition to attachment — we want inline viewing
    // For PDFs specifically, force inline
    if (mimeType === "application/pdf") {
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${encodeURIComponent(fileName)}"`,
      );
    }

    // Cache images for 1 hour
    if (mimeType.startsWith("image/")) {
      res.setHeader("Cache-Control", "public, max-age=3600");
    }

    const stream = fs.createReadStream(targetPath);
    stream.on("error", (err) => {
      console.error("[VIEW] Stream error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to stream file." });
      }
    });
    stream.pipe(res);
  }
});

// ─── Download file (attachment) ──────────────────────────────
app.get("/api/download", (req, res) => {
  const targetPath = resolveSafePath(req.query.path);

  if (!targetPath) {
    return res.status(400).json({ error: "Invalid or unauthorized path." });
  }

  let stat;
  try {
    stat = fs.statSync(targetPath);
  } catch {
    return res.status(404).json({ error: "File not found." });
  }

  if (!stat.isFile()) {
    return res.status(400).json({ error: "Path is not a file." });
  }

  const fileName = path.basename(targetPath);
  const mimeType = mime.lookup(targetPath) || "application/octet-stream";

  res.setHeader("Content-Type", mimeType);
  res.setHeader("Content-Length", stat.size);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(fileName)}"`,
  );
  res.setHeader("X-Content-Type-Options", "nosniff");

  const stream = fs.createReadStream(targetPath);
  stream.on("error", (err) => {
    console.error("Stream error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to stream file." });
    }
  });
  stream.pipe(res);
});

// ─── Search ──────────────────────────────────────────────────
app.get("/api/search", (req, res) => {
  const targetPath = resolveSafePath(req.query.path);
  const query = (req.query.query || "").toLowerCase().trim();

  if (!targetPath) {
    return res.status(400).json({ error: "Invalid or unauthorized path." });
  }

  if (!query) {
    return res.status(400).json({ error: "Search query is required." });
  }

  const results = [];

  function searchDir(dirPath, depth = 0) {
    if (depth > 4) return;

    let entries;
    try {
      entries = fs.readdirSync(dirPath, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (isHiddenOrSystem(entry.name)) continue;

      if (entry.name.toLowerCase().includes(query)) {
        const fullPath = path.join(dirPath, entry.name);
        const isFolder = entry.isDirectory();
        let size = null;
        let modified = null;

        try {
          const s = fs.statSync(fullPath);
          size = isFolder ? null : s.size;
          modified = s.mtime.toISOString();
        } catch {}

        results.push({
          name: entry.name,
          path: fullPath,
          isFolder,
          size,
          modified,
          extension: isFolder ? null : path.extname(entry.name).toLowerCase(),
        });
      }

      if (entry.isDirectory()) {
        searchDir(path.join(dirPath, entry.name), depth + 1);
      }
    }
  }

  searchDir(targetPath);
  res.json(results.slice(0, 200));
});

// ══════════════════════════════════════════════════════════════
// STATIC FILES + CATCH-ALL — MUST BE LAST!
// ══════════════════════════════════════════════════════════════

// Serve React build
app.use(express.static(path.join(__dirname, "client", "build")));

// Catch-all: serve React index.html (MUST be after all /api routes)
app.get("*", (req, res) => {
  const indexPath = path.join(__dirname, "client", "build", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <h2>Backend is running on port ${PORT}</h2>
      <p>Run <code>npm run build-client</code> to build the React frontend,
      or use <code>npm run dev</code> to run both servers.</p>
    `);
  }
});

// ─── Start Server ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✅ File Browser Backend running at http://localhost:${PORT}`);
  console.log(`📁 Shared folders:`);
  SHARED_FOLDERS.forEach((f) => console.log(`   • ${f}`));
  console.log(`\n📌 API Routes:`);
  console.log(`   • GET  /api/folders`);
  console.log(`   • GET  /api/list?path=...`);
  console.log(`   • GET  /api/view?path=...`);
  console.log(`   • GET  /api/download?path=...`);
  console.log(`   • GET  /api/search?path=...&query=...`);
  console.log(`   • POST /api/login`);
  console.log(`\nOpen http://localhost:3000 in your browser.\n`);
});
