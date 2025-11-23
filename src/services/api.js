const API_BASE = '/api';


async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('sessionToken');

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'X-Session-Token': token }),
            ...options.headers,
        },
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'API request failed');
    }

    return response.json();
}

// Auth API
export const authApi = {
    login: (username, password) =>
        apiFetch('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),

    register: (userData) =>
        apiFetch('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        }),

    logout: () =>
        apiFetch('/auth/logout', { method: 'POST' }),
};

// Patient API
export const patientApi = {
    getAll: () => apiFetch('/clinical/patients'),

    getById: (id) => apiFetch(`/clinical/patients/${id}`),

    create: (patientData) =>
        apiFetch('/clinical/patients', {
            method: 'POST',
            body: JSON.stringify(patientData),
        }),

    update: (id, patientData) =>
        apiFetch(`/clinical/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(patientData),
        }),

    delete: (id) =>
        apiFetch(`/clinical/patients/${id}`, { method: 'DELETE' }),

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

// Messages API
export const messageApi = {
    getAll: () => apiFetch('/messaging'),
    getById: (id) => apiFetch(`/messaging/${id}`),
    getByPatientId: (patientId) => apiFetch(`/messaging/patient/${patientId}`),
    getUnread: (patientId) => apiFetch(`/messaging/patient/${patientId}/unread`),
    create: (data) => apiFetch('/messaging', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/messaging/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    markAsRead: (id) => apiFetch(`/messaging/${id}/read`, { method: 'POST' }),
    delete: (id) => apiFetch(`/messaging/${id}`, { method: 'DELETE' }),
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
    update: (id, data) => apiFetch(`/clinical/practitioners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/clinical/practitioners/${id}`, { method: 'DELETE' }),
};

// Organizations API
export const organizationApi = {
    getAll: (search = '') => apiFetch(`/clinical/organizations${search ? `?q=${search}` : ''}`),
    getById: (id) => apiFetch(`/clinical/organizations/${id}`),
    create: (data) => apiFetch('/clinical/organizations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/clinical/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/clinical/organizations/${id}`, { method: 'DELETE' }),
};

// Locations API
// === LOCATION API ===
export const locationApi = {
    getAll: (organizationId) => {
        const url = organizationId
            ? `/clinical/locations?organizationId=${organizationId}`
            : '/clinical/locations';
        return apiFetch(url);
    },
    getById: (id) => apiFetch(`/clinical/locations/${id}`),
};
