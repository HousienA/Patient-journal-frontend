import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import PatientList from "./components/PatientList.jsx";
import './App.css';
import PatientForm from "./components/PatientForm.jsx";
import PatientDetail from "./components/PatientDetail.jsx";
import EncounterForm from "./components/EncounterForm.jsx";
import MessageCenter from "./components/MessageCenter.jsx";
import ConditionForm from "./components/ConditionForm.jsx";
import Register from "./components/Register.jsx";
import ObservationForm from "./components/ObservationForm.jsx";
import EncounterDetail from './components/EncounterDetail';



function ProtectedRoute({ children, roles = null }) {
    const { user } = useAuth();

    if (!user) return <Navigate to="/login" />;

    // Om specifika roller krävs, kolla det
    if (roles && !roles.includes(user.role)) {
        return <div className="error-page">Du har inte behörighet att se denna sida</div>;
    }

    return children;
}

function Dashboard() {
    const { user } = useAuth();

    return (
        <div className="dashboard">
            <h2>Välkommen, {user.username}!</h2>
            <p>Din roll: <strong>{user.role}</strong></p>

            {user.role === 'PATIENT' && (
                <div className="info-box">
                    <p>Som patient kan du:</p>
                    <ul>
                        <li>Se din egen information</li>
                        <li>Se dina vårdbesök</li>
                        <li>Skicka meddelanden till vårdpersonal</li>
                    </ul>
                </div>
            )}

            {['DOCTOR', 'STAFF', 'ADMIN'].includes(user.role) && (
                <div className="info-box">
                    <p>Som {user.role.toLowerCase()} kan du:</p>
                    <ul>
                        <li>Hantera patienter</li>
                        <li>Skapa vårdmöten och diagnoser</li>
                        <li>Se och svara på meddelanden</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

function App() {
    const { user, logout, loading } = useAuth();

    const handleLogout = async () => {
        await logout();
    };

    if (loading) {
        return <div className="loading-screen">Laddar...</div>;
    }

    return (
        <div className="app">
            {/* Header */}
            {user && (
                <header className="app-header">
                    <div className="header-left">
                        <h1>Patientjournal</h1>
                    </div>
                    <div className="header-right">
            <span className="user-info">
              {user.username} <span className="role-badge">{user.role}</span>
            </span>
                        <button onClick={handleLogout} className="logout-btn">
                            Logga ut
                        </button>
                    </div>
                </header>
            )}

            {/* Navigation */}
            {user && (
                <nav className="app-nav">
                    <Link to="/">Hem</Link>

                    {['DOCTOR', 'STAFF', 'ADMIN'].includes(user.role) && (
                        <>
                            <Link to="/patients">Patienter</Link>
                        </>
                    )}

                    {user.role === 'PATIENT' && (
                        <>
                            <Link to="/my-info">Min information</Link>
                            <Link to="/my-encounters">Mina besök</Link>
                        </>
                    )}

                    <Link to="/messages">Meddelanden</Link>
                </nav>
            )}

            {/* Routes */}
            <main className="app-main">
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/patients" element={
                        <ProtectedRoute roles={['DOCTOR', 'STAFF', 'ADMIN']}>
                            <PatientList />
                        </ProtectedRoute>
                    } />

                    <Route path="/patients/new" element={
                        <ProtectedRoute roles={['DOCTOR', 'STAFF', 'ADMIN']}>
                            <PatientForm />
                        </ProtectedRoute>
                    } />

                    <Route path="/patients/:id" element={
                        <ProtectedRoute roles={['DOCTOR', 'STAFF', 'ADMIN']}>
                            <PatientDetail />
                        </ProtectedRoute>
                    } />

                    <Route path="/encounters/:id" element={
                        <ProtectedRoute roles={['DOCTOR', 'STAFF', 'ADMIN']}>
                            <EncounterDetail />
                        </ProtectedRoute>
                    } />

                    <Route path="/encounters/new" element={
                        <ProtectedRoute roles={['DOCTOR', 'STAFF', 'ADMIN']}>
                            <EncounterForm />
                        </ProtectedRoute>
                    } />

                    <Route path="/messages" element={
                        <ProtectedRoute>
                            <MessageCenter />
                        </ProtectedRoute>
                    } />

                    <Route path="/conditions/new" element={
                        <ProtectedRoute roles={['DOCTOR', 'STAFF', 'ADMIN']}>
                            <ConditionForm />
                        </ProtectedRoute>
                    } />

                    <Route path="/observations/new" element={
                        <ProtectedRoute roles={['DOCTOR', 'STAFF', 'ADMIN']}>
                            <ObservationForm />
                        </ProtectedRoute>
                    } />

                    <Route path="/observations/:id/edit" element={
                        <ProtectedRoute roles={['DOCTOR', 'STAFF', 'ADMIN']}>
                            <ObservationForm />
                        </ProtectedRoute>
                    } />

                </Routes>


            </main>
        </div>
    );
}

export default App;
