import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Login from "./login";

import Sidebar from "./components/Sidebar";
import FileList from "./components/FileList";
import Breadcrumbs from "./components/Breadcrumbs";
import SearchBar from "./components/SearchBar";
import { HardDrive, AlertCircle, Menu, X, LogOut } from "lucide-react";

const API = axios.create({ 
  baseURL: "http://localhost:3001" 
});

export default function App() {
  const [isAuth, setIsAuth] = useState(false);
  const [rootFolders, setRootFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isDragging, setIsDragging] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const auth = localStorage.getItem("isAuth");
    if (auth === "true") setIsAuth(true);
  }, []);

  useEffect(() => {
    if (!isAuth) return;
    API.get("/api/folders")
      .then((r) => {
        setRootFolders(r.data);
        if (r.data.length > 0) loadFolder(r.data[0].path, true);
      })
      .catch(() =>
        setError("Cannot connect to backend. Is the server running?"),
      );
  }, [isAuth]);

  const handleLoginSuccess = () => {
    localStorage.setItem("isAuth", "true");
    setIsAuth(true);
  };

  const logout = () => {
    localStorage.removeItem("isAuth");
    setIsAuth(false);
    setRootFolders([]);
    setCurrentPath(null);
    setEntries([]);
    setSearchResults(null);
    setHistory([]);
    setHistoryIndex(-1);
  };

  const loadFolder = useCallback(
    (folderPath, isInitial = false) => {
      setLoading(true);
      setError(null);
      setSearchQuery("");
      setSearchResults(null);
      setCurrentPath(folderPath);

      if (!isInitial) {
        setHistory((prev) => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(folderPath);
          return newHistory;
        });
        setHistoryIndex((prev) => prev + 1);
      } else {
        setHistory([folderPath]);
        setHistoryIndex(0);
      }

      if (isMobile) setSidebarOpen(false);

      API.get("/api/list", { params: { path: folderPath } })
        .then((r) => {
          setEntries(r.data);
          setLoading(false);
        })
        .catch((e) => {
          setError(e.response?.data?.error || "Failed to load folder.");
          setLoading(false);
        });
    },
    [historyIndex, isMobile],
  );

  const goBack = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const prevPath = history[newIndex];
    setHistoryIndex(newIndex);
    setCurrentPath(prevPath);
    setLoading(true);
    setError(null);
    setSearchQuery("");
    setSearchResults(null);
    API.get("/api/list", { params: { path: prevPath } })
      .then((r) => {
        setEntries(r.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.response?.data?.error || "Failed to load folder.");
        setLoading(false);
      });
  }, [history, historyIndex]);

  const goForward = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const nextPath = history[newIndex];
    setHistoryIndex(newIndex);
    setCurrentPath(nextPath);
    setLoading(true);
    setError(null);
    setSearchQuery("");
    setSearchResults(null);
    API.get("/api/list", { params: { path: nextPath } })
      .then((r) => {
        setEntries(r.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.response?.data?.error || "Failed to load folder.");
        setLoading(false);
      });
  }, [history, historyIndex]);

  const goUp = useCallback(() => {
    if (!currentPath) return;
    const parts = currentPath.replace(/[/\\]+$/, "").split(/[/\\]/);
    if (parts.length <= 1) return;
    parts.pop();
    const parentPath = parts.join("\\");
    const isAboveRoot = !rootFolders.some(
      (r) => parentPath.startsWith(r.path) || r.path.startsWith(parentPath),
    );
    if (isAboveRoot) return;
    loadFolder(parentPath);
  }, [currentPath, rootFolders, loadFolder]);

  const handleSearch = useCallback(
    (query) => {
      setSearchQuery(query);
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }
      const searchRoot = currentPath || rootFolders[0]?.path;
      if (!searchRoot) return;
      setLoading(true);
      API.get("/api/search", { params: { path: searchRoot, query } })
        .then((r) => {
          setSearchResults(r.data);
          setLoading(false);
        })
        .catch(() => {
          setSearchResults([]);
          setLoading(false);
        });
    },
    [currentPath, rootFolders],
  );

  const startResize = useCallback(
    (e) => {
      if (isMobile) return;
      e.preventDefault();
      setIsDragging(true);
      const startX = e.clientX;
      const startW = sidebarWidth;
      const onMove = (ev) => {
        const newW = Math.min(480, Math.max(180, startW + ev.clientX - startX));
        setSidebarWidth(newW);
      };
      const onUp = () => {
        setIsDragging(false);
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [sidebarWidth, isMobile],
  );

  if (!isAuth) return <Login onLogin={handleLoginSuccess} />;

  const displayEntries = searchResults !== null ? searchResults : entries;
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  const canGoUp = currentPath
    ? !rootFolders.some((r) => r.path === currentPath)
    : false;

  return (
    <div style={styles.appWrapper}>
      {/* ── TOP BAR ───────────────────────────────────────── */}
      <header style={styles.topBar}>
        {/* LEFT: Hamburger + Logo */}
        <div style={styles.topLeft}>
          {isMobile && (
            <button
              style={styles.iconBtn}
              onClick={() => setSidebarOpen((o) => !o)}
            >
              {sidebarOpen ? (
                <X size={20} color="#94a3b8" />
              ) : (
                <Menu size={20} color="#94a3b8" />
              )}
            </button>
          )}
          <HardDrive size={18} color="#3b82f6" style={{ flexShrink: 0 }} />
          {!isMobile && <span style={styles.brandText}>FileBrowser</span>}
        </div>

        {/* MIDDLE: Nav buttons + breadcrumb */}
        <div style={styles.navArea}>
          <button
            style={{
              ...styles.navBtn,
              opacity: canGoBack ? 1 : 0.3,
            }}
            onClick={goBack}
            disabled={!canGoBack}
            title="Go Back"
          >
            ‹
          </button>

          <button
            style={{
              ...styles.navBtn,
              opacity: canGoForward ? 1 : 0.3,
            }}
            onClick={goForward}
            disabled={!canGoForward}
            title="Go Forward"
          >
            ›
          </button>

          <button
            style={{
              ...styles.navBtn,
              opacity: canGoUp ? 1 : 0.3,
            }}
            onClick={goUp}
            disabled={!canGoUp}
            title="Go Up"
          >
            ↑
          </button>

          {/* Breadcrumb bar — desktop only */}
          {!isMobile && (
            <div style={styles.breadcrumbWrap}>
              <Breadcrumbs
                currentPath={currentPath}
                rootFolders={rootFolders}
                onNavigate={loadFolder}
              />
            </div>
          )}
        </div>

        {/* RIGHT: Single search + Logout — ALWAYS VISIBLE */}
        <div style={styles.topRight}>
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder={
              currentPath
                ? `Search in ${currentPath.split(/[/\\]/).pop()}…`
                : "Search…"
            }
          />
          <button onClick={logout} style={styles.logoutBtn} title="Logout">
            {isMobile ? <LogOut size={16} color="white" /> : "Logout"}
          </button>
        </div>
      </header>

      {/* Breadcrumb row on mobile */}
      {isMobile && currentPath && (
        <div style={styles.mobileBreadcrumb}>
          <Breadcrumbs
            currentPath={currentPath}
            rootFolders={rootFolders}
            onNavigate={loadFolder}
          />
        </div>
      )}

      {/* ── MAIN AREA ─────────────────────────────────────── */}
      <div style={styles.mainArea}>
        {/* Backdrop */}
        {isMobile && sidebarOpen && (
          <div style={styles.backdrop} onClick={() => setSidebarOpen(false)} />
        )}

        {/* SIDEBAR */}
        {(!isMobile || sidebarOpen) && (
          <aside
            style={{
              ...styles.sidebar,
              width: isMobile ? "75vw" : sidebarWidth,
              minWidth: isMobile ? "75vw" : sidebarWidth,
              position: isMobile ? "absolute" : "relative",
              top: 0,
              left: 0,
              height: "100%",
              zIndex: isMobile ? 100 : "auto",
              boxShadow: isMobile ? "4px 0 24px rgba(0,0,0,0.5)" : "none",
            }}
          >
            <Sidebar
              rootFolders={rootFolders}
              currentPath={currentPath}
              onSelectFolder={loadFolder}
            />
          </aside>
        )}

        {/* Drag handle (desktop only) */}
        {!isMobile && (
          <div
            style={{
              ...styles.dragHandle,
              background: isDragging ? "#3b82f6" : "#1e3a5f",
            }}
            onMouseDown={startResize}
          />
        )}

        {/* MAIN FILE AREA */}
        <main style={styles.main}>
          {error && (
            <div style={styles.errorBanner}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
          {loading ? (
            <div style={styles.centerMsg}>
              <div className="spinner" />
              <span style={{ marginTop: 12, color: "#64748b" }}>Loading…</span>
            </div>
          ) : (
            <FileList
              entries={displayEntries}
              currentPath={currentPath}
              isSearching={searchResults !== null}
              searchQuery={searchQuery}
              onFolderClick={loadFolder}
              isMobile={isMobile}
            />
          )}
        </main>
      </div>

      {/* ── STATUS BAR ────────────────────────────────────── */}
      <footer style={styles.statusBar}>
        <span style={styles.statusText}>
          {searchResults !== null
            ? `${searchResults.length} result(s) for "${searchQuery}"`
            : `${entries.filter((e) => !e.isFolder).length} files, ${
                entries.filter((e) => e.isFolder).length
              } folders`}
        </span>
        <span style={{ color: "#334155", flexShrink: 0 }}>Read-only</span>
      </footer>
    </div>
  );
}

const styles = {
  appWrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    overflow: "hidden",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "0 10px",
    height: 52,
    background: "#1e293b",
    borderBottom: "1px solid #1e3a5f",
    flexShrink: 0,
    zIndex: 200,
    minWidth: 0,
  },
  topLeft: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  brandText: {
    fontWeight: 700,
    fontSize: 15,
    color: "#f1f5f9",
    whiteSpace: "nowrap",
  },
  navArea: {
    display: "flex",
    alignItems: "center",
    gap: 3,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  navBtn: {
    background: "#0f172a",
    border: "1px solid #1e3a5f",
    color: "#94a3b8",
    borderRadius: 5,
    width: 28,
    height: 28,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    flexShrink: 0,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  breadcrumbWrap: {
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    background: "#0f172a",
    border: "1px solid #1e3a5f",
    borderRadius: 5,
    padding: "0 8px",
    height: 28,
    display: "flex",
    alignItems: "center",
  },
  topRight: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "5px 10px",
    minWidth: 32,
    height: 32,
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  iconBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex",
    alignItems: "center",
    borderRadius: 4,
    flexShrink: 0,
  },
  mobileBreadcrumb: {
    padding: "5px 10px",
    background: "#0f172a",
    borderBottom: "1px solid #1e3a5f",
    overflowX: "auto",
    flexShrink: 0,
    whiteSpace: "nowrap",
  },
  mainArea: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    position: "relative",
  },
  backdrop: {
    position: "absolute",
    inset: 0,
    background: "rgba(0,0,0,0.55)",
    zIndex: 99,
  },
  sidebar: {
    background: "#1e293b",
    borderRight: "1px solid #1e3a5f",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
  dragHandle: {
    width: 4,
    cursor: "col-resize",
    flexShrink: 0,
    transition: "background 0.15s",
  },
  main: {
    flex: 1,
    overflow: "auto",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    background: "#7f1d1d",
    color: "#fca5a5",
    flexShrink: 0,
  },
  centerMsg: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "4px 12px",
    background: "#1e293b",
    fontSize: 12,
    color: "#64748b",
    flexShrink: 0,
    gap: 8,
    minWidth: 0,
  },
  statusText: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    minWidth: 0,
  },
};
