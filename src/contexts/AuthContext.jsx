import { useAuth as useOidcAuth } from "react-oidc-context";

// Vi återanvänder bibliotekets hook men anpassar den för din app
export function useAuth() {
    const auth = useOidcAuth();

    // Mappa OIDC-user till din apps user-struktur
    const user = auth.isAuthenticated && auth.user ? {
        username: auth.user.profile.preferred_username || "User",
        // Hämta roll från token (kan behöva anpassas beroende på Keycloak-setup)
        role: auth.user.profile.realm_access?.roles?.includes('DOCTOR') ? 'DOCTOR' :
            auth.user.profile.realm_access?.roles?.includes('STAFF') ? 'STAFF' : 'PATIENT',
        token: auth.user.access_token
    } : null;

    return {
        user,
        loading: auth.isLoading,
        login: () => auth.signinRedirect(),
        logout: () => auth.signoutRedirect(),
        isAuthenticated: auth.isAuthenticated
    };
}
