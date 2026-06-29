import React, { useState, useEffect } from "react";
import { X, Maximize2, Minimize2, AlertCircle } from "lucide-react";
import FileIcon from "./FileIcon";

function getFileType(fileName) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  const imageExts = ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico"];
  const videoExts = ["mp4", "webm", "ogg", "mov"];
  const audioExts = ["mp3", "wav", "flac", "aac", "ogg", "m4a"];
  const pdfExts = ["pdf"];
  const textExts = [
    "txt",
    "md",
    "log",
    "ini",
    "cfg",
    "conf",
    "js",
    "jsx",
    "ts",
    "tsx",
    "py",
    "java",
    "cs",
    "cpp",
    "c",
    "go",
    "rb",
    "php",
    "html",
    "htm",
    "css",
    "scss",
    "less",
    "json",
    "xml",
    "yaml",
    "yml",
    "toml",
    "sh",
    "bat",
    "ps1",
    "cmd",
    "sql",
    "env",
    "gitignore",
    "dockerignore",
    "makefile",
    "dockerfile",
    "csv",
    "rtf",
  ];

  if (pdfExts.includes(ext)) return "pdf";
  if (imageExts.includes(ext)) return "image";
  if (videoExts.includes(ext)) return "video";
  if (audioExts.includes(ext)) return "audio";
  if (textExts.includes(ext)) return "text";
  return "unknown";
}

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function FileViewer({ file, onClose, isMobile }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendPort, setBackendPort] = useState(null);

  const fileType = getFileType(file.name);

  // ── Relative URL — goes through proxy (works for fetch) ───
  const proxyUrl = `/api/view?path=${encodeURIComponent(file.path)}`;

  // ── Cleanup blob on unmount ────────────────────────────────
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  // ── Get backend port once (for video/audio direct URL) ────
  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => setBackendPort(data.port || 3001))
      .catch(() => setBackendPort(3001));
  }, []);

  // ── Load file ─────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    setBlobUrl(null);
    setTextContent(null);

    if (fileType === "pdf" || fileType === "image") {
      // Use relative URL through proxy — fetch as blob
      fetch(proxyUrl)
        .then((res) => {
          if (!res.ok)
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          return res.blob();
        })
        .then((blob) => {
          const objectUrl = URL.createObjectURL(blob);
          setBlobUrl(objectUrl);
          setLoading(false);
        })
        .catch((err) => {
          console.error("[FileViewer] fetch error:", err);
          setError(err.message || "Failed to load file");
          setLoading(false);
        });
    } else if (fileType === "text") {
      // Use relative URL through proxy — fetch as text
      fetch(proxyUrl)
        .then((res) => {
          if (!res.ok)
            throw new Error(`Server error: ${res.status} ${res.statusText}`);
          return res.text();
        })
        .then((text) => {
          setTextContent(text);
          setLoading(false);
        })
        .catch((err) => {
          console.error("[FileViewer] fetch error:", err);
          setError(err.message || "Failed to load file");
          setLoading(false);
        });
    } else {
      // video / audio — no prefetch needed
      setLoading(false);
    }
  }, [file.path, fileType, proxyUrl]);

  // ── Close on Escape ────────────────────────────────────────
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  // ── Prevent body scroll ────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // ── Direct URL for video/audio (needs direct backend URL) ─
  // Video/audio HTML elements don't go through fetch proxy
  const getDirectUrl = () => {
    const port = backendPort || 3001;
    return `${window.location.protocol}//${window.location.hostname}:${port}/api/view?path=${encodeURIComponent(file.path)}`;
  };

  // ── Render content ─────────────────────────────────────────
  const renderContent = () => {
    if (loading) {
      return (
        <div style={styles.centerMsg}>
          <div className="spinner" />
          <span style={{ marginTop: 14, color: "#64748b", fontSize: 14 }}>
            Loading {file.name}…
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div style={styles.centerMsg}>
          <AlertCircle size={36} color="#ef4444" />
          <p style={{ marginTop: 12, color: "#f87171", fontSize: 14 }}>
            Failed to load file
          </p>
          <p style={{ marginTop: 4, color: "#64748b", fontSize: 12 }}>
            {error}
          </p>
        </div>
      );
    }

    switch (fileType) {
      case "pdf":
        return <iframe src={blobUrl} title={file.name} style={styles.iframe} />;

      case "image":
        return (
          <div style={styles.imageContainer}>
            <img
              src={blobUrl}
              alt={file.name}
              style={styles.image}
              draggable={false}
            />
          </div>
        );

      case "video":
        return (
          <div style={styles.mediaContainer}>
            <video
              key={file.path}
              controls
              autoPlay={false}
              style={styles.video}
              preload="metadata"
            >
              <source src={getDirectUrl()} />
              Your browser does not support video.
            </video>
          </div>
        );

      case "audio":
        return (
          <div style={styles.audioContainer}>
            <div style={styles.audioIconWrap}>
              <FileIcon name={file.name} isFolder={false} size={80} />
            </div>
            <p style={styles.audioName}>{file.name}</p>
            <p style={styles.audioSize}>{formatSize(file.size)}</p>
            <audio
              key={file.path}
              controls
              autoPlay={false}
              style={styles.audio}
              preload="metadata"
            >
              <source src={getDirectUrl()} />
              Your browser does not support audio.
            </audio>
          </div>
        );

      case "text":
        return (
          <div style={styles.textContainer}>
            <div style={styles.textTopBar}>
              <span style={styles.textLang}>
                {file.name.split(".").pop()?.toUpperCase()}
              </span>
              <span style={styles.textLines}>
                {textContent ? textContent.split("\n").length : 0} lines
              </span>
            </div>
            <div style={styles.textBody}>
              <div style={styles.lineNumbers}>
                {textContent &&
                  textContent.split("\n").map((_, i) => (
                    <div key={i} style={styles.lineNum}>
                      {i + 1}
                    </div>
                  ))}
              </div>
              <pre style={styles.pre}>{textContent}</pre>
            </div>
          </div>
        );

      default:
        return (
          <div style={styles.centerMsg}>
            <FileIcon name={file.name} isFolder={false} size={64} />
            <p style={{ marginTop: 16, color: "#e2e8f0", fontSize: 16 }}>
              {file.name}
            </p>
            <p
              style={{
                marginTop: 8,
                color: "#64748b",
                fontSize: 13,
                textAlign: "center",
                maxWidth: 300,
              }}
            >
              This file type cannot be previewed in the browser.
            </p>
          </div>
        );
    }
  };

  const isFullscreenMode = isFullscreen || isMobile;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div
        style={{
          ...styles.modal,
          ...(isFullscreenMode ? styles.modalFullscreen : {}),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────── */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <FileIcon name={file.name} isFolder={false} size={18} />
            <span style={styles.headerTitle}>{file.name}</span>
            <span style={styles.headerSize}>{formatSize(file.size)}</span>
          </div>

          <div style={styles.headerRight}>
            {!isMobile && (
              <button
                style={styles.iconBtn}
                onClick={() => setIsFullscreen((f) => !f)}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 size={16} color="#94a3b8" />
                ) : (
                  <Maximize2 size={16} color="#94a3b8" />
                )}
              </button>
            )}
            <button
              style={styles.closeBtn}
              onClick={onClose}
              title="Close (Esc)"
            >
              <X size={16} color="#fff" />
            </button>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────── */}
        <div style={styles.content}>{renderContent()}</div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    backdropFilter: "blur(6px)",
    padding: 16,
  },
  modal: {
    background: "#0f172a",
    border: "1px solid #1e3a5f",
    borderRadius: 12,
    display: "flex",
    flexDirection: "column",
    width: "90vw",
    height: "90vh",
    maxWidth: 1200,
    overflow: "hidden",
    boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
  },
  modalFullscreen: {
    width: "100vw",
    height: "100vh",
    maxWidth: "100vw",
    borderRadius: 0,
    border: "none",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 14px",
    background: "#1e293b",
    borderBottom: "1px solid #1e3a5f",
    flexShrink: 0,
    minHeight: 46,
    gap: 8,
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#e2e8f0",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  headerSize: {
    fontSize: 11,
    color: "#475569",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    borderRadius: 6,
  },
  closeBtn: {
    background: "#ef4444",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  content: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    background: "#080e1a",
    position: "relative",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    flex: 1,
    display: "block",
  },
  imageContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "auto",
    padding: 24,
    background: "#080e1a",
  },
  image: {
    maxWidth: "100%",
    maxHeight: "100%",
    objectFit: "contain",
    borderRadius: 6,
    userSelect: "none",
    boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
  },
  mediaContainer: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#000",
    padding: 8,
  },
  video: {
    maxWidth: "100%",
    maxHeight: "100%",
    outline: "none",
    borderRadius: 4,
  },
  audioContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 40,
    background: "linear-gradient(180deg, #0f172a 0%, #1a1a2e 100%)",
  },
  audioIconWrap: { opacity: 0.65 },
  audioName: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: 600,
    textAlign: "center",
    wordBreak: "break-word",
    marginTop: 8,
  },
  audioSize: { color: "#475569", fontSize: 12 },
  audio: { width: "100%", maxWidth: 480, marginTop: 12 },
  textContainer: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  textTopBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "5px 16px",
    background: "#1e293b",
    borderBottom: "1px solid #1e3a5f",
    flexShrink: 0,
  },
  textLang: {
    fontSize: 11,
    fontWeight: 700,
    color: "#60a5fa",
    background: "#172554",
    padding: "2px 8px",
    borderRadius: 4,
  },
  textLines: { fontSize: 11, color: "#475569" },
  textBody: {
    flex: 1,
    display: "flex",
    overflow: "auto",
  },
  lineNumbers: {
    padding: "14px 0",
    background: "#0d1526",
    borderRight: "1px solid #1e293b",
    userSelect: "none",
    flexShrink: 0,
    minWidth: 52,
    textAlign: "right",
  },
  lineNum: {
    padding: "0 12px 0 8px",
    fontSize: 12,
    lineHeight: "1.6",
    color: "#334155",
    fontFamily: "'Cascadia Code','Fira Code','Consolas',monospace",
  },
  pre: {
    margin: 0,
    padding: "14px 20px",
    fontFamily: "'Cascadia Code','Fira Code','Consolas',monospace",
    fontSize: 13,
    lineHeight: 1.6,
    color: "#e2e8f0",
    whiteSpace: "pre",
    background: "transparent",
    tabSize: 4,
    flex: 1,
    overflow: "visible",
  },
  centerMsg: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
};
