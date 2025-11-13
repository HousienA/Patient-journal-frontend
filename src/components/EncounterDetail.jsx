import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { encounterApi, observationApi } from '../services/api';
//import './EncounterDetail.css';

export default function EncounterDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [encounter, setEncounter] = useState(null);
    const [observations, setObservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadEncounterData();
    }, [id]);

    const loadEncounterData = async () => {
        try {
            setLoading(true);
            const [encounterData, observationData] = await Promise.all([
                encounterApi.getById(id),
                observationApi.getByEncounterId(id).catch(() => [])
            ]);

            setEncounter(encounterData);
            setObservations(Array.isArray(observationData) ? observationData : []);
        } catch (err) {
            console.error('Error loading encounter:', err);
            setError('Kunde inte ladda vårdmöte');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Laddar vårdmöte...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!encounter) return <div className="error-message">Vårdmöte hittades inte</div>;

    return (
        <div className="encounter-detail">
            <div className="detail-header">
                <button onClick={() => navigate(-1)} className="btn-back">
                    ← Tillbaka
                </button>
                <h1>Vårdmöte - {encounter.diagnosis}</h1>
            </div>

            {/* Grundinfo */}
            <section className="info-section">
                <h2>Information</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <label>Datum & Tid</label>
                        <p>{new Date(encounter.encounterDate).toLocaleDateString('sv-SE', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}</p>
                    </div>
                    <div className="info-item">
                        <label>Patient-ID</label>
                        <p>#{encounter.patientId}</p>
                    </div>
                </div>
                {encounter.notes && (
                    <div className="notes-box">
                        <label>Anteckningar</label>
                        <p>{encounter.notes}</p>
                    </div>
                )}
            </section>

            {/* Observations */}
            <section className="info-section">
                <div className="section-header">
                    <h2>Mätningar & Observationer ({observations.length})</h2>
                    <button
                        onClick={() => navigate(`/observations/new?encounterId=${id}`)}
                        className="btn-primary"
                    >
                        + Ny mätning
                    </button>
                </div>

                {observations.length === 0 ? (
                    <p className="empty-text">Inga mätningar registrerade</p>
                ) : (
                    <div className="observation-grid">
                        {observations.map(obs => (
                            <div key={obs.id} className="observation-card">
                                <h3>{obs.observationType}</h3>
                                <p className="observation-value">
                                    {obs.value} {obs.unit && <span className="unit">{obs.unit}</span>}
                                </p>
                                <small>
                                    {obs.observedAt && new Date(obs.observedAt).toLocaleDateString('sv-SE', {
                                        month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </small>
                                <button
                                    onClick={() => navigate(`/observations/${obs.id}/edit`)}
                                    className="btn-icon"

                                >
                                    ✎ Redigera
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
