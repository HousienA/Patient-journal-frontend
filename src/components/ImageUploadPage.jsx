import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { imageApi } from '../services/api';

export default function ImageUploadPage() {
    const { encounterId } = useParams(); // Hämtar ID från URL:en
    const navigate = useNavigate();

    const [file, setFile] = useState(null);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Välj en bild först');
            return;
        }

        setLoading(true);
        setError('');

        try {
            // 1. Skapa ett FormData-objekt (krävs för filuppladdning)
            const formData = new FormData();
            formData.append('image', file);
            formData.append('encounterId', encounterId);
            // Vi borde nog skicka med patientId också, men vi har det inte i URL:en just nu.
            // Node-tjänsten kanske klarar sig med bara encounterId om vi bara filtrerar på det.
            // (Vill du vara supernoga borde du hämta Encounter först för att få patientId, men vi kör enkelt nu)
            formData.append('description', description);

            // 2. Skicka till Node-tjänsten
            await imageApi.upload(formData);

            // 3. Gå tillbaka till vårdmötet
            navigate(`/encounters/${encounterId}`);

        } catch (err) {
            console.error('Upload error:', err);
            setError('Kunde inte ladda upp bild. Är bildtjänsten igång?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-header">
                <h2>Ladda upp bild till vårdmöte</h2>
                <button onClick={() => navigate(-1)} className="btn-back">
                    ← Avbryt
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {error && <div className="error-message">{error}</div>}

                <div className="form-group">
                    <label>Välj bild:</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Beskrivning (valfritt):</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="T.ex. Sår på vänster arm..."
                    />
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Laddar upp...' : 'Ladda upp bild'}
                    </button>
                </div>
            </form>
        </div>
    );
}
