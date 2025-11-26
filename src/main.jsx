import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from "react-oidc-context";
import { BrowserRouter } from "react-router-dom"; // <--- IMPORTERA DENNA

const oidcConfig = {
    authority: "http://localhost:8080/realms/journal-realm",
    client_id: "backend-service",
    redirect_uri: window.location.origin,
    onSigninCallback: () => {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
};

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider {...oidcConfig}>
            <BrowserRouter> {/* <--- LÄGG TILL DENNA HÄR */}
                <App />
            </BrowserRouter>
        </AuthProvider>
    </React.StrictMode>,
)
