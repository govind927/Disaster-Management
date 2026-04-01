import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters");
    setError("");
    setLoading(true);

    const slowTimer = setTimeout(() => {
      setError("Server is taking longer than usual — please wait...");
    }, 5000);

    try {
      const res = await api.post("/auth/register", form);
      clearTimeout(slowTimer);
      setSuccessMsg(res.data.message);
      setSuccess(true);
    } catch (err) {
      clearTimeout(slowTimer);
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 56,
              marginBottom: "1rem",
              animation: "float 3s ease-in-out infinite",
            }}
          >
            📧
          </div>
          <h2
            style={{
              margin: "0 0 0.5rem",
              color: "#f1f5f9",
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            Check your email
          </h2>
          <p
            style={{
              color: "#94a3b8",
              fontSize: 14,
              lineHeight: 1.7,
              margin: "0 0 1rem",
            }}
          >
            {successMsg}
          </p>
          <p style={{ color: "#475569", fontSize: 13 }}>
            Didn't receive it? Check your spam folder or{" "}
            <Link to="/login" className="auth-link">
              go to login
            </Link>{" "}
            to resend.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🛡️</div>
        </div>

        <h1 className="auth-title">Create Account</h1>
        <p className="auth-sub">Join the disaster response network</p>

        {error && <div className="auth-err">{error}</div>}

        <form onSubmit={handleSubmit}>
          {[
            { key: "name", type: "text", ph: "Full Name", label: "Full Name" },
            {
              key: "email",
              type: "email",
              ph: "you@example.com",
              label: "Email Address",
            },
            {
              key: "phone",
              type: "tel",
              ph: "+91 98765 43210",
              label: "Phone (optional)",
            },
            {
              key: "password",
              type: "password",
              ph: "Min. 6 characters",
              label: "Password",
            },
          ].map(({ key, type, ph, label }) => (
            <div key={key} className="auth-field">
              <label className="auth-label">{label}</label>
              <input
                className="auth-input"
                type={type}
                placeholder={ph}
                value={form[key]}
                required={key !== "phone"}
                onChange={(e) =>
                  setForm((p) => ({ ...p, [key]: e.target.value }))
                }
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            className="auth-btn"
            style={{ marginTop: "0.75rem" }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="auth-foot">
          Already have an account?{" "}
          <Link to="/login" className="auth-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
