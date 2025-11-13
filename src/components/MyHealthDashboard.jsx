import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { patientApi, encounterApi, conditionApi, messageApi } from '../services/api';
//import './MyHealthDashboard.css';

export default function MyHealthDashboard() {
    const { user } = useAuth();
    const [patientData, setPatientData] = useState(null);
    const [encounters, setEncounters] = useState([]);
    const [conditions, setConditions] = useState([]);
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMyHealthData();
    }, []);

    const loadMyHealthData = async () => {
        try {
            setLoading(true);

            // Hämta alla patienter och hitta den som tillhör mig
            const allPatients = await patientApi.getAll();
            const myPatient = Array.isArray(allPatients)
                ? allPatients.find(p => p.userId === user.id)
                : null;

            if (!myPatient) {
                setError('Din patientprofil hittades inte. Kontakta vårdpersonalen.');
                setLoading(false);
                return;
            }

            setPatientData(myPatient);

            // Hämta min data
            const [encounterData, conditionData, messageData] = await Promise.all([
                encounterApi.getByPatientId(myPatient.id).catch(() => []),
                conditionApi.getByPatientId(myPatient.id).catch(() => []),
                messageApi.getByPatientId(myPatient.id).catch(() => [])
            ]);

            setEncounters(Array.isArray(encounterData) ? encounterData : []);
            setConditions(Array.isArray(conditionData) ? conditionData : []);
            setMessages(Array.isArray(messageData) ? messageData : []);
        } catch (err) {
            console.error('Error loading health data:', err);
            setError('Kunde inte ladda din hälsoinformation');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Laddar din hälsoinformation...</div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <h2>⚠️ {error}</h2>
                <p>Om du inte har en patientprofil, kontakta mottagningen för att få en skapad.</p>
            </div>
        );
    }

    if (!patientData) {
        return (
            <div className="error-container">
                <h2>Ingen patientprofil</h2>
                <p>Du har inget patientkonto kopplat till din användare än. Kontakta vårdpersonalen.</p>
            </div>
        );
    }

    const activeConditions = conditions.filter(c => c.status === 'ACTIVE');
    const unreadMessages = messages.filter(m => !m.isRead);

    return (
        <div className="my-health-dashboard">
            <div className="dashboard-header">
                <h1>Min hälsoinformation</h1>
                <p className="subtitle">Översikt över dina vårdbesök och diagnoser</p>
            </div>
            {/* Personuppgifter */}
            <section className="info-section">
                <h2>Mina uppgifter</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <label>Fullständigt namn</label>
                        <p>{patientData.fullName}</p>
                    </div>
                    <div className="info-item">
                        <label>Personnummer</label>
                        <p>{patientData.personalNumber}</p>
                    </div>
                    <div className="info-item">
                        <label>E-post</label>
                        <p>{patientData.email || 'Ej angivet'}</p>
                    </div>
                    <div className="info-item">
                        <label>Telefon</label>
                        <p>{patientData.phone || 'Ej angivet'}</p>
                    </div>
                </div>
            </section>

            {/* Aktiva diagnoser */}
            <section className="info-section">
                <h2>Mina diagnoser ({conditions.length})</h2>
                {conditions.length === 0 ? (
                    <p className="empty-text">Inga diagnoser registrerade</p>
                ) : (
                    <div className="card-list">
                        {conditions.map(condition => (
                            <div key={condition.id} className="health-card">
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

            {/* Vårdbesök */}
            <section className="info-section">
                <h2>Mina vårdbesök ({encounters.length})</h2>
                {encounters.length === 0 ? (
                    <p className="empty-text">Inga vårdbesök registrerade</p>
                ) : (
                    <div className="card-list">
                        {encounters
                            .sort((a, b) => new Date(b.encounterDate) - new Date(a.encounterDate))
                            .map(encounter => (
                                <div key={encounter.id} className="health-card">
                                    <div className="card-header">
                                        <h3>{encounter.diagnosis || 'Ingen diagnos angiven'}</h3>
                                        <span className="date-badge">
                    {new Date(encounter.encounterDate).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}
                  </span>
                                    </div>
                                    {encounter.notes && (
                                        <div className="notes-section">
                                            <strong>Anteckningar:</strong>
                                            <p>{encounter.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                )}
            </section>

            {/* Meddelanden */}
            <section className="info-section">
                <h2>Mina meddelanden ({messages.length})</h2>
                {messages.length === 0 ? (
                    <p className="empty-text">Inga meddelanden</p>
                ) : (
                    <div className="card-list">
                        {messages
                            .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
                            .slice(0, 5)
                            .map(msg => (
                                <div key={msg.id} className={`health-card ${!msg.isRead ? 'unread' : ''}`}>
                                    <div className="card-header">
                                        <h3>{msg.subject}</h3>
                                        {!msg.isRead && <span className="unread-badge">Nytt</span>}
                                    </div>
                                    <p>{msg.content}</p>
                                    <small>
                                        Från: {msg.senderName} • {new Date(msg.sentAt).toLocaleDateString('sv-SE', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                    </small>
                                </div>
                            ))}
                    </div>
                )}
            </section>

            {/* Info-ruta */}
            <div className="info-notice">
                <h3>ℹ️ Om din hälsoinformation</h3>
                <p>Du kan se all din registrerade hälsoinformation här. Om du har frågor eller vill ändra något, kontakta din vårdgivare.</p>
                <p><strong>Observera:</strong> Du kan inte redigera eller ta bort information själv. Detta måste göras av vårdpersonal.</p>
            </div>
        </div>
    );
}
