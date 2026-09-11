import { Routes, Route, Navigate } from 'react-router-dom';
import { MapPage } from './pages/MapPage';
import { Dashboard } from './pages/admin/Dashboard';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { GlobalModal } from './shared/components/GlobalModal';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<MapPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rotas Protegidas */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/admin" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
      <GlobalModal />
    </>
  );
}

export default App;
