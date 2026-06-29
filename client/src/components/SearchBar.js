import React, { useRef } from "react";
import { Search, X } from "lucide-react";

export default function SearchBar({ value, onChange, placeholder }) {
  const inputRef = useRef(null);

  return (
    <div style={styles.wrapper}>
      <Search size={14} color="#475569" style={{ flexShrink: 0 }} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || "Search files…"}
        style={styles.input}
        spellCheck={false}
      />
      {value && (
        <button
          style={styles.clear}
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          title="Clear search"
        >
          <X size={13} color="#64748b" />
        </button>
      )}
    </div>
  );
}

const styles = {
  wrapper: {
    display: "flex",
    alignItems: "center",
    background: "#0f172a",
    border: "1px solid #1e3a5f",
    borderRadius: 6,
    padding: "0 10px",
    gap: 8,
    height: 34,
    width: "clamp(120px, 30vw, 240px)",
    flexShrink: 1,
    minWidth: 80,
  },
  input: {
    background: "none",
    border: "none",
    outline: "none",
    color: "#e2e8f0",
    fontSize: 14,
    flex: 1,
    minWidth: 0,
    width: "100%",
  },
  clear: {
    background: "none",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    padding: 2,
    borderRadius: 3,
    flexShrink: 0,
  },
};
