import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { conditionApi } from '../services/api';
// import './ConditionForm.css';

export default function ConditionForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { id } = useParams();
    const isEdit = !!id;
    const patientId = searchParams.get('patientId');

    const [form, setForm] = useState({
        patientId: patientId || '',
        conditionName: '',
        description: '',
        status: 'ACTIVE',
        diagnosedDate: new Date().toISOString().slice(0, 10)
    });
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(isEdit);
    const [error, setError] = useState('');

    // preload when editing
    useEffect(() => {
        if (!isEdit) return;
        const load = async () => {
            try {
                setLoadingData(true);
                const data = await conditionApi.getById(id);
                setForm({
                    patientId: (data.patientId ?? '').toString(),
                    conditionName: data.conditionName ?? '',
                    description: data.description ?? '',
                    status: data.status ?? 'ACTIVE',
                    diagnosedDate: data.diagnosedDate ?? new Date().toISOString().slice(0, 10),
                });
            } catch (err) {
                setError(err.message || 'Kunde inte ladda diagnos');
            } finally {
                setLoadingData(false);
            }
        };
        load();
    }, [id, isEdit]);

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
            const payload = {
                patientId: parseInt(form.patientId, 10),
                conditionName: form.conditionName.trim(),
                description: (form.description || '').trim(),
                status: form.status,
                diagnosedDate: form.diagnosedDate
            };
            if (isEdit) {
                await conditionApi.update(id, payload);
            } else {
                await conditionApi.create(payload);
            }
            navigate(`/patients/${payload.patientId}`);
        } catch (err) {
            console.error(isEdit ? 'Update condition error:' : 'Create condition error:', err);
            setError(err.message || (isEdit ? 'Kunde inte uppdatera diagnos' : 'Kunde inte skapa diagnos'));
        } finally {
            setLoading(false);
        }
    };

    // delete handler in edit mode
    const handleDelete = async () => {
        if (!isEdit) return;
        if (!window.confirm('Vill du ta bort denna diagnos?')) return;
        try {
            setLoading(true);
            await conditionApi.delete(id);
            const pid = form.patientId || patientId;
            navigate(`/patients/${pid}`);
        } catch (err) {
            console.error('Delete condition error:', err);
            setError(err.message || 'Kunde inte ta bort diagnos');
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return <div className="loading">Laddar diagnos...</div>;
    }

    return (
        <div className="form-container">
            <div className="form-header">
                <h2>{isEdit ? 'Redigera diagnos/tillstånd' : 'Ny diagnos/tillstånd'}</h2>
                <button onClick={() => navigate(-1)} className="btn-back">← Tillbaka</button>
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
                        disabled={!!patientId || isEdit}
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
                        <label htmlFor="diagnosedDate">Diagnostiserad datum</label>
                        <input
                            type="date"
                            id="diagnosedDate"
                            name="diagnosedDate"
                            value={form.diagnosedDate}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                {error && <div className="form-error">⚠️ {error}</div>}

                <div className="form-actions">
                    <button type="submit" className="btn-primary btn-large" disabled={loading}>
                        {loading ? (isEdit ? 'Uppdaterar…' : 'Skapar…') : (isEdit ? 'Uppdatera diagnos' : 'Skapa diagnos')}
                    </button>

                    <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
                        Avbryt
                    </button>

                    {isEdit && (
                        <button type="button" className="btn-danger" onClick={handleDelete} disabled={loading}>
                            Ta bort
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
