import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const admin = JSON.parse(localStorage.getItem('adminInfo'));

  if (!admin || !admin.token) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
