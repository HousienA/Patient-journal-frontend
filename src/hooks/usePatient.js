import { useState, useEffect } from 'react';
import { patientApi } from '../services/api';

export function usePatient(patientId) {
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!patientId) return;

        const fetchPatient = async () => {
            try {
                setLoading(true);
                const data = await patientApi.getById(patientId);
                setPatient(data.data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchPatient();
    }, [patientId]);

    return { patient, loading, error };
}
