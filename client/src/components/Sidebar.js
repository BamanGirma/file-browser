import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  HardDrive,
} from "lucide-react";

export default function Sidebar({ rootFolders, currentPath, onSelectFolder }) {
  const [tree, setTree] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    if (rootFolders.length === 0) return;
    const initial = {};
    rootFolders.forEach((f) => {
      initial[f.path] = { expanded: false, children: null };
    });
    setTree(initial);
  }, [rootFolders]);

  const loadChildren = useCallback(async (folderPath) => {
    setLoading((l) => ({ ...l, [folderPath]: true }));
    try {
      const { data } = await axios.get("/api/list", {
        params: { path: folderPath },
      });
      const folders = data.filter((e) => e.isFolder);
      setTree((prev) => ({
        ...prev,
        [folderPath]: { ...prev[folderPath], children: folders },
        ...Object.fromEntries(
          folders
            .filter((f) => !prev[f.path])
            .map((f) => [f.path, { expanded: false, children: null }]),
        ),
      }));
    } catch {
      setTree((prev) => ({
        ...prev,
        [folderPath]: { ...prev[folderPath], children: [] },
      }));
    } finally {
      setLoading((l) => ({ ...l, [folderPath]: false }));
    }
  }, []);

  // ── Toggle expand/collapse WITHOUT navigating ──────────────
  const toggleExpand = useCallback(
    async (folderPath, e) => {
      // Stop the event from bubbling to the name click
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }

      const node = tree[folderPath];
      if (!node) return;

      // Load children if not loaded yet
      if (!node.expanded && node.children === null) {
        await loadChildren(folderPath);
      }

      setTree((prev) => ({
        ...prev,
        [folderPath]: {
          ...prev[folderPath],
          expanded: !prev[folderPath].expanded,
        },
      }));
    },
    [tree, loadChildren],
  );

  // ── Navigate to folder (select it) ────────────────────────
  const selectFolder = useCallback(
    (folderPath) => {
      onSelectFolder(folderPath);
    },
    [onSelectFolder],
  );

  function renderNode(folder, depth = 0) {
    const node = tree[folder.path] || {};
    const isExpanded = node.expanded;
    const children = node.children || [];
    const isLoading = loading[folder.path];
    const isSelected = currentPath === folder.path;

    return (
      <div key={folder.path}>
        <div
          style={{
            ...styles.nodeRow,
            paddingLeft: 10 + depth * 16,
            background: isSelected ? "#1e3a5f" : "transparent",
          }}
        >
          {/* ── Arrow button (expand/collapse only) ── */}
          <button
            style={styles.arrowBtn}
            onClick={(e) => toggleExpand(folder.path, e)}
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isLoading ? (
              <span style={styles.miniSpinner} />
            ) : isExpanded ? (
              <ChevronDown size={14} color="#64748b" />
            ) : (
              <ChevronRight size={14} color="#64748b" />
            )}
          </button>

          {/* ── Folder name button (navigate) ── */}
          <button
            style={{
              ...styles.nameBtn,
              color: isSelected ? "#93c5fd" : "#cbd5e1",
            }}
            onClick={() => selectFolder(folder.path)}
            title={folder.path}
          >
            {isExpanded ? (
              <FolderOpen size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
            ) : (
              <Folder size={15} color="#fbbf24" style={{ flexShrink: 0 }} />
            )}
            <span style={styles.nodeName}>{folder.name}</span>
          </button>
        </div>

        {/* Children */}
        {isExpanded && children.length > 0 && (
          <div>{children.map((child) => renderNode(child, depth + 1))}</div>
        )}
        {isExpanded && children.length === 0 && !isLoading && (
          <div
            style={{ ...styles.emptyMsg, paddingLeft: 16 + (depth + 1) * 16 }}
          >
            Empty
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={styles.sidebar}>
      <div style={styles.header}>
        <span style={styles.headerText}>FOLDERS</span>
      </div>
      <div style={styles.tree}>
        {rootFolders.map((rf) => (
          <div key={rf.path}>
            <div style={styles.rootLabel}>
              <HardDrive size={13} color="#3b82f6" />
              <span>{rf.path}</span>
            </div>
            {renderNode(rf, 0)}
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  sidebar: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  header: {
    padding: "12px 14px 8px",
    borderBottom: "1px solid #1e3a5f",
    flexShrink: 0,
  },
  headerText: {
    fontSize: 10,
    fontWeight: 700,
    color: "#475569",
    letterSpacing: "1px",
  },
  tree: { overflow: "auto", flex: 1, padding: "6px 0" },
  rootLabel: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    padding: "8px 14px 4px",
    fontSize: 10,
    color: "#475569",
    fontWeight: 600,
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  // ── Row: holds arrow + name side by side ──
  nodeRow: {
    display: "flex",
    alignItems: "center",
    gap: 0,
    margin: "1px 4px",
    borderRadius: 4,
    transition: "background 0.1s",
  },
  // ── Arrow button (expand only) ──
  arrowBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 28,
    background: "none",
    border: "none",
    cursor: "pointer",
    flexShrink: 0,
    borderRadius: 4,
    padding: 0,
  },
  // ── Folder name button (navigate) ──
  nameBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flex: 1,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    padding: "5px 6px",
    textAlign: "left",
    borderRadius: 4,
    minWidth: 0,
    color: "#cbd5e1",
  },
  nodeName: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    flex: 1,
  },
  emptyMsg: {
    fontSize: 11,
    color: "#334155",
    padding: "4px 0",
    fontStyle: "italic",
  },
  miniSpinner: {
    display: "inline-block",
    width: 10,
    height: 10,
    border: "1.5px solid #334155",
    borderTopColor: "#3b82f6",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
  },
};
