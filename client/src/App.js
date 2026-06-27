import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Login from "./login";

import Sidebar from "./components/Sidebar";
import FileList from "./components/FileList";
import Breadcrumbs from "./components/Breadcrumbs";
import SearchBar from "./components/SearchBar";
import { HardDrive, AlertCircle } from "lucide-react";

// ─── API ───────────────────────────────────────────────────────────────
const API = axios.create({ baseURL: "" });

// ─── APP ───────────────────────────────────────────────────────────────
export default function App() {
  // 🔐 AUTH STATE
  const [isAuth, setIsAuth] = useState(false);

  // ─── FILE STATE ──────────────────────────────────────────────────────
  const [rootFolders, setRootFolders] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isDragging, setIsDragging] = useState(false);

  // ─── CHECK AUTH ON LOAD ─────────────────────────────────────────────
  useEffect(() => {
    const auth = localStorage.getItem("isAuth");
    if (auth === "true") setIsAuth(true);
  }, []);

  // ─── LOAD ROOT FOLDERS ──────────────────────────────────────────────
  useEffect(() => {
    if (!isAuth) return;

    API.get("/api/folders")
      .then((r) => {
        setRootFolders(r.data);
        if (r.data.length > 0) loadFolder(r.data[0].path);
      })
      .catch(() =>
        setError("Cannot connect to backend. Is the server running?")
      );
  }, [isAuth]);

  // ─── LOGIN HANDLER ───────────────────────────────────────────────────
  const handleLoginSuccess = () => {
    localStorage.setItem("isAuth", "true");
    setIsAuth(true);
  };

  // ─── LOGOUT ──────────────────────────────────────────────────────────
  const logout = () => {
    localStorage.removeItem("isAuth");
    setIsAuth(false);

    // reset state
    setRootFolders([]);
    setCurrentPath(null);
    setEntries([]);
    setSearchResults(null);
  };

  // ─── LOAD FOLDER ─────────────────────────────────────────────────────
  const loadFolder = useCallback((folderPath) => {
    setLoading(true);
    setError(null);
    setSearchQuery("");
    setSearchResults(null);
    setCurrentPath(folderPath);

    API.get("/api/list", { params: { path: folderPath } })
      .then((r) => {
        setEntries(r.data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.response?.data?.error || "Failed to load folder.");
        setLoading(false);
      });
  }, []);

  // ─── SEARCH ──────────────────────────────────────────────────────────
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
    [currentPath, rootFolders]
  );

  // ─── SIDEBAR RESIZE ──────────────────────────────────────────────────
  const startResize = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(true);

      const startX = e.clientX;
      const startW = sidebarWidth;

      const onMove = (ev) => {
        const newW = Math.min(
          480,
          Math.max(180, startW + ev.clientX - startX)
        );
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
    [sidebarWidth]
  );

  // ─────────────────────────────────────────────────────────────
  // 🔐 SHOW LOGIN FIRST (IMPORTANT PART)
  // ─────────────────────────────────────────────────────────────
  if (!isAuth) {
    return <Login onLogin={handleLoginSuccess} />;
  }

  const displayEntries =
    searchResults !== null ? searchResults : entries;

  // ─────────────────────────────────────────────────────────────
  // MAIN APP UI
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ── TOP BAR ── */}
      <header style={styles.topBar}>
        <div style={styles.brand}>
          <HardDrive size={20} color="#3b82f6" />
          <span style={styles.brandText}>FileBrowser</span>
        </div>

        <div style={styles.topBarRight}>
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder={
              currentPath
                ? `Search in ${currentPath.split("\\").pop()}…`
                : "Search…"
            }
          />
        </div>

        {/* 🚪 Logout Button */}
        <button onClick={logout} style={styles.logoutBtn}>
          Logout
        </button>
      </header>

      {/* ── MAIN AREA ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* SIDEBAR */}
        <aside
          style={{
            ...styles.sidebar,
            width: sidebarWidth,
            minWidth: sidebarWidth,
          }}
        >
          <Sidebar
            rootFolders={rootFolders}
            currentPath={currentPath}
            onSelectFolder={loadFolder}
          />
        </aside>

        {/* DRAG HANDLE */}
        <div
          style={{
            ...styles.dragHandle,
            cursor: "col-resize",
            background: isDragging ? "#3b82f6" : undefined,
          }}
          onMouseDown={startResize}
        />

        {/* FILE LIST */}
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
              <span style={{ marginTop: 12, color: "#64748b" }}>
                Loading…
              </span>
            </div>
          ) : (
            <FileList
              entries={displayEntries}
              currentPath={currentPath}
              isSearching={searchResults !== null}
              searchQuery={searchQuery}
              onFolderClick={loadFolder}
            />
          )}
        </main>
      </div>

      {/* ── STATUS BAR ── */}
      <footer style={styles.statusBar}>
        <span>
          {searchResults !== null
            ? `${searchResults.length} result(s) for "${searchQuery}"`
            : `${entries.filter((e) => !e.isFolder).length} files, ${
                entries.filter((e) => e.isFolder).length
              } folders`}
        </span>

        <span style={{ color: "#334155" }}>Read-only mode</span>
      </footer>
    </div>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────
const styles = {
  topBar: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    padding: "0 16px",
    height: 52,
    background: "#1e293b",
    borderBottom: "1px solid #1e3a5f",
    flexShrink: 0,
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  brandText: {
    fontWeight: 700,
    fontSize: 16,
    color: "#f1f5f9",
  },
  topBarRight: {
    flex: 1,
  },
  logoutBtn: {
    padding: "6px 12px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
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
    background: "#1e3a5f",
  },
  main: {
    flex: 1,
    overflow: "auto",
    background: "#0f172a",
    display: "flex",
    flexDirection: "column",
  },
  errorBanner: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "10px 16px",
    background: "#7f1d1d",
    color: "#fca5a5",
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
    padding: "4px 16px",
    background: "#1e293b",
    fontSize: 12,
    color: "#64748b",
  },
};