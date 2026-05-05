import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(form.username, form.password);
      const role = data?.role;
      if (role === "ADMIN") navigate("/admin");
      else navigate("/");
    } catch {
      setError("Invalid username or password");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          background: "var(--surface)",
          padding: 32,
          borderRadius: "var(--radius)",
          width: 380,
          boxShadow: "var(--shadow)",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{ fontFamily: "Bebas Neue", fontSize: 32, marginBottom: 4 }}
        >
          2Pumped
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 24 }}>
          Sign in to your account
        </div>

        {error && (
          <div
            style={{ color: "var(--accent)", fontSize: 13, marginBottom: 12 }}
          >
            {error}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text2)",
              display: "block",
              marginBottom: 6,
            }}
          >
            USERNAME
          </label>
          <input
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "DM Sans",
            }}
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Enter username"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text2)",
              display: "block",
              marginBottom: 6,
            }}
          >
            PASSWORD
          </label>
          <input
            type="password"
            style={{
              width: "100%",
              padding: "10px 14px",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "DM Sans",
            }}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter password"
          />
        </div>

        <button
          onClick={handleSubmit}
          style={{
            width: "100%",
            padding: "10px",
            background: "var(--accent)",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "DM Sans",
          }}
        >
          Sign In
        </button>

        <div
          style={{
            textAlign: "center",
            marginTop: 16,
            fontSize: 13,
            color: "var(--text2)",
          }}
        >
          Don't have an account?{" "}
          <span
            style={{ color: "var(--accent)", cursor: "pointer" }}
            onClick={() => navigate("/register")}
          >
            Register
          </span>
        </div>
      </div>
    </div>
  );
}
