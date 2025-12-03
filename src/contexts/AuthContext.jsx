import { useAuth as useOidcAuth } from "react-oidc-context";
import { useState, useEffect } from "react";
import { profileApi } from "../services/api";

// Vi återanvänder bibliotekets hook men anpassar den för din app
export function useAuth() {
    const auth = useOidcAuth();
    const [dbProfile, setDbProfile] = useState(null);

    useEffect(() => {
        if (auth.isAuthenticated && auth.user) {
            // Spara token i session storage för api.js (om det behövs där)
            const key = `oidc.user:${auth.settings.authority}:${auth.settings.client_id}`;
            // api.js läser redan från sessionStorage som oidc-client-ts sparar i, så vi behöver kanske inte göra något manuellt
            // Men vi hämtar profilen:
            profileApi.exists().then(data => {
                if (data && data.exists) {
                    setDbProfile(data.profile);
                }
            }).catch(err => console.error("Failed to fetch profile", err));
        } else {
            setDbProfile(null);
        }
    }, [auth.isAuthenticated, auth.user]);

    // Mappa OIDC-user till din apps user-struktur
    const user = auth.isAuthenticated && auth.user ? {
        username: auth.user.profile.preferred_username || "User",
        // Hämta roll från token (kan behöva anpassas beroende på Keycloak-setup)
        role: auth.user.profile.realm_access?.roles?.includes('DOCTOR') ? 'DOCTOR' :
            auth.user.profile.realm_access?.roles?.includes('STAFF') ? 'STAFF' : 'PATIENT',
        token: auth.user.access_token,
        ...dbProfile // Slå ihop med db-profilen (id, etc)
    } : null;

    return {
        user,
        loading: auth.isLoading,
        login: () => auth.signinRedirect(),
        logout: () => auth.signoutRedirect(),
        isAuthenticated: auth.isAuthenticated
    };
}
