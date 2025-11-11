import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Återställ session från localStorage vid page load
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('sessionToken');

        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        const data = await authApi.login(username, password);

        // Spara token och user i localStorage
        localStorage.setItem('sessionToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return data;
    };

    const logout = async () => {
        try {
            // Anropa backend för att invalidera token på servern
            await authApi.logout();
        } catch (err) {
            console.error('Logout error:', err);
            // Fortsätt ändå med lokal logout även om backend misslyckas
        } finally {
            // Rensa lokal data
            localStorage.removeItem('sessionToken');
            localStorage.removeItem('user');
            setUser(null);
        }
    };

    const register = async (userData) => {
        const response = await authApi.register(userData);
        return response;
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
