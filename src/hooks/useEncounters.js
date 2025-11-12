import { useState, useEffect } from 'react';
import { encounterApi } from '../services/api';

export function useEncounters(patientId = null) {
    const [encounters, setEncounters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEncounters = async () => {
            try {
                setLoading(true);
                const data = patientId
                    ? await encounterApi.getByPatientId(patientId)
                    : await encounterApi.getAll();
                setEncounters(data || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEncounters();
    }, [patientId]);

    const refresh = async () => {
        try {
            setLoading(true);
            const data = patientId
                ? await encounterApi.getByPatientId(patientId)
                : await encounterApi.getAll();
            setEncounters(data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return { encounters, loading, error, refresh };
}

export function useEncounter(encounterId) {
    const [encounter, setEncounter] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!encounterId) return;

        const fetchEncounter = async () => {
            try {
                setLoading(true);
                const data = await encounterApi.getById(encounterId);
                setEncounter(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEncounter();
    }, [encounterId]);

    return { encounter, loading, error };
}
