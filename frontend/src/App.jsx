import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import StaffDashboard from './pages/StaffDashboard';
import ResidentDetail from './pages/ResidentDetail';
import ResidentProfile from './pages/ResidentProfile';
import FamilyView from './pages/FamilyView';
import Navbar from './components/Navbar';
import Intro from './components/Intro';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children, allowedRole }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const { user } = useAuth();
  const [showIntro, setShowIntro] = useState(() => !sessionStorage.getItem('introShown'));

  const finishIntro = () => {
    sessionStorage.setItem('introShown', 'true');
    setShowIntro(false);
  };

  if (showIntro) return <Intro onComplete={finishIntro} />;

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/staff" element={<ProtectedRoute allowedRole="staff"><StaffDashboard /></ProtectedRoute>} />
        <Route path="/resident/:id" element={<ProtectedRoute><ResidentDetail /></ProtectedRoute>} />
        <Route path="/resident/:id/profile" element={<ProtectedRoute><ResidentProfile /></ProtectedRoute>} />
        <Route path="/family" element={<ProtectedRoute allowedRole="family"><FamilyView /></ProtectedRoute>} />
        <Route path="/" element={user ? <Navigate to={user.role === 'staff' ? '/staff' : '/family'} replace /> : <Navigate to="/login" replace />} />
      </Routes>
    </>
  );
}

export default App;