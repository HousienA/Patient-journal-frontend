const API_BASE = '/api';

const IMAGE_API_BASE = import.meta.env.VITE_IMAGE_API_URL || 'http://localhost:8084';


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

// Image API (Går till Image Service)
async function imageApiFetch(endpoint, options = {}) {
    const token = getAccessToken();

    const config = {
        ...options,
        headers: {
            // För bilduppladdning (FormData) ska man INTE sätta Content-Type manuellt,
            // så vi kollar om body är FormData
            ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
            ...(token && { 'Authorization': `Bearer ${token}` }), // Om du lagt till auth i Node-tjänsten
            ...options.headers,
        },
    };

    const response = await fetch(`${IMAGE_API_BASE}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Image API error' }));
        throw new Error(error.error || 'Kunde inte nå bildtjänsten');
    }

    return response.json();
}



// Patient API (Går till Clinikal Service)
export const patientApi = {
    getAll: () => apiFetch('/clinical/patients'),
    getById: (id) => apiFetch(`/clinical/patients/${id}`),
    create: (data) => apiFetch('/clinical/patients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/clinical/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/clinical/patients/${id}`, { method: 'DELETE' }),

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
    getPatients: (id) => apiFetch(`/clinical/practitioners/${id}/patients`),
    getEncounters: (id, date) => {
        const qs = date ? `?date=${date}` : '';
        return apiFetch(`/clinical/practitioners/${id}/encounters${qs}`);
    },
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


// Image API (Går till Image Service)
export const imageApi = {
    // Ladda upp en ny bild
    // OBS: data ska vara ett FormData-objekt
    upload: (formData) => imageApiFetch('/images/upload', {
        method: 'POST',
        body: formData
    }),

    // Hämta bild-metadata + URL
    getById: (id) => imageApiFetch(`/images/${id}`),

    // Spara annoteringar (ritningar)
    saveAnnotations: (id, annotations) => imageApiFetch(`/images/${id}/annotate`, {
        method: 'PUT',
        body: JSON.stringify({ annotations })
    }),

    // Hämta alla bilder för en patient
    getByPatientId: (patientId) => imageApiFetch(`/images/patient/${patientId}`),

    // Hämta alla bilder för ett vårdmöte (Encounter)
    // OBS: Din Node.js-kod måste ha denna endpoint.
    // Om du inte skapat den i Node än, kan du filtrera patientens bilder i frontend istället,
    // men det är snyggare att ha en endpoint:
    getByEncounterId: (encounterId) => imageApiFetch(`/images/encounter/${encounterId}`),
};

// Quarkus Search API
export const searchApi = {
    // Search patients with multiple filters
    searchPatients: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.name) params.append('name', filters.name);
        if (filters.pnr) params.append('pnr', filters.pnr);
        if (filters.condition) params.append('condition', filters.condition);

        const qs = params.toString();
        return apiFetch(`/search/patients${qs ? `?${qs}` : ''}`);
    },

    // Search practitioners
    searchPractitioners: (name) => {
        const qs = name ? `?name=${encodeURIComponent(name)}` : '';
        return apiFetch(`/search/practitioners${qs}`);
    },

    // Get practitioner's patients
    getPractitionerPatients: (practitionerId) =>
        apiFetch(`/search/practitioners/${practitionerId}/patients`),

    // Get practitioner's encounters
    getPractitionerEncounters: (practitionerId, date) => {
        const qs = date ? `?date=${date}` : '';
        return apiFetch(`/search/practitioners/${practitionerId}/encounters${qs}`);
    },
};
