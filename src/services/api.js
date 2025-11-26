const API_BASE = '/api';


function getAccessToken() {
    const key = `oidc.user:http://localhost:8080/realms/journal-realm:backend-service`;
    const stored = sessionStorage.getItem(key);
    if (stored) {
        try {
            const user = JSON.parse(stored);
            return user.access_token;
            // eslint-disable-next-line no-unused-vars
        } catch (e) {
            return null;
        }
    }
    return null;
}

async function apiFetch(endpoint, options = {}) {
    const token = getAccessToken();

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            // VIKTIGT: Skicka token som Bearer, inte X-Session-Token
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (response.status === 401) {
        throw new Error('Unauthorized: Please login again');
    }

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'API request failed');
    }


    if (response.status === 204) return null;

    return response.json();
}



// Patient API (Går till Clinikal Service)
export const patientApi = {
    getAll: () => apiFetch('/clinical/patients'),
    getById: (id) => apiFetch(`/clinical/patients/${id}`),
    create: (data) => apiFetch('/clinical/patients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/clinical/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/clinical/patients/${id}`, { method: 'DELETE' }),
    searchByFields: ({ pnr, name }) => {
        const params = new URLSearchParams();
        if (pnr) params.append('pnr', pnr);
        if (name) params.append('name', name);
        const qs = params.toString();
        return apiFetch(`/clinical/patients/search${qs ? `?${qs}` : ''}`);
    }
};

// Conditions API
export const conditionApi = {
    getAll: () => apiFetch('/clinical/conditions'),
    getById: (id) => apiFetch(`/clinical/conditions/${id}`),
    getByPatientId: (patientId) => apiFetch(`/clinical/conditions/patient/${patientId}`),
    create: (data) => apiFetch('/clinical/conditions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/clinical/conditions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/clinical/conditions/${id}`, { method: 'DELETE' }),
};

// Encounters API
export const encounterApi = {
    getAll: () => apiFetch('/clinical/encounters'),
    getById: (id) => apiFetch(`/clinical/encounters/${id}`),
    getByPatientId: (patientId) => apiFetch(`/clinical/encounters/patient/${patientId}`),
    create: (data) => apiFetch('/clinical/encounters', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/clinical/encounters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/clinical/encounters/${id}`, { method: 'DELETE' }),
};

// Messages API (Går till Massage Service)
// VIKTIGT: Jag har ändrat endpointen till /messages för att matcha din Controller
export const messageApi = {
    getAll: () => apiFetch('/messages'),
    getById: (id) => apiFetch(`/messages/${id}`),
    getByPatientId: (patientId) => apiFetch(`/messages/patient/${patientId}`),
    getByPractitionerId: (practitionerId) => apiFetch(`/messages/practitioner/${practitionerId}`),
    create: (data) => apiFetch('/messages', { method: 'POST', body: JSON.stringify(data) }),
    // Denna endpoint fanns i din controller:
    markAsRead: (id) => apiFetch(`/messages/${id}/read`, { method: 'PUT' }),
};

// Observations API
export const observationApi = {
    getAll: () => apiFetch('/clinical/observations'),
    getById: (id) => apiFetch(`/clinical/observations/${id}`),
    getByEncounterId: (encounterId) => apiFetch(`/clinical/observations/encounter/${encounterId}`),
    create: (data) => apiFetch('/clinical/observations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/clinical/observations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/clinical/observations/${id}`, { method: 'DELETE' }),
};

// Practitioners API
export const practitionerApi = {
    getAll: () => apiFetch('/clinical/practitioners'),
    getById: (id) => apiFetch(`/clinical/practitioners/${id}`),
    create: (data) => apiFetch('/clinical/practitioners', { method: 'POST', body: JSON.stringify(data) }),
    // delete fanns inte i din senaste controller, men om du lagt till den:
    // delete: (id) => apiFetch(`/clinical/practitioners/${id}`, { method: 'DELETE' }),
};

// Organizations & Locations API
export const organizationApi = {
    getAll: (search = '') => apiFetch(`/clinical/organizations${search ? `?q=${search}` : ''}`),
    getById: (id) => apiFetch(`/clinical/organizations/${id}`),
    create: (data) => apiFetch('/clinical/organizations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/clinical/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/clinical/organizations/${id}`, { method: 'DELETE' }),
};

export const locationApi = {
    getAll: (organizationId) => {
        const url = organizationId
            ? `/clinical/locations?organizationId=${organizationId}`
            : '/clinical/locations';
        return apiFetch(url);
    },
    getById: (id) => apiFetch(`/clinical/locations/${id}`),
};

export const profileApi = {
    exists: () => apiFetch('/clinical/profile/exists'),
};
