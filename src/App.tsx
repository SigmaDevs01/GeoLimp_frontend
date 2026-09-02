import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { Dashboard } from './pages/admin/Dashboard';
import { Login } from './pages/auth/Login';
import { ProtectedRoute } from './shared/components/ProtectedRoute';
import { GlobalModal } from './shared/components/GlobalModal';

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        
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
