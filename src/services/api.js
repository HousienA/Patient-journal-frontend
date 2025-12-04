// API service with environment-based URLs for cloud deployment

// Get API URLs from environment variables with localhost fallbacks
const CLINICAL_API_URL = import.meta.env.VITE_CLINICAL_API_URL ?? 'http://localhost:8082';
const MESSAGING_API_URL = import.meta.env.VITE_MESSAGING_API_URL ?? 'http://localhost:8083';
const SEARCH_API_URL = import.meta.env.VITE_SEARCH_API_URL ?? 'http://localhost:8085';
const IMAGE_API_BASE = import.meta.env.VITE_IMAGE_API_URL ?? 'http://localhost:8084';
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8080';

function getAccessToken() {
    const key = `oidc.user:${KEYCLOAK_URL}/realms/journal-realm:backend-service`;
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

async function apiFetch(endpoint, options = {}, baseUrl = CLINICAL_API_URL) {
    const token = getAccessToken();
    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    };

    const response = await fetch(`${baseUrl}${endpoint}`, config);

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

// Image API (Goes to Image Service)
async function imageApiFetch(endpoint, options = {}) {
    const token = getAccessToken();
    const config = {
        ...options,
        headers: {
            // For image uploads (FormData), don't set Content-Type manually
            ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
            ...(token && { 'Authorization': `Bearer ${token}` }),
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

// Patient API (Goes to Clinical Service)
export const patientApi = {
    getAll: () => apiFetch('/api/clinical/patients', {}, CLINICAL_API_URL),
    getById: (id) => apiFetch(`/api/clinical/patients/${id}`, {}, CLINICAL_API_URL),
    create: (data) => apiFetch('/api/clinical/patients', { method: 'POST', body: JSON.stringify(data) }, CLINICAL_API_URL),
    update: (id, data) => apiFetch(`/api/clinical/patients/${id}`, { method: 'PUT', body: JSON.stringify(data) }, CLINICAL_API_URL),
    delete: (id) => apiFetch(`/api/clinical/patients/${id}`, { method: 'DELETE' }, CLINICAL_API_URL),
};

// Conditions API
export const conditionApi = {
    getAll: () => apiFetch('/api/clinical/conditions', {}, CLINICAL_API_URL),
    getById: (id) => apiFetch(`/api/clinical/conditions/${id}`, {}, CLINICAL_API_URL),
    getByPatientId: (patientId) => apiFetch(`/api/clinical/conditions/patient/${patientId}`, {}, CLINICAL_API_URL),
    create: (data) => apiFetch('/api/clinical/conditions', { method: 'POST', body: JSON.stringify(data) }, CLINICAL_API_URL),
    update: (id, data) => apiFetch(`/api/clinical/conditions/${id}`, { method: 'PUT', body: JSON.stringify(data) }, CLINICAL_API_URL),
    delete: (id) => apiFetch(`/api/clinical/conditions/${id}`, { method: 'DELETE' }, CLINICAL_API_URL),
};

// Encounters API
export const encounterApi = {
    getAll: () => apiFetch('/api/clinical/encounters', {}, CLINICAL_API_URL),
    getById: (id) => apiFetch(`/api/clinical/encounters/${id}`, {}, CLINICAL_API_URL),
    getByPatientId: (patientId) => apiFetch(`/api/clinical/encounters/patient/${patientId}`, {}, CLINICAL_API_URL),
    create: (data) => apiFetch('/api/clinical/encounters', { method: 'POST', body: JSON.stringify(data) }, CLINICAL_API_URL),
    update: (id, data) => apiFetch(`/api/clinical/encounters/${id}`, { method: 'PUT', body: JSON.stringify(data) }, CLINICAL_API_URL),
    delete: (id) => apiFetch(`/api/clinical/encounters/${id}`, { method: 'DELETE' }, CLINICAL_API_URL),
};

// Messages API (Goes to Messaging Service)
export const messageApi = {
    getAll: () => apiFetch('/api/messages', {}, MESSAGING_API_URL),
    getById: (id) => apiFetch(`/api/messages/${id}`, {}, MESSAGING_API_URL),
    getByPatientId: (patientId) => apiFetch(`/api/messages/patient/${patientId}`, {}, MESSAGING_API_URL),
    getByPractitionerId: (practitionerId) => apiFetch(`/api/messages/practitioner/${practitionerId}`, {}, MESSAGING_API_URL),
    create: (data) => apiFetch('/api/messages', { method: 'POST', body: JSON.stringify(data) }, MESSAGING_API_URL),
    markAsRead: (id) => apiFetch(`/api/messages/${id}/read`, { method: 'PUT' }, MESSAGING_API_URL),
};

// Observations API
export const observationApi = {
    getAll: () => apiFetch('/api/clinical/observations', {}, CLINICAL_API_URL),
    getById: (id) => apiFetch(`/api/clinical/observations/${id}`, {}, CLINICAL_API_URL),
    getByEncounterId: (encounterId) => apiFetch(`/api/clinical/observations/encounter/${encounterId}`, {}, CLINICAL_API_URL),
    create: (data) => apiFetch('/api/clinical/observations', { method: 'POST', body: JSON.stringify(data) }, CLINICAL_API_URL),
    update: (id, data) => apiFetch(`/api/clinical/observations/${id}`, { method: 'PUT', body: JSON.stringify(data) }, CLINICAL_API_URL),
    delete: (id) => apiFetch(`/api/clinical/observations/${id}`, { method: 'DELETE' }, CLINICAL_API_URL),
};

// Practitioners API
export const practitionerApi = {
    getAll: () => apiFetch('/api/clinical/practitioners', {}, CLINICAL_API_URL),
    getById: (id) => apiFetch(`/api/clinical/practitioners/${id}`, {}, CLINICAL_API_URL),
    create: (data) => apiFetch('/api/clinical/practitioners', { method: 'POST', body: JSON.stringify(data) }, CLINICAL_API_URL),
    getPatients: (id) => apiFetch(`/api/clinical/practitioners/${id}/patients`, {}, CLINICAL_API_URL),
    getEncounters: (id, date) => {
        const qs = date ? `?date=${date}` : '';
        return apiFetch(`/api/clinical/practitioners/${id}/encounters${qs}`, {}, CLINICAL_API_URL);
    },
};

// Organizations & Locations API
export const organizationApi = {
    getAll: (search = '') => apiFetch(`/api/clinical/organizations${search ? `?q=${search}` : ''}`, {}, CLINICAL_API_URL),
    getById: (id) => apiFetch(`/api/clinical/organizations/${id}`, {}, CLINICAL_API_URL),
    create: (data) => apiFetch('/api/clinical/organizations', { method: 'POST', body: JSON.stringify(data) }, CLINICAL_API_URL),
    update: (id, data) => apiFetch(`/api/clinical/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }, CLINICAL_API_URL),
    delete: (id) => apiFetch(`/api/clinical/organizations/${id}`, { method: 'DELETE' }, CLINICAL_API_URL),
};

export const locationApi = {
    getAll: (organizationId) => {
        const url = organizationId
            ? `/api/clinical/locations?organizationId=${organizationId}`
            : '/api/clinical/locations';
        return apiFetch(url, {}, CLINICAL_API_URL);
    },
    getById: (id) => apiFetch(`/api/clinical/locations/${id}`, {}, CLINICAL_API_URL),
};

export const profileApi = {
    exists: () => apiFetch('/api/clinical/profile/exists', {}, CLINICAL_API_URL),
};

export const onboardingApi = {
    completePatient: (data) => apiFetch('/api/clinical/onboarding/patient', { method: 'POST', body: JSON.stringify(data) }, CLINICAL_API_URL),
    completePractitioner: (data) => apiFetch('/api/clinical/onboarding/practitioner', { method: 'POST', body: JSON.stringify(data) }, CLINICAL_API_URL),
};

// Image API (Goes to Image Service)
export const imageApi = {
    upload: (formData) => imageApiFetch('/images/upload', {
        method: 'POST',
        body: formData
    }),
    getById: (id) => imageApiFetch(`/images/${id}`),
    saveAnnotations: (id, annotations, texts) => imageApiFetch(`/images/${id}/annotate`, {
        method: 'PUT',
        body: JSON.stringify({ annotations, texts })
    }),
    getByPatientId: (patientId) => imageApiFetch(`/images/patient/${patientId}`),
    getByEncounterId: (encounterId) => imageApiFetch(`/images/encounter/${encounterId}`),
};

// Search API (Goes to Search Service - Quarkus)
export const searchApi = {
    searchPatients: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.name) params.append('name', filters.name);
        if (filters.pnr) params.append('pnr', filters.pnr);
        if (filters.condition) params.append('condition', filters.condition);
        const qs = params.toString();
        return apiFetch(`/api/search/patients${qs ? `?${qs}` : ''}`, {}, SEARCH_API_URL);
    },
    searchPractitioners: (name) => {
        const qs = name ? `?name=${encodeURIComponent(name)}` : '';
        return apiFetch(`/api/search/practitioners${qs}`, {}, SEARCH_API_URL);
    },
    getPractitionerPatients: (practitionerId) => apiFetch(`/api/search/practitioners/${practitionerId}/patients`, {}, SEARCH_API_URL),
    getPractitionerEncounters: (practitionerId, date) => {
        const qs = date ? `?date=${date}` : '';
        return apiFetch(`/api/search/practitioners/${practitionerId}/encounters${qs}`, {}, SEARCH_API_URL);
    },
};
