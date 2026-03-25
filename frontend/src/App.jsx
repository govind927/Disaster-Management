import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider }                            from './context/AuthContext';
import { SocketProvider }                          from './context/SocketContext';
import { ProtectedRoute, AdminRoute }              from './components/ProtectedRoute';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import ReportIncident from './pages/ReportIncident';
import MapView        from './pages/MapView';
import AlertsPage from './pages/AlertsPage';

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/"          element={<Navigate to="/login" replace />} />
            <Route path="/login"     element={<Login />} />
            <Route path="/register"  element={<Register />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/report"    element={<ProtectedRoute><ReportIncident /></ProtectedRoute>} />
            <Route path="/map"       element={<ProtectedRoute><MapView /></ProtectedRoute>} />
            <Route path="/admin"     element={<AdminRoute><div style={{padding:'2rem'}}>Admin Panel — Week 5</div></AdminRoute>} />
            <Route path="*"          element={<Navigate to="/login" replace />} />
            <Route path="/alerts" element={<ProtectedRoute><AlertsPage /></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}