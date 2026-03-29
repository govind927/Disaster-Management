import { useEffect, useState, useCallback, useRef } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
  HeatmapLayer,
} from "@react-google-maps/api";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const LIBRARIES = ["visualization"];
const MAP_STYLE = { width: "100%", height: "100%" };
const SEVERITY_COLOR = { low: "#22c55e", medium: "#f59e0b", high: "#ef4444" };
const STATUS_COLOR = {
  pending: "#f59e0b",
  active: "#3b82f6",
  resolved: "#22c55e",
};
const TYPE_ICONS = {
  flood: "🌊",
  fire: "🔥",
  earthquake: "⚠️",
  landslide: "⛰️",
  cyclone: "🌀",
  other: "📍",
};

export default function MapView() {
  const [incidents, setIncidents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [filter, setFilter] = useState({
    type: "all",
    severity: "all",
    status: "all",
  });
  const [newAlert, setNewAlert] = useState(null);
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const { socket } = useSocket();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    api
      .get("/incidents")
      .then((res) => setIncidents(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setMapCenter(loc);
      },
      (err) => console.warn("Location access denied:", err),
    );
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("new_incident", (incident) => {
      setIncidents((prev) => [incident, ...prev]);
      setNewAlert(`New incident reported: ${incident.title}`);
      setTimeout(() => setNewAlert(null), 5000);
    });

    socket.on("incident_updated", ({ id, status }) => {
      setIncidents((prev) =>
        prev.map((inc) => (inc.id === id ? { ...inc, status } : inc)),
      );
    });

    return () => {
      socket.off("new_incident");
      socket.off("incident_updated");
    };
  }, [socket]);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const filtered = incidents.filter((inc) => {
    if (filter.type !== "all" && inc.type !== filter.type) return false;
    if (filter.severity !== "all" && inc.severity !== filter.severity)
      return false;
    if (filter.status !== "all" && inc.status !== filter.status) return false;
    return true;
  });

  const heatmapData = isLoaded
    ? filtered.map((inc) => ({
        location: new window.google.maps.LatLng(
          parseFloat(inc.lat),
          parseFloat(inc.lng),
        ),
        weight: inc.severity === "high" ? 3 : inc.severity === "medium" ? 2 : 1,
      }))
    : [];

  const goToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(14);
    }
  };

  if (loadError)
    return (
      <div style={s.error}>
        Failed to load Google Maps. Check your API key in .env
      </div>
    );

  if (!isLoaded) return <div style={s.loading}>Loading map...</div>;

  return (
    <div style={s.page}>
      <div style={s.navbar}>
        <button onClick={() => navigate("/dashboard")} style={s.backBtn}>
          ← Dashboard
        </button>
        <h2 style={s.brand}>Live Incident Map</h2>
        <div style={s.navRight}>
          <span style={s.count}>{filtered.length} incidents</span>
          <button onClick={() => navigate("/report")} style={s.reportBtn}>
            + Report
          </button>
        </div>
      </div>

      {newAlert && <div style={s.toast}>{newAlert}</div>}

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-group">
          <span style={s.filterLabel}>Type:</span>
          {[
            "all",
            "flood",
            "fire",
            "earthquake",
            "landslide",
            "cyclone",
            "other",
          ].map((t) => (
            <button
              key={t}
              style={{
                ...s.filterBtn,
                ...(filter.type === t ? s.filterActive : {}),
              }}
              onClick={() => setFilter((p) => ({ ...p, type: t }))}
            >
              {t === "all" ? "All" : `${TYPE_ICONS[t]} ${t}`}
            </button>
          ))}
        </div>

        <div className="filter-group">
          <span style={s.filterLabel}>Severity:</span>
          {["all", "low", "medium", "high"].map((sv) => (
            <button
              key={sv}
              style={{
                ...s.filterBtn,
                ...(filter.severity === sv ? s.filterActive : {}),
              }}
              onClick={() => setFilter((p) => ({ ...p, severity: sv }))}
            >
              {sv}
            </button>
          ))}
        </div>

        <div className="filter-group">
          <span style={s.filterLabel}>Status:</span>
          {["all", "pending", "active", "resolved"].map((st) => (
            <button
              key={st}
              style={{
                ...s.filterBtn,
                ...(filter.status === st ? s.filterActive : {}),
              }}
              onClick={() => setFilter((p) => ({ ...p, status: st }))}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowHeatmap((p) => !p)}
            style={{ ...s.filterBtn, ...(showHeatmap ? s.heatActive : {}) }}
          >
            {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
          </button>
          <button onClick={goToUserLocation} style={s.filterBtn}>
            My Location
          </button>
        </div>
      </div>

      {/* Map wrapper */}
      <div className="map-wrap">
        <GoogleMap
          mapContainerStyle={MAP_STYLE}
          center={mapCenter}
          zoom={userLocation ? 12 : 5}
          onLoad={onMapLoad}
          options={{
            streetViewControl: false,
            mapTypeControl: true,
            fullscreenControl: true,
            zoomControl: true,
          }}
        >
          {userLocation && (
            <Marker
              position={userLocation}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeColor: "#fff",
                strokeWeight: 3,
              }}
              title="Your location"
            />
          )}

          {filtered.map((inc) => (
            <Marker
              key={inc.id}
              position={{ lat: parseFloat(inc.lat), lng: parseFloat(inc.lng) }}
              onClick={() => setSelected(inc)}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale:
                  inc.severity === "high"
                    ? 14
                    : inc.severity === "medium"
                      ? 11
                      : 8,
                fillColor: SEVERITY_COLOR[inc.severity],
                fillOpacity: inc.status === "resolved" ? 0.4 : 0.9,
                strokeColor: "#fff",
                strokeWeight: 2,
              }}
            />
          ))}

          {selected && (
            <InfoWindow
              position={{
                lat: parseFloat(selected.lat),
                lng: parseFloat(selected.lng),
              }}
              onCloseClick={() => setSelected(null)}
            >
              <div style={s.infoWindow}>
                {selected.image_url && (
                  <img
                    src={selected.image_url}
                    alt="incident"
                    style={s.infoImg}
                  />
                )}
                <div style={s.infoType}>
                  {TYPE_ICONS[selected.type]} {selected.type.toUpperCase()}
                </div>
                <h4 style={s.infoTitle}>{selected.title}</h4>
                {selected.description && (
                  <p style={s.infoDesc}>{selected.description}</p>
                )}
                <div style={s.infoBadges}>
                  <span
                    style={{
                      ...s.badge,
                      background: SEVERITY_COLOR[selected.severity],
                    }}
                  >
                    {selected.severity}
                  </span>
                  <span
                    style={{
                      ...s.badge,
                      background: STATUS_COLOR[selected.status],
                    }}
                  >
                    {selected.status}
                  </span>
                </div>
                <p style={s.infoReporter}>
                  Reported by: {selected.reporter_name}
                </p>
                <p style={s.infoDate}>
                  {new Date(selected.created_at).toLocaleString()}
                </p>
              </div>
            </InfoWindow>
          )}

          {showHeatmap && heatmapData.length > 0 && (
            <HeatmapLayer
              data={heatmapData}
              options={{ radius: 40, opacity: 0.7 }}
            />
          )}
        </GoogleMap>
      </div>

      <div style={s.legend}>
        <span style={s.legendTitle}>Severity:</span>
        {Object.entries(SEVERITY_COLOR).map(([k, v]) => (
          <span key={k} style={s.legendItem}>
            <span style={{ ...s.dot, background: v }} />
            {k}
          </span>
        ))}
        <span style={{ ...s.legendItem, marginLeft: 16 }}>
          <span style={{ ...s.dot, background: "#3b82f6" }} /> You
        </span>
        <span style={{ ...s.legendItem, marginLeft: 8, color: "#9ca3af" }}>
          Faded = resolved
        </span>
      </div>
    </div>
  );
}

const s = {
  page: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#f3f4f6",
  },
  navbar: {
    background: "#fff",
    padding: "0.75rem 1.5rem",
    display: "flex",
    alignItems: "center",
    gap: "1rem",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
    zIndex: 10,
  },
  backBtn: {
    padding: "6px 12px",
    background: "#f3f4f6",
    border: "1px solid #d1d5db",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
  },
  brand: { margin: 0, fontSize: 17, fontWeight: 600, color: "#1e40af" },
  navRight: {
    marginLeft: "auto",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  count: {
    fontSize: 13,
    color: "#6b7280",
    background: "#f3f4f6",
    padding: "4px 10px",
    borderRadius: 20,
  },
  reportBtn: {
    padding: "7px 14px",
    background: "#ef4444",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },
  toast: {
    position: "absolute",
    top: 70,
    left: "50%",
    transform: "translateX(-50%)",
    background: "#1e40af",
    color: "#fff",
    padding: "10px 20px",
    borderRadius: 8,
    fontSize: 14,
    zIndex: 1000,
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
  },
  filterBar: {
    background: "#fff",
    padding: "0.5rem 1.5rem",
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "0.5rem",
    borderBottom: "1px solid #e5e7eb",
  },
  filterGroup: {
    display: "flex",
    alignItems: "center",
    gap: 4,
    flexWrap: "wrap",
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: 500,
    color: "#6b7280",
    marginRight: 2,
  },
  filterBtn: {
    padding: "4px 10px",
    background: "#f3f4f6",
    border: "1px solid #e5e7eb",
    borderRadius: 20,
    fontSize: 12,
    cursor: "pointer",
    color: "#374151",
  },
  filterActive: {
    background: "#1e40af",
    color: "#fff",
    borderColor: "#1e40af",
  },
  heatActive: { background: "#7c3aed", color: "#fff", borderColor: "#7c3aed" },
  infoWindow: { maxWidth: 220, fontFamily: "sans-serif" },
  infoImg: {
    width: "100%",
    height: 120,
    objectFit: "cover",
    borderRadius: 6,
    marginBottom: 8,
  },
  infoType: { fontSize: 11, color: "#6b7280", marginBottom: 4 },
  infoTitle: {
    margin: "0 0 4px",
    fontSize: 14,
    fontWeight: 600,
    color: "#111",
  },
  infoDesc: {
    margin: "0 0 8px",
    fontSize: 12,
    color: "#6b7280",
    lineHeight: 1.5,
  },
  infoBadges: { display: "flex", gap: 6, marginBottom: 6 },
  badge: {
    fontSize: 11,
    padding: "2px 8px",
    color: "#fff",
    borderRadius: 10,
    fontWeight: 500,
  },
  infoReporter: { margin: "0 0 2px", fontSize: 11, color: "#6b7280" },
  infoDate: { margin: 0, fontSize: 11, color: "#9ca3af" },
  legend: {
    background: "#fff",
    padding: "6px 1.5rem",
    display: "flex",
    alignItems: "center",
    gap: 8,
    borderTop: "1px solid #e5e7eb",
    fontSize: 12,
    color: "#374151",
  },
  legendTitle: { fontWeight: 500, marginRight: 4 },
  legendItem: { display: "flex", alignItems: "center", gap: 4 },
  dot: { width: 10, height: 10, borderRadius: "50%", display: "inline-block" },
  error: { padding: "2rem", color: "#ef4444", textAlign: "center" },
  loading: { padding: "2rem", textAlign: "center", color: "#6b7280" },
};
