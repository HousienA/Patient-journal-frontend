import { Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useEffect, useState } from 'react';
import './App.css';

// Components
import Login from './components/Login';
import OnboardingFlow from './components/OnboardingFlow';
import PatientList from './components/PatientList.jsx';
import PatientForm from './components/PatientForm.jsx';
import PatientDetail from './components/PatientDetail.jsx';
import EncounterForm from './components/EncounterForm.jsx';
import MessageCenter from './components/MessageCenter.jsx';
import ConditionForm from './components/ConditionForm.jsx';
import ObservationForm from './components/ObservationForm.jsx';
import EncounterDetail from './components/EncounterDetail';
import MessageThread from './components/MessageThread.jsx';
import MyHealthDashboard from './components/MyHealthDashboard.jsx';
import AdminPanel from './components/AdminPanel.jsx';

// Protected Route wrapper
function ProtectedRoute({ children, roles = null }) {
    const auth = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [checking, setChecking] = useState(true);
    const [needsOnboarding, setNeedsOnboarding] = useState(false);

    useEffect(() => {
        const checkOnboarding = async () => {
            if (!auth.isAuthenticated) {
                setChecking(false);
                return;
            }

            // If already checked this session, don't repeat
            if (sessionStorage.getItem('onboarding-checked') === 'true') {
                setChecking(false);
                return;
            }

            // Do not check while actually on onboarding route
            if (location.pathname === '/onboarding') {
                setChecking(false);
                return;
            }

            try {
                const token = auth.user.access_token;
                const response = await fetch('http://localhost:8082/api/clinical/profile/exists', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('profile/exists response:', data);

                    if (!data.exists) {
                        setNeedsOnboarding(true);
                        sessionStorage.setItem('onboarding-checked', 'true');
                        navigate('/onboarding', { replace: true });
                        return;
                    } else {
                        setNeedsOnboarding(false);
                        sessionStorage.setItem('onboarding-checked', 'true');
                    }
                }
            } catch (err) {
                console.error('Error checking profile:', err);
            } finally {
                setChecking(false);
            }
        };

        checkOnboarding();
        // IMPORTANT: do NOT depend on location.pathname here
    }, [auth.isAuthenticated, auth.user, navigate]);

    if (auth.isLoading || checking) {
        return <div className="loading">Laddar behörigheter...</div>;
    }

    if (!auth.isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // If onboarding is required and we are not already on /onboarding,
    // let the effect redirect; render nothing for now.
    if (needsOnboarding && location.pathname !== '/onboarding') {
        return null;
    }

    // Extract user role from JWT
    const userRoles = auth.user?.profile?.realm_access?.roles || [];
    const userRole = userRoles.includes('DOCTOR')
        ? 'DOCTOR'
        : userRoles.includes('STAFF')
            ? 'STAFF'
            : 'PATIENT';

    // Check role-based access
    if (roles && !roles.includes(userRole)) {
        return (
            <div className="error-page">
                <h2>Åtkomst nekad</h2>
                <p>Du har inte behörighet att se denna sida.</p>
                <p>Kräver roller: {roles.join(', ')}</p>
            </div>
        );
    }

    return children;
}

// Dashboard component
function Dashboard() {
    const auth = useAuth();

    if (!auth.isAuthenticated) {
        return null;
    }

    const username = auth.user?.profile?.preferred_username || 'Användare';
    const userRoles = auth.user?.profile?.realm_access?.roles || [];
    const userRole = userRoles.includes('DOCTOR') ? 'DOCTOR' :
        userRoles.includes('STAFF') ? 'STAFF' : 'PATIENT';

    return (
        <div className="dashboard">
            <h2>Välkommen, {username}!</h2>
            <p>Din roll: <strong>{userRole}</strong></p>

            {userRole === 'PATIENT' && (
                <div className="info-box">
                    <p>Som patient kan du:</p>
                    <ul>
                        <li>Se din hälsoinformation</li>
                        <li>Läsa meddelanden från vårdpersonal</li>
                        <li>Granska dina vårdbesök</li>
                    </ul>
                </div>
            )}

            {userRole === 'DOCTOR' && (
                <div className="info-box">
                    <p>Som läkare kan du:</p>
                    <ul>
                        <li>Hantera patienter</li>
                        <li>Skapa vårdbesök</li>
                        <li>Registrera observationer</li>
                    </ul>
                </div>
            )}

            {userRole === 'STAFF' && (
                <div className="info-box">
                    <p>Som personal kan du:</p>
                    <ul>
                        <li>Administrera patienter</li>
                        <li>Hantera meddelanden</li>
                    </ul>
                </div>
            )}
        </div>
    );
}

function App() {
    const auth = useAuth();

    // Handle authentication loading
    if (auth.isLoading) {
        return (
            <div className="app-loading">
                <div className="spinner"></div>
                <p>Laddar applikation...</p>
            </div>
        );
    }

    // Handle authentication errors
    if (auth.error) {
        return (
            <div className="app-error">
                <h2>Autentiseringsfel</h2>
                <p>{auth.error.message}</p>
                <button onClick={() => window.location.reload()}>Försök igen</button>
            </div>
        );
    }

    const handleLogout = () => {
        auth.signoutRedirect();
    };

    // Get user info if authenticated
    const username = auth.isAuthenticated ? auth.user?.profile?.preferred_username : null;
    const userRoles = auth.isAuthenticated ? auth.user?.profile?.realm_access?.roles || [] : [];
    const userRole = userRoles.includes('DOCTOR') ? 'DOCTOR' :
        userRoles.includes('STAFF') ? 'STAFF' : 'PATIENT';

    return (
        <div className="App">
            {/* Header with Navigation */}
            {auth.isAuthenticated && (
                <header className="app-header">
                    <div className="header-content">
                        <h1 className="app-title">Patientjournal</h1>

                        <nav className="app-nav">
                            <Link to="/">Hem</Link>

                            {['DOCTOR', 'STAFF'].includes(userRole) && (
                                <Link to="/patients">Patienter</Link>
                            )}

                            {userRole === 'STAFF' && (
                                <Link to="/admin">Admin</Link>
                            )}

                            {userRole === 'PATIENT' && (
                                <Link to="/my-health">Min information</Link>
                            )}

                            <Link to="/messages">Meddelanden</Link>
                        </nav>

                        <div className="user-info">
                            <span className="username">{username}</span>
                            <span className="user-role">{userRole}</span>
                            <button onClick={handleLogout} className="logout-btn">
                                Logga ut
                            </button>
                        </div>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="app-main">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />

                    {/* Onboarding Route - Must be accessible when authenticated but no profile */}
                    <Route
                        path="/onboarding"
                        element={
                            auth.isAuthenticated ? <OnboardingFlow /> : <Navigate to="/login" />
                        }
                    />

                    {/* Protected Routes */}
                    <Route
                        path="/"
                        element={
                            <ProtectedRoute>
                                <Dashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Patient Routes - DOCTOR, STAFF only */}
                    <Route
                        path="/patients"
                        element={
                            <ProtectedRoute roles={['DOCTOR', 'STAFF']}>
                                <PatientList />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/patients/new"
                        element={
                            <ProtectedRoute roles={['DOCTOR', 'STAFF']}>
                                <PatientForm />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/patients/:id"
                        element={
                            <ProtectedRoute roles={['DOCTOR', 'STAFF']}>
                                <PatientDetail />
                            </ProtectedRoute>
                        }
                    />

                    {/* Encounter Routes */}
                    <Route
                        path="/encounters/new"
                        element={
                            <ProtectedRoute roles={['DOCTOR', 'STAFF']}>
                                <EncounterForm />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/encounters/:id"
                        element={
                            <ProtectedRoute roles={['DOCTOR', 'STAFF']}>
                                <EncounterDetail />
                            </ProtectedRoute>
                        }
                    />

                    {/* Condition Routes */}
                    <Route
                        path="/conditions/new"
                        element={
                            <ProtectedRoute roles={['DOCTOR', 'STAFF']}>
                                <ConditionForm />
                            </ProtectedRoute>
                        }
                    />

                    <Route
                        path="/conditions/:id/edit"
                        element={
                            <ProtectedRoute roles={['DOCTOR', 'STAFF']}>
                                <ConditionForm />
                            </ProtectedRoute>
                        }
                    />

                    {/* Observation Routes */}
                    <Route
                        path="/observations/new"
                        element={
                            <ProtectedRoute roles={['DOCTOR', 'STAFF']}>
                                <ObservationForm />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/observations/:id/edit"
                        element={
                            <ProtectedRoute roles={['DOCTOR', 'STAFF']}>
                                <ObservationForm />
                            </ProtectedRoute>
                        }
                    />

                    {/* Message Routes */}
                    <Route
                        path="/messages"
                        element={
                            <ProtectedRoute>
                                <MessageCenter />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/messages/:id"
                        element={
                            <ProtectedRoute>
                                <MessageThread />
                            </ProtectedRoute>
                        }
                    />

                    {/* Patient Health Dashboard */}
                    <Route
                        path="/my-health"
                        element={
                            <ProtectedRoute roles={['PATIENT']}>
                                <MyHealthDashboard />
                            </ProtectedRoute>
                        }
                    />

                    {/* Admin Panel */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute roles={['STAFF']}>
                                <AdminPanel />
                            </ProtectedRoute>
                        }
                    />

                    {/* 404 */}
                    <Route path="*" element={<div className="error-page">Sidan hittades inte</div>} />
                </Routes>
            </main>
        </div>
    );
}
export default App;