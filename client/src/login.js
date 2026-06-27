import React, { useState } from "react";
import axios from "axios";

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
        <h1 style={styles.title}>Welcome Back</h1>
        <p style={styles.subtitle}>Login to access your dashboard</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <input
            name="username"
            placeholder="Username"
            onChange={handleChange}
            style={styles.input}
            autoComplete="off"
          />

          <input
            name="password"
            type="password"
            placeholder="Password"
            onChange={handleChange}
            style={styles.input}
          />

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer"
            }}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p style={styles.footer}>
          Secure File Browser System
        </p>
      </div>
    </div>
  );
}

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f172a, #1e293b, #0f172a)",
    fontFamily: "Arial, sans-serif",
    animation: "fadeIn 0.6s ease-in-out"
  },

  card: {
    width: "360px",
    padding: "40px 30px",
    borderRadius: "16px",
    background: "rgba(255,255,255,0.06)",
    backdropFilter: "blur(12px)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
    color: "#fff",
    textAlign: "center"
  },

  title: {
    marginBottom: 5,
    fontSize: "26px",
    fontWeight: "700"
  },

  subtitle: {
    marginBottom: 25,
    fontSize: "13px",
    color: "#94a3b8"
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "14px"
  },

  input: {
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(15, 23, 42, 0.6)",
    color: "#fff",
    outline: "none",
    fontSize: "14px",
    transition: "0.2s ease"
  },

  button: {
    marginTop: "10px",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(90deg, #3b82f6, #2563eb)",
    color: "#fff",
    fontWeight: "600",
    fontSize: "14px",
    transition: "0.2s ease"
  },

  error: {
    background: "rgba(239, 68, 68, 0.15)",
    color: "#fca5a5",
    padding: "8px",
    borderRadius: "8px",
    fontSize: "13px"
  },

  footer: {
    marginTop: "18px",
    fontSize: "11px",
    color: "#64748b"
  }
};