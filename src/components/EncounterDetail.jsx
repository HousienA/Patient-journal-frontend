import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {encounterApi, observationApi, locationApi, organizationApi, imageApi} from '../services/api';
//import './EncounterDetail.css';

export default function EncounterDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [encounter, setEncounter] = useState(null);
    const [observations, setObservations] = useState([]);
    const [location, setLocation] = useState(null);
    const [organization, setOrganization] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [images, setImages] = useState([]);

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

            const imagesData = await imageApi.getByEncounterId(id);
            setImages(imagesData || []);


            if (encounterData.locationId) {
                try {
                    const locationData = await locationApi.getById(encounterData.locationId);
                    setLocation(locationData);

                    // Location innehåller organization
                    if (locationData.organizationId && locationData.organizationName) {
                        setOrganization({
                            id: locationData.organizationId,
                            name: locationData.organizationName
                        });
                    }
                } catch (locErr) {
                    console.log('Could not load location:', locErr);
                }
            }
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
                <span className="encounter-date-big">
                    {new Date(encounter.encounterDate).toLocaleDateString('sv-SE', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    })}
                </span>
            </div>

            {/* Grundinfo */}
            <section className="info-section">
                <h2>Information om vårdbesöket</h2>
                <div className="info-grid">
                    <div className="info-item">
                        <label>Datum & Tid</label>
                        <p>{new Date(encounter.encounterDate).toLocaleDateString('sv-SE', {
                            year: 'numeric', month: 'long', day: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                        })}</p>
                    </div>
                    <div className="info-item">
                        <label>Diagnos</label>
                        <p className="diagnosis-text">{encounter.diagnosis}</p>
                    </div>
                    <div className="info-item">
                        <label>Patient-ID</label>
                        <p>#{encounter.patientId}</p>
                    </div>


                    {organization && (
                        <div className="info-item">
                            <label>Organisation</label>
                            <p>{organization.name}</p>
                        </div>
                    )}


                    {location && (
                        <div className="info-item">
                            <label>Plats</label>
                            <p>{location.name}</p>
                        </div>
                    )}
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
                    <div className="empty-state">
                        <p className="empty-text">Inga mätningar registrerade</p>
                        <p className="help-text">Lägg till mätningar som togs vid detta vårdmöte</p>
                    </div>
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
                                    title="Redigera observation"
                                >
                                    redigera
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="info-section">
                <div className="section-header">
                    <h2>Bilder ({images.length})</h2>
                    {/* Knapp för att ladda upp NY bild */}
                    <button
                        className="btn-primary"
                        onClick={() => navigate(`/encounters/${id}/upload-image`)} // Du behöver kanske skapa denna sida också?
                    >
                        + Ladda upp bild
                    </button>
                </div>

                <div className="image-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '20px',
                    marginTop: '15px'
                }}>
                    {images.length === 0 ? (
                        <p className="empty-text">Inga bilder uppladdade för detta besök.</p>
                    ) : (
                        images.map(img => (
                            <div key={img.id} className="image-card"
                                 style={{border: '1px solid #eee', padding: '10px', borderRadius: '8px'}}>
                                <img
                                    src={img.url}
                                    alt="Klinisk bild"
                                    style={{width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px'}}
                                />
                                <p style={{
                                    fontSize: '0.9rem',
                                    margin: '5px 0'
                                }}>{img.description || 'Ingen beskrivning'}</p>

                                <button
                                    onClick={() => navigate(`/images/${img.id}/edit`)}
                                    className="btn-secondary"
                                    style={{width: '100%', marginTop: '5px'}}
                                >
                                    🖊️ Rita / Anteckna
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </section>

        </div>
    );
}
