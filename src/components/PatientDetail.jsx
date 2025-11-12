import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientApi, encounterApi, conditionApi } from '../services/api';
//import './PatientDetail.css';

export default function PatientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [encounters, setEncounters] = useState([]);
    const [conditions, setConditions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadPatientData();
    }, [id]);

    const loadPatientData = async () => {
        try {
            setLoading(true);

            // Hämta patient
            const patientData = await patientApi.getById(id);
            setPatient(patientData);

            // Hämta vårdmöten och diagnoser för denna patient
            const [encounterData, conditionData] = await Promise.all([
                encounterApi.getByPatientId(id).catch(() => []),
                conditionApi.getByPatientId(id).catch(() => [])
            ]);

            setEncounters(Array.isArray(encounterData) ? encounterData : []);
            setConditions(Array.isArray(conditionData) ? conditionData : []);
        } catch (err) {
            console.error('Error loading patient data:', err);
            setError(err.message || 'Kunde inte ladda patientinformation');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Laddar patientinformation...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!patient) {
        return <div className="error-message">Patient hittades inte</div>;
    }

    return (
        <div className="patient-detail">
            {/* Header */}
            <div className="detail-header">
                <button onClick={() => navigate('/patients')} className="btn-back">
                    ← Tillbaka till patienter
                </button>
                <h1>{patient.fullName}</h1>
            </div>

            {/* Patient info */}
            <section className="info-section">
                <h2>Personuppgifter</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <label>Personnummer</label>
                        <p>{patient.personalNumber}</p>
                    </div>
                    <div className="info-item">
                        <label>E-post</label>
                        <p>{patient.email || 'Ej angivet'}</p>
                    </div>
                    <div className="info-item">
                        <label>Telefon</label>
                        <p>{patient.phone || 'Ej angivet'}</p>
                    </div>
                    <div className="info-item">
                        <label>Patient-ID</label>
                        <p>#{patient.id}</p>
                    </div>
                </div>
            </section>

            {/* Diagnoser/Conditions */}
            <section className="info-section">
                <div className="section-header">
                    <h2>Diagnoser ({conditions.length})</h2>
                    <button
                        onClick={() => navigate(`/conditions/new?patientId=${id}`)}
                        className="btn-primary"
                    >
                        + Ny diagnos
                    </button>
                </div>
                {conditions.length === 0 ? (
                    <p className="empty-text">Inga diagnoser registrerade</p>
                ) : (
                    <div className="card-list">
                        {conditions.map(condition => (
                            <div key={condition.id} className="info-card">
                                <div className="card-header">
                                    <h3>{condition.conditionName}</h3>
                                    <span className={`status-badge ${condition.status.toLowerCase()}`}>
              {condition.status === 'ACTIVE' ? 'Aktiv' : 'Avslutad'}
            </span>
                                </div>
                                {condition.description && <p>{condition.description}</p>}
                                <small>
                                    Diagnostiserad: {condition.diagnosedDate ?
                                    new Date(condition.diagnosedDate).toLocaleDateString('sv-SE') :
                                    'Okänt datum'}
                                </small>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Vårdmöten */}
            <section className="info-section">
                <div className="section-header">
                    <h2>Vårdmöten ({encounters.length})</h2>
                    <button
                        onClick={() => navigate(`/encounters/new?patientId=${id}`)}
                        className="btn-primary"
                    >
                        + Nytt vårdmöte
                    </button>
                </div>
                {encounters.length === 0 ? (
                    <p className="empty-text">Inga vårdmöten registrerade</p>
                ) : (
                    <div className="card-list">
                        {encounters.map(encounter => (
                            <div key={encounter.id} className="info-card">
                                <div className="card-header">
                                    <h3>{encounter.diagnosis || 'Ingen diagnos angiven'}</h3>
                                    <span className="date-badge">
                    {new Date(encounter.encounterDate).toLocaleDateString('sv-SE')}
                  </span>
                                </div>
                                {encounter.notes && <p>{encounter.notes}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
