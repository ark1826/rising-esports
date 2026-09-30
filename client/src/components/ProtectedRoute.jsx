import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const admin = JSON.parse(localStorage.getItem('adminInfo') || 'null');

  if (!admin || !admin.token || admin.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
