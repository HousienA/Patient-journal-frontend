import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { conditionApi } from '../services/api';
//import './ConditionForm.css';

export default function ConditionForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patientId');

    const [form, setForm] = useState({
        patientId: patientId || '',
        conditionName: '',
        description: '',
        status: 'ACTIVE',
        diagnosedDate: new Date().toISOString().slice(0, 10) // Dagens datum
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
            await conditionApi.create({
                patientId: parseInt(form.patientId),
                conditionName: form.conditionName.trim(),
                description: form.description.trim() || '',
                status: form.status,
                diagnosedDate: form.diagnosedDate
            });

            // Navigera tillbaka till patientens sida
            navigate(`/patients/${form.patientId}`);
        } catch (err) {
            console.error('Create condition error:', err);
            setError(err.message || 'Kunde inte skapa diagnos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-header">
                <h2>Ny diagnos/tillstånd</h2>
                <button
                    onClick={() => navigate(-1)}
                    className="btn-back"
                >
                    ← Tillbaka
                </button>
            </div>

            <form onSubmit={handleSubmit} className="condition-form">
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
                        disabled={!!patientId}
                    />
                    <small>ID för patienten som diagnosen gäller</small>
                </div>

                <div className="form-group">
                    <label htmlFor="conditionName">
                        Diagnos/Tillstånd <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="conditionName"
                        name="conditionName"
                        value={form.conditionName}
                        onChange={handleChange}
                        placeholder="T.ex. Hypertoni, Diabetes typ 2, Astma..."
                        required
                    />
                    <small>Namn på diagnosen eller det medicinska tillståndet</small>
                </div>

                <div className="form-group">
                    <label htmlFor="description">
                        Beskrivning <span className="optional">(valfritt)</span>
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        rows="5"
                        placeholder="Detaljerad beskrivning av tillståndet, behandling, etc..."
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="status">
                            Status <span className="required">*</span>
                        </label>
                        <select
                            id="status"
                            name="status"
                            value={form.status}
                            onChange={handleChange}
                            required
                        >
                            <option value="ACTIVE">Aktiv</option>
                            <option value="RESOLVED">Avslutad/Botad</option>
                        </select>
                        <small>Är tillståndet aktivt eller avslutat?</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="diagnosedDate">
                            Diagnostiserad datum
                        </label>
                        <input
                            type="date"
                            id="diagnosedDate"
                            name="diagnosedDate"
                            value={form.diagnosedDate}
                            onChange={handleChange}
                        />
                    </div>
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
                        {loading ? 'Skapar diagnos...' : 'Skapa diagnos'}
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
