import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../services/api';
//import './PatientList.css';

export default function PatientList() {
    const navigate = useNavigate();
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
            console.log('Patients from API:', data); // Debug

            // Hantera olika svar-format från backend
            if (Array.isArray(data)) {
                setPatients(data);
            } else if (data && Array.isArray(data.data)) {
                setPatients(data.data);
            } else {
                setPatients([]);
            }
        } catch (err) {
            console.error('Error loading patients:', err);
            setError(err.message || 'Kunde inte ladda patienter');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Laddar patienter...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="patient-list">
            <div className="list-header">
                <h2>Patienter ({patients.length})</h2>
                <button
                    onClick={() => navigate('/patients/new')}
                    className="btn-primary"
                >
                    + Ny patient
                </button>
            </div>

            {patients.length === 0 ? (
                <div className="empty-state">
                    <p>Inga patienter registrerade än</p>
                    <button
                        onClick={() => navigate('/patients/new')}
                        className="btn-primary"
                    >
                        Skapa första patienten
                    </button>
                </div>
            ) : (
                <div className="patient-grid">
                    {patients.map(patient => (
                        <div
                            key={patient.id}
                            className="patient-card"
                            onClick={() => navigate(`/patients/${patient.id}`)}
                        >
                            <div className="patient-card-header">
                                <h3>{patient.fullName}</h3>
                                <span className="patient-id">#{patient.id}</span>
                            </div>
                            <div className="patient-card-body">
                                <p><strong>Personnummer:</strong> {patient.personalNumber}</p>
                                {patient.email && <p><strong>Email:</strong> {patient.email}</p>}
                                {patient.phone && <p><strong>Telefon:</strong> {patient.phone}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
