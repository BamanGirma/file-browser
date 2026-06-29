import React from "react";
import { ChevronRight, Home } from "lucide-react";

export default function Breadcrumbs({ currentPath, rootFolders, onNavigate }) {
  if (!currentPath) return <div />;

  const root = rootFolders.find((r) => currentPath.startsWith(r.path));
  if (!root)
    return (
      <div style={styles.crumbs}>
        <span style={styles.crumb}>{currentPath}</span>
      </div>
    );

  const relative = currentPath.slice(root.path.length).replace(/^[/\\]+/, "");
  const parts = relative ? relative.split(/[/\\]/).filter(Boolean) : [];

  const crumbs = [
    { label: root.name, path: root.path },
    ...parts.map((part, i) => ({
      label: part,
      path: root.path + "\\" + parts.slice(0, i + 1).join("\\"),
    })),
  ];

  return (
    <nav style={styles.crumbs} aria-label="Breadcrumb">
      <Home size={13} color="#475569" style={{ flexShrink: 0 }} />
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <React.Fragment key={crumb.path}>
            <ChevronRight size={12} color="#334155" style={{ flexShrink: 0 }} />
            <button
              style={{
                ...styles.crumb,
                color: isLast ? "#e2e8f0" : "#64748b",
                fontWeight: isLast ? 600 : 400,
                cursor: isLast ? "default" : "pointer",
                // Highlight on hover via inline style won't work —
                // we rely on opacity change handled by disabled
              }}
              onClick={() => !isLast && onNavigate(crumb.path)}
              title={crumb.path}
              disabled={isLast}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

const styles = {
  crumbs: {
    display: "flex",
    alignItems: "center",
    gap: 2,
    overflow: "hidden",
    width: "100%",
  },
  crumb: {
    background: "none",
    border: "none",
    fontSize: 12,
    padding: "2px 3px",
    borderRadius: 3,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    maxWidth: 140,
    transition: "color 0.1s",
  },
};
