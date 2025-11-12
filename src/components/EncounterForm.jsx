import { useState} from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { encounterApi } from '../services/api';
//import './EncounterForm.css';

export default function EncounterForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patientId');

    const [form, setForm] = useState({
        patientId: patientId || '',
        encounterDate: new Date().toISOString().slice(0, 16), // Dagens datum och tid
        diagnosis: '',
        notes: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.patientId) {
            setError('Patient-ID måste anges');
            return;
        }

        setLoading(true);

        try {
            await encounterApi.create({
                patientId: parseInt(form.patientId),
                encounterDate: form.encounterDate || new Date().toISOString(),
                diagnosis: form.diagnosis.trim() || 'Ingen diagnos angiven',
                notes: form.notes.trim() || '',
                practitionerId: null,
                locationId: null
            });

            // Navigera tillbaka till patientens sida
            navigate(`/patients/${form.patientId}`);
        } catch (err) {
            console.error('Create encounter error:', err);
            setError(err.message || 'Kunde inte skapa vårdmöte');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-header">
                <h2>Nytt vårdmöte</h2>
                <button
                    onClick={() => navigate(-1)}
                    className="btn-back"
                >
                    ← Tillbaka
                </button>
            </div>

            <form onSubmit={handleSubmit} className="encounter-form">
                <div className="form-group">
                    <label htmlFor="patientId">
                        Patient-ID <span className="required">*</span>
                    </label>
                    <input
                        type="number"
                        id="patientId"
                        name="patientId"
                        value={form.patientId}
                        onChange={handleChange}
                        required
                        disabled={!!patientId} // Låst om vi kom från patientens sida
                    />
                    <small>ID för patienten som vårdmötet gäller</small>
                </div>

                <div className="form-group">
                    <label htmlFor="encounterDate">
                        Datum & Tid <span className="required">*</span>
                    </label>
                    <input
                        type="datetime-local"
                        id="encounterDate"
                        name="encounterDate"
                        value={form.encounterDate}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="diagnosis">
                        Diagnos <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="diagnosis"
                        name="diagnosis"
                        value={form.diagnosis}
                        onChange={handleChange}
                        placeholder="T.ex. Influensa, Hypertoni, Bronkit..."
                        required
                    />
                    <small>Huvuddiagnos för detta vårdmöte</small>
                </div>

                <div className="form-group">
                    <label htmlFor="notes">
                        Anteckningar <span className="optional">(valfritt)</span>
                    </label>
                    <textarea
                        id="notes"
                        name="notes"
                        value={form.notes}
                        onChange={handleChange}
                        rows="8"
                        placeholder="Detaljerade anteckningar om vårdmötet, symptom, behandling, etc..."
                    />
                </div>

                {error && (
                    <div className="form-error">
                        ⚠️ {error}
                    </div>
                )}

                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn-primary btn-large"
                        disabled={loading}
                    >
                        {loading ? 'Skapar vårdmöte...' : 'Skapa vårdmöte'}
                    </button>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate(-1)}
                    >
                        Avbryt
                    </button>
                </div>
            </form>
        </div>
    );
}
