import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../../services/api'; 

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Define logout function with useCallback to avoid recreation in the dependency array
    const logout = useCallback(async () => {
        try {
            // Server clears HttpOnly cookies
            await api.post('/auth/logout');
            setUser(null);
        } catch (err) {
            console.error('Logout error:', err);
            // Even if API call fails, clear user state
            setUser(null);
        }
    }, []);

    // Auto-refresh on load or page refresh
    useEffect(() => {
        const refresh = async () => {
            try {
                // Directly try to refresh without checking for sessionValid cookie
                const res = await api.post('/auth/refresh');
                setUser({ username: res.data.username, role: res.data.role, _id: res.data._id });
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        refresh();
    }, []);

    const login = async (username, password) => {
        // Credentials sent to server, server sets HttpOnly cookies
        const res = await api.post('/auth/login', { username, password });
        
        setUser({ username: res.data.username, role: res.data.role, _id: res.data._id });
        return res;
    };

    // Inactivity timer
    useEffect(() => {
        if (!user) return;
        
        let inactivityTimer;
        
        // Function to reset timer
        const resetTimer = () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            
            inactivityTimer = setTimeout(() => {
              console.log('Logging out due to inactivity');
              logout();
            }, 30 * 60 * 1000); // 30 minutes of inactivity
        };
        
        // Set initial timer
        resetTimer();
        
        // Events to track user activity
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        // Add all event listeners
        activityEvents.forEach(event => {
            window.addEventListener(event, resetTimer);
        });
        
        // Cleanup
        return () => {
            if (inactivityTimer) clearTimeout(inactivityTimer);
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [user, logout]); // Include logout in deps array since we're using useCallback

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);