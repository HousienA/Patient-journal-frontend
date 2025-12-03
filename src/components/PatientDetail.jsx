import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { patientApi, encounterApi, conditionApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
//import './PatientDetail.css';

export default function PatientDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
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

    const handleAssignToMe = async () => {
        if (!user || !user.id) return;

        try {
            // Vi skickar bara med det vi vill uppdatera
            // Men backend updatePatient förväntar sig kanske hela objektet eller hanterar partiell uppdatering?
            // Vår backend-kod: existing.setFullName(updatedData.getFullName()); etc.
            // Den verkar skriva över allt om det är null.
            // Så vi bör skicka med nuvarande data + ny practitioner.

            const updatedPatient = {
                ...patient,
                primaryPractitioner: { id: user.id } // user.id kommer från AuthContext (dbProfile)
            };

            await patientApi.update(patient.id, updatedPatient);

            // Ladda om data
            loadPatientData();
            alert("Du är nu ansvarig läkare för denna patient.");
        } catch (err) {
            console.error("Failed to assign practitioner", err);
            alert("Kunde inte tilldela läkare: " + err.message);
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ACTIVE': return 'Aktiv';
            case 'CHRONIC': return 'Kronisk';
            case 'UNDERTREATMENT': return 'Under behandling';
            case 'RESOLVED': return 'Avslutad';
            case 'INACTIVE': return 'Inaktiv';
            default: return status;
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
                    <div className="info-item">
                        <label>Ansvarig läkare</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <p style={{ margin: 0 }}>
                                {patient.primaryPractitioner ? patient.primaryPractitioner.fullName : 'Ej tilldelad'}
                            </p>
                            {/* Visa knapp om användaren är läkare och INTE redan är ansvarig */}
                            {user?.role === 'DOCTOR' && patient.primaryPractitioner?.id !== user.id && (
                                <button
                                    onClick={handleAssignToMe}
                                    className="btn-small btn-secondary"
                                    title="Bli ansvarig läkare för denna patient"
                                >
                                    Ta över ansvaret
                                </button>
                            )}
                        </div>
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
                                    <div className="card-actions">
                                        <span className={`status-badge status-${condition.status.toLowerCase()}`}>
                                            {getStatusLabel(condition.status)}
                                        </span>
                                        <button
                                            onClick={() => navigate(`/conditions/${condition.id}/edit`)}
                                            className="btn-icon"
                                            title="Redigera diagnos"
                                        >
                                            Redigera
                                        </button>
                                    </div>
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
                            <div
                                key={encounter.id}
                                className="info-card encounter-clickable"
                                onClick={() => navigate(`/encounters/${encounter.id}`)}
                            >
                                <div className="card-header">
                                    <h3>{encounter.diagnosis || 'Ingen diagnos angiven'}</h3>
                                    <span className="date-badge">
                                        {new Date(encounter.encounterDate).toLocaleDateString('sv-SE')}
                                    </span>
                                </div>
                                {encounter.notes && <p>{encounter.notes}</p>}
                                <div className="encounter-hint">
                                    Klicka för att se detaljer och mätningar
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
