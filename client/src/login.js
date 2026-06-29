import React, { useState } from "react";
import axios from "axios";
import { HardDrive } from "lucide-react";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:3001/api/login", form);
      if (res.data.success) {
        localStorage.setItem("isAuth", "true");
        onLogin();
      }
    } catch (err) {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        {/* Icon + Title */}
        <div style={styles.iconWrap}>
          <HardDrive size={32} color="#3b82f6" />
        </div>
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Login to access your file browser</p>

        {/* Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              name="username"
              placeholder="Enter username"
              onChange={handleChange}
              value={form.username}
              style={styles.input}
              autoComplete="off"
              autoCapitalize="none"
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              placeholder="Enter password"
              onChange={handleChange}
              value={form.password}
              style={styles.input}
            />
          </div>

          {error && <div style={styles.error}>⚠️ {error}</div>}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            disabled={loading}
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        <p style={styles.footer}>🔒 Secure File Browser System</p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background:
      "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    padding: "16px", // ← padding so card never touches screen edge
    boxSizing: "border-box",
  },

  card: {
    width: "100%",
    maxWidth: "400px", // ← max width on big screens
    padding: "clamp(24px, 5vw, 40px) clamp(20px, 5vw, 36px)", // ← fluid padding
    borderRadius: "16px",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    color: "#fff",
    textAlign: "center",
    boxSizing: "border-box",
  },

  iconWrap: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 12,
  },

  title: {
    marginBottom: 6,
    fontSize: "clamp(20px, 5vw, 26px)", // ← fluid font size
    fontWeight: "700",
    color: "#f1f5f9",
  },

  subtitle: {
    marginBottom: 28,
    fontSize: "clamp(12px, 3vw, 14px)",
    color: "#94a3b8",
    lineHeight: 1.5,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    textAlign: "left",
  },

  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },

  label: {
    fontSize: "12px",
    fontWeight: "600",
    color: "#64748b",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },

  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(15, 23, 42, 0.7)",
    color: "#fff",
    outline: "none",
    fontSize: "15px", // ← 15px+ prevents iOS auto-zoom
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },

  button: {
    marginTop: "8px",
    padding: "13px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(90deg, #3b82f6, #2563eb)",
    color: "#fff",
    fontWeight: "600",
    fontSize: "15px",
    width: "100%",
    transition: "opacity 0.2s",
    boxSizing: "border-box",
  },

  error: {
    background: "rgba(239, 68, 68, 0.15)",
    color: "#fca5a5",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "13px",
    textAlign: "left",
    border: "1px solid rgba(239,68,68,0.2)",
  },

  footer: {
    marginTop: "20px",
    fontSize: "11px",
    color: "#334155",
  },
};
