import { Navigate } from 'react-router-dom';
// Signup is integrated into Login.tsx as a tab.
// This redirects /signup → /login for backward compatibility.
export default function Signup() {
  return <Navigate to="/login" replace />;
}
