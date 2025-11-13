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
    getAll: () => apiFetch('/patients'),

    getById: (id) => apiFetch(`/patients/${id}`),

    create: (patientData) =>
        apiFetch('/patients', {
            method: 'POST',
            body: JSON.stringify(patientData),
        }),

    update: (id, patientData) =>
        apiFetch(`/patients/${id}`, {
            method: 'PUT',
            body: JSON.stringify(patientData),
        }),

    delete: (id) =>
        apiFetch(`/patients/${id}`, { method: 'DELETE' }),

    searchByFields: ({ pnr, name }) => {
        const params = new URLSearchParams();
        if (pnr) params.append('pnr', pnr);
        if (name) params.append('name', name);
        const qs = params.toString();
        return apiFetch(`/patients/search${qs ? `?${qs}` : ''}`);
    }
};

// Conditions API
export const conditionApi = {
    getAll: () => apiFetch('/conditions'),
    getById: (id) => apiFetch(`/conditions/${id}`),
    getByPatientId: (patientId) => apiFetch(`/conditions/patient/${patientId}`),
    create: (data) => apiFetch('/conditions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/conditions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/conditions/${id}`, { method: 'DELETE' }),
};

// Encounters API
export const encounterApi = {
    getAll: () => apiFetch('/encounters'),
    getById: (id) => apiFetch(`/encounters/${id}`),
    getByPatientId: (patientId) => apiFetch(`/encounters/patient/${patientId}`),
    create: (data) => apiFetch('/encounters', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/encounters/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/encounters/${id}`, { method: 'DELETE' }),
};

// Messages API
export const messageApi = {
    getAll: () => apiFetch('/messages'),
    getById: (id) => apiFetch(`/messages/${id}`),
    getByPatientId: (patientId) => apiFetch(`/messages/patient/${patientId}`),
    getUnread: (patientId) => apiFetch(`/messages/patient/${patientId}/unread`),
    create: (data) => apiFetch('/messages', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/messages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    markAsRead: (id) => apiFetch(`/messages/${id}/read`, { method: 'POST' }),
    delete: (id) => apiFetch(`/messages/${id}`, { method: 'DELETE' }),
};

// Observations API
export const observationApi = {
    getAll: () => apiFetch('/observations'),
    getById: (id) => apiFetch(`/observations/${id}`),
    getByEncounterId: (encounterId) => apiFetch(`/observations/encounter/${encounterId}`),
    create: (data) => apiFetch('/observations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/observations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/observations/${id}`, { method: 'DELETE' }),
};

// Practitioners API
export const practitionerApi = {
    getAll: () => apiFetch('/practitioners'),
    getById: (id) => apiFetch(`/practitioners/${id}`),
    create: (data) => apiFetch('/practitioners', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/practitioners/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/practitioners/${id}`, { method: 'DELETE' }),
};

// Organizations API
export const organizationApi = {
    getAll: (search = '') => apiFetch(`/organizations${search ? `?q=${search}` : ''}`),
    getById: (id) => apiFetch(`/organizations/${id}`),
    create: (data) => apiFetch('/organizations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/organizations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/organizations/${id}`, { method: 'DELETE' }),
};

// Locations API
export const locationApi = {
    getAll: (organizationId = null, search = '') => {
        const params = new URLSearchParams();
        if (organizationId) params.append('organizationId', organizationId);
        if (search) params.append('q', search);
        return apiFetch(`/locations${params.toString() ? `?${params.toString()}` : ''}`);
    },
    getById: (id) => apiFetch(`/locations/${id}`),
    create: (data) => apiFetch('/locations', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => apiFetch(`/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id) => apiFetch(`/locations/${id}`, { method: 'DELETE' }),
};
