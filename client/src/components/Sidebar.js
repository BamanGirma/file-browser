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
  const [tree, setTree] = useState({}); // { path: { expanded, children } }
  const [loading, setLoading] = useState({}); // { path: bool }

  // Auto-expand root folders initially
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
        // Init child nodes
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

  const toggle = useCallback(
    async (folderPath) => {
      const node = tree[folderPath];
      if (!node) return;

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
      onSelectFolder(folderPath);
    },
    [tree, loadChildren, onSelectFolder],
  );

  function renderNode(folder, depth = 0) {
    const node = tree[folder.path] || {};
    const isExpanded = node.expanded;
    const children = node.children || [];
    const isLoading = loading[folder.path];
    const isSelected = currentPath === folder.path;

    return (
      <div key={folder.path}>
        <button
          style={{
            ...styles.nodeBtn,
            paddingLeft: 10 + depth * 16,
            background: isSelected ? "#1e3a5f" : "transparent",
            color: isSelected ? "#93c5fd" : "#cbd5e1",
          }}
          onClick={() => toggle(folder.path)}
          title={folder.path}
        >
          {/* Expand arrow */}
          <span style={styles.arrow}>
            {isLoading ? (
              <span style={{ ...styles.miniSpinner }} />
            ) : isExpanded ? (
              <ChevronDown size={12} color="#64748b" />
            ) : (
              <ChevronRight size={12} color="#64748b" />
            )}
          </span>

          {isExpanded ? (
            <FolderOpen size={15} color="#f59e0b" style={{ flexShrink: 0 }} />
          ) : (
            <Folder size={15} color="#fbbf24" style={{ flexShrink: 0 }} />
          )}

          <span style={styles.nodeName}>{folder.name}</span>
        </button>

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
            {/* Root drive label */}
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
  nodeBtn: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    width: "100%",
    border: "none",
    cursor: "pointer",
    fontSize: 13,
    padding: "5px 10px",
    textAlign: "left",
    borderRadius: 4,
    margin: "1px 4px",
    transition: "background 0.1s",
  },
  arrow: {
    width: 14,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
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
