import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from './AuthContext';
import LoaderAnimation from "../common/LoadingAnitmation";

const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    // Don't redirect while checking authentication status
    if (loading) return <LoaderAnimation />

    // If roles are specified but user isn't logged in, show unauthorized
    if (allowedRoles && !user) {
        return <Navigate to='/unauthorized' />;
    }
    
    // If not logged in (for routes that just need any authentication), redirect to login
    if (!user) {
        return <Navigate to='/login' />;
    }

    // If roles are specified and user's role is not included, redirect to unauthorized
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to='/unauthorized' />;
    }

    // If using the children prop pattern
    if (children) return children;

    // If using the Outlet pattern
    return <Outlet />;
};

export default ProtectedRoute;