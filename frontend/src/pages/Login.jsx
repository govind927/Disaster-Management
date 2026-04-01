import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsVerify, setNeedsVerify] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resendMsg, setResendMsg] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setNeedsVerify(false);
    setResendMsg("");
    setLoading(true);

    const slowTimer = setTimeout(() => {
      setError("Server is taking longer than usual — please wait...");
    }, 5000);

    try {
      const res = await api.post("/auth/login", form);
      clearTimeout(slowTimer);
      login(res.data.user, res.data.token);
      navigate(res.data.user.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      clearTimeout(slowTimer);
      const data = err.response?.data;
      if (data?.needsVerification) {
        setNeedsVerify(true);
        setResendEmail(data.email);
      }
      setError(data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg("");
    setResendLoading(true);
    try {
      await api.post("/auth/resend-verification", { email: resendEmail });
      setResendMsg("Verification email sent! Check your inbox.");
    } catch (err) {
      setResendMsg(
        err.response?.data?.message || "Failed to resend. Try again.",
      );
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🚨</div>
        </div>

        <h1 className="auth-title">Disaster Management</h1>
        <p className="auth-sub">Sign in to your account</p>

        {error && (
          <div className="auth-err">
            <p style={{ margin: 0 }}>{error}</p>
            {needsVerify && (
              <div style={{ marginTop: 8 }}>
                <button
                  className="auth-resend-btn"
                  onClick={handleResend}
                  disabled={resendLoading}
                >
                  {resendLoading ? "Sending..." : "Resend verification email"}
                </button>
                {resendMsg && (
                  <p
                    style={{
                      margin: "6px 0 0",
                      fontSize: 12,
                      color: resendMsg.includes("sent") ? "#4ade80" : "#f87171",
                    }}
                  >
                    {resendMsg}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              className="auth-input"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) =>
                setForm((p) => ({ ...p, email: e.target.value }))
              }
              required
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password</label>
            <input
              className="auth-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) =>
                setForm((p) => ({ ...p, password: e.target.value }))
              }
              required
            />
          </div>
          <div style={{ textAlign: "right", marginBottom: "1.25rem" }}>
            <Link to="/forgot-password" className="auth-forgot">
              Forgot password?
            </Link>
          </div>
          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="auth-foot">
          No account?{" "}
          <Link to="/register" className="auth-link">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
