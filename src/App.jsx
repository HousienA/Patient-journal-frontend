import { Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import PatientList from './components/PatientList';
import './App.css';

function ProtectedRoute({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" />;
}

function App() {
    const { user, logout, loading } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (loading) return <div>Laddar...</div>;

    return (
        <div className="app">
            {user && (
                <>
                    <header>
                        <h1>Patient Journal System</h1>
                        <div className="user-info">
                            <span>Välkommen {user.username} ({user.role})</span>
                            <button onClick={handleLogout} className="logout-btn">
                                Logga ut
                            </button>
                        </div>
                    </header>
                    <nav>
                        <Link to="/patients">Patienter</Link>
                        <Link to="/messages">Meddelanden</Link>
                        <Link to="/encounters">Vårdmöten</Link>
                    </nav>
                </>
            )}

            <main>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/patients" element={
                        <ProtectedRoute><PatientList /></ProtectedRoute>
                    } />
                    <Route path="/" element={<Navigate to="/patients" />} />
                </Routes>
            </main>
        </div>
    );
}

export default App;
