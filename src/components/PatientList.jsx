import { useEffect, useState } from 'react';
import { patientApi } from '../services/api';

export default function PatientList() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const data = await patientApi.getAll();
            setPatients(data.data || []);
        } catch (err) {
            setError(err.message || 'Kunde inte hämta patienter');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p>Laddar patienter...</p>;
    if (error) return <p className="error">{error}</p>;

    return (
        <div className="patient-list">
            <h2>Patienter ({patients.length})</h2>
            <ul>
                {patients.map(patient => (
                    <li key={patient.id}>
                        <strong>{patient.fullName}</strong>
                        <p>Personnummer: {patient.personalNumber}</p>
                        <p>Email: {patient.email}</p>
                        <p>Telefon: {patient.phone}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
