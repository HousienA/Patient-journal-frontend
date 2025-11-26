import { useAuth } from "react-oidc-context";
import { Navigate } from "react-router-dom";

export default function Login() {
    const auth = useAuth();

    if (auth.isLoading) {
        return <div>Laddar inloggning...</div>;
    }

    if (auth.error) {
        return <div>Oj, något gick fel: {auth.error.message}</div>;
    }

    if (auth.isAuthenticated) {
        // Om vi redan är inloggade, skicka till dashboard
        return <Navigate to="/dashboard" />;
    }

    return (
        <div className="login-container">
            <h1>Välkommen till Patientjournalen</h1>
            <p>Logga in med ditt Keycloak-konto</p>
            <button
                onClick={() => auth.signinRedirect()}
                className="btn-primary"
            >
                Logga in med Keycloak
            </button>
        </div>
    );
}
