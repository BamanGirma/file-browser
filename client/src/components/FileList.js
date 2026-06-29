import React, { useState } from "react";
import { Folder, File, ArrowUp, ArrowDown } from "lucide-react";
import FileIcon from "./FileIcon";

function formatSize(bytes) {
  if (bytes === null || bytes === undefined) return "—";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function highlight(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark
        style={{
          background: "#1d4ed8",
          color: "#bfdbfe",
          borderRadius: 2,
          padding: "0 2px",
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function FileList({
  entries,
  currentPath,
  isSearching,
  searchQuery,
  onFolderClick,
  isMobile,
}) {
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [hoveredRow, setHovered] = useState(null);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = [...entries].sort((a, b) => {
    if (!isSearching && a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    let cmp = 0;
    if (sortKey === "name")
      cmp = a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    if (sortKey === "size") cmp = (a.size ?? -1) - (b.size ?? -1);
    if (sortKey === "modified")
      cmp = new Date(a.modified) - new Date(b.modified);
    return sortDir === "asc" ? cmp : -cmp;
  });

  const SortIcon = ({ k }) => {
    if (sortKey !== k) return null;
    return sortDir === "asc" ? (
      <ArrowUp size={11} style={{ marginLeft: 4 }} />
    ) : (
      <ArrowDown size={11} style={{ marginLeft: 4 }} />
    );
  };

  if (entries.length === 0 && !isSearching) {
    return (
      <div style={styles.empty}>
        <Folder size={48} color="#1e3a5f" style={{ marginBottom: 12 }} />
        <p style={{ color: "#475569" }}>This folder is empty</p>
      </div>
    );
  }

  if (isSearching && entries.length === 0) {
    return (
      <div style={styles.empty}>
        <File size={48} color="#1e3a5f" style={{ marginBottom: 12 }} />
        <p style={{ color: "#475569" }}>
          No results for "<strong>{searchQuery}</strong>"
        </p>
      </div>
    );
  }

  // ── Mobile card view ───────────────────────────────────────
  if (isMobile) {
    return (
      <div style={styles.container} className="fade-in">
        {isSearching && (
          <div style={styles.searchBanner}>
            🔍 Results for "<strong>{searchQuery}</strong>"
          </div>
        )}
        <div style={styles.cardGrid}>
          {sorted.map((entry) => (
            <div
              key={entry.path}
              style={{
                ...styles.card,
                background: hoveredRow === entry.path ? "#1a2744" : "#13213a",
                cursor: entry.isFolder ? "pointer" : "default",
              }}
              onClick={() => entry.isFolder && onFolderClick(entry.path)}
              onTouchStart={() => setHovered(entry.path)}
              onTouchEnd={() => setHovered(null)}
            >
              <div style={styles.cardIcon}>
                <FileIcon name={entry.name} isFolder={entry.isFolder} />
              </div>
              <div style={styles.cardInfo}>
                <div
                  style={{
                    ...styles.cardName,
                    color: entry.isFolder ? "#60a5fa" : "#e2e8f0",
                  }}
                >
                  {highlight(entry.name, searchQuery)}
                </div>
                <div style={styles.cardMeta}>
                  {!entry.isFolder && <span>{formatSize(entry.size)}</span>}
                  <span>{formatDate(entry.modified)}</span>
                </div>
                {isSearching && (
                  <div style={styles.cardPath} title={entry.path}>
                    {entry.path}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Desktop table view ─────────────────────────────────────
  return (
    <div style={styles.container} className="fade-in">
      {isSearching && (
        <div style={styles.searchBanner}>
          🔍 Search results for "<strong>{searchQuery}</strong>" in{" "}
          {currentPath}
        </div>
      )}

      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            {[
              { key: "name", label: "Name", width: "50%" },
              { key: "size", label: "Size", width: "15%" },
              { key: "modified", label: "Date Modified", width: "25%" },
            ].map(({ key, label, width }) => (
              <th
                key={key}
                style={{ ...styles.th, width }}
                onClick={() => handleSort(key)}
              >
                {label}
                <SortIcon k={key} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr
              key={entry.path}
              style={{
                ...styles.row,
                background:
                  hoveredRow === entry.path ? "#1a2744" : "transparent",
                cursor: entry.isFolder ? "pointer" : "default",
              }}
              onMouseEnter={() => setHovered(entry.path)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => entry.isFolder && onFolderClick(entry.path)}
            >
              <td style={styles.td}>
                <div style={styles.nameCell}>
                  <FileIcon name={entry.name} isFolder={entry.isFolder} />
                  <span
                    style={{
                      ...styles.fileName,
                      color: entry.isFolder ? "#60a5fa" : "#e2e8f0",
                    }}
                  >
                    {highlight(entry.name, searchQuery)}
                  </span>
                  {isSearching && (
                    <span style={styles.pathHint} title={entry.path}>
                      {entry.path.replace(entry.name, "").slice(0, -1)}
                    </span>
                  )}
                </div>
              </td>
              <td style={{ ...styles.td, color: "#64748b", fontSize: 12 }}>
                {formatSize(entry.size)}
              </td>
              <td style={{ ...styles.td, color: "#64748b", fontSize: 12 }}>
                {formatDate(entry.modified)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles = {
  container: { flex: 1, overflow: "auto" },
  empty: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "60vh",
    color: "#475569",
  },
  searchBanner: {
    padding: "10px 16px",
    background: "#172554",
    color: "#93c5fd",
    fontSize: 13,
    borderBottom: "1px solid #1e3a5f",
  },
  // Desktop table
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13 },
  thead: { position: "sticky", top: 0, zIndex: 5 },
  th: {
    padding: "10px 16px",
    textAlign: "left",
    fontSize: 11,
    fontWeight: 600,
    color: "#475569",
    background: "#0f172a",
    borderBottom: "1px solid #1e293b",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
  },
  row: {
    borderBottom: "1px solid #0f1e35",
    transition: "background 0.1s",
  },
  td: {
    padding: "9px 16px",
    verticalAlign: "middle",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 0,
  },
  nameCell: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
  },
  fileName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  pathHint: {
    fontSize: 11,
    color: "#334155",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    maxWidth: 200,
    marginLeft: 4,
  },
  // Mobile cards
  cardGrid: {
    display: "flex",
    flexDirection: "column",
    gap: 1,
  },
  card: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "10px 14px",
    borderBottom: "1px solid #0f1e35",
    transition: "background 0.1s",
    userSelect: "none",
  },
  cardIcon: {
    flexShrink: 0,
  },
  cardInfo: {
    flex: 1,
    overflow: "hidden",
    minWidth: 0,
  },
  cardName: {
    fontSize: 14,
    fontWeight: 500,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  cardMeta: {
    display: "flex",
    gap: 10,
    fontSize: 11,
    color: "#475569",
    marginTop: 2,
  },
  cardPath: {
    fontSize: 10,
    color: "#334155",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    marginTop: 2,
  },
};
