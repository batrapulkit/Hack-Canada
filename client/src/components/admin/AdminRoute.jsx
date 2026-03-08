import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminRoute({ children }) {
    const { user, profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Check if user is logged in AND is a super_admin
    // We check 'profile' because 'user' only contains { email } in AuthContext
    if (!user || !profile || profile.role !== 'super_admin') {
        // If logged in but not super admin, redirect to normal dashboard
        if (user) {
            return <Navigate to="/dashboard" replace />;
        }
        // If not logged in, redirect to login
        return <Navigate to="/login" replace />;
    }

    return children;
}
