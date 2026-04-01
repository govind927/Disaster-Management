import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

export default function ReportIncident() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "flood",
    severity: "medium",
  });
  const [image, setImage] = useState(null);
  const [locating, setLocating] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const getLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Could not get location. Please allow location access.");
        setLocating(false);
      },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location) return setError("Please detect your location first");
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("description", form.description);
    formData.append("type", form.type);
    formData.append("severity", form.severity);
    formData.append("lat", location.lat);
    formData.append("lng", location.lng);
    if (image) formData.append("image", image);

    try {
      await api.post("/incidents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        padding: "2rem 1rem",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "rgba(30,41,59,0.8)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "2rem",
          width: "100%",
          maxWidth: 560,
          height: "fit-content",
          animation: "fadeInUp 0.4s ease",
        }}
      >
        <h2
          style={{
            margin: "0 0 1.5rem",
            fontSize: 20,
            fontWeight: 700,
            color: "#f1f5f9",
          }}
        >
          Report an Incident
        </h2>

        {error && <div style={s.err}>{error}</div>}

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#94a3b8",
                letterSpacing: "0.3px",
              }}
            >
              Title
            </label>
            <input
              className="dark-input"
              placeholder="e.g. Flood in Sector 4"
              required
              value={form.title}
              onChange={(e) =>
                setForm((p) => ({ ...p, title: e.target.value }))
              }
            />
          </div>

          <div className="form-row">
            <div style={{ ...s.field, flex: 1 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#94a3b8",
                  letterSpacing: "0.3px",
                }}
              >
                Type
              </label>
              <select
                className="dark-input"
                value={form.type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, type: e.target.value }))
                }
              >
                {[
                  "flood",
                  "fire",
                  "earthquake",
                  "landslide",
                  "cyclone",
                  "other",
                ].map((t) => (
                  <option key={t} value={t}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ ...s.field, flex: 1 }}>
              <label
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#94a3b8",
                  letterSpacing: "0.3px",
                }}
              >
                Severity
              </label>
              <select
                className="dark-input"
                value={form.severity}
                onChange={(e) =>
                  setForm((p) => ({ ...p, severity: e.target.value }))
                }
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div style={s.field}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#94a3b8",
                letterSpacing: "0.3px",
              }}
            >
              Description
            </label>
            <textarea
              className="dark-input"
              style={{ minHeight: 100, resize: "vertical" }}
              placeholder="Describe the situation..."
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
            />
          </div>

          <div style={s.field}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#94a3b8",
                letterSpacing: "0.3px",
              }}
            >
              Location
            </label>
            <button
              type="button"
              onClick={getLocation}
              disabled={locating}
              style={{
                padding: "10px",
                background: location
                  ? "rgba(34,197,94,0.1)"
                  : "rgba(59,130,246,0.1)",
                border: `1px solid ${location ? "rgba(34,197,94,0.3)" : "rgba(59,130,246,0.3)"}`,
                color: location ? "#4ade80" : "#60a5fa",
                borderRadius: 8,
                fontSize: 14,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {locating
                ? "Detecting..."
                : location
                  ? "Location Detected"
                  : "Detect My Location"}
            </button>

            {location && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: 12,
                  color: "#60a5fa",
                  fontFamily: "monospace",
                }}
              >
                Lat: {location.lat.toFixed(5)}, Lng: {location.lng.toFixed(5)}
              </p>
            )}
          </div>

          <div style={s.field}>
            <label
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "#94a3b8",
                letterSpacing: "0.3px",
              }}
            >
              Photo (optional)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              style={{ fontSize: 14, color: "#cbd5e1" }}
            />
          </div>

          <div className="form-row">
            <button
              type="button"
              onClick={() => navigate("/dashboard")}
              className="btn-cancel"
              style={{ flex: 1 }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="auth-btn"
              style={{ flex: 1 }}
            >
              {loading ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const s = {
  err: {
    background: "#7f1d1d",
    border: "1px solid rgba(248,113,113,0.35)",
    color: "#fecaca",
    padding: "10px",
    borderRadius: 8,
    fontSize: 14,
    marginBottom: "1rem",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
};
