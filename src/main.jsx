import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AuthProvider } from 'react-oidc-context';
import { BrowserRouter } from 'react-router-dom';

// Use environment variable for Keycloak URL
const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';

const oidcConfig = {
    authority: `${keycloakUrl}/realms/journal-realm`,
    client_id: 'backend-service',
    redirect_uri: window.location.origin,
    onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
    },
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider {...oidcConfig}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </AuthProvider>
    </React.StrictMode>,
);
