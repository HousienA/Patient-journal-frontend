import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { observationApi } from '../services/api';
//import './ObservationForm.css';

export default function ObservationForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { id } = useParams();
    const encounterId = searchParams.get('encounterId');
    const isEdit = !!id;

    const [form, setForm] = useState({
        encounterId: encounterId || '',
        observationType: '',
        value: '',
        unit: '',
        observedAt: new Date().toISOString().slice(0, 16)
    });
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(isEdit);
    const [error, setError] = useState('');


    const observationTypes = [
        { type: 'Blodtryck', unit: 'mmHg', placeholder: 'T.ex. 120/80' },
        { type: 'Puls', unit: 'slag/min', placeholder: 'T.ex. 72' },
        { type: 'Temperatur', unit: '°C', placeholder: 'T.ex. 37.2' },
        { type: 'Vikt', unit: 'kg', placeholder: 'T.ex. 75.5' },
        { type: 'Längd', unit: 'cm', placeholder: 'T.ex. 175' },
        { type: 'Blodsocker', unit: 'mmol/L', placeholder: 'T.ex. 5.5' },
        { type: 'Syresättning', unit: '%', placeholder: 'T.ex. 98' },
        { type: 'Andningsfrekvens', unit: 'andetag/min', placeholder: 'T.ex. 16' },
        { type: 'Annat', unit: '', placeholder: 'Ange värde' }
    ];

    useEffect(() => {
        if (isEdit) {
            loadObservation();
        }
    }, [id]);

    const loadObservation = async () => {
        try {
            setLoadingData(true);
            const data = await observationApi.getById(id);
            setForm({
                encounterId: data.encounterId,
                observationType: data.observationType,
                value: data.value,
                unit: data.unit || '',
                observedAt: data.observedAt ? new Date(data.observedAt).toISOString().slice(0, 16) : ''
            });
        } catch (err) {
            console.error('Error loading observation:', err);
            setError('Kunde inte ladda observation');
        } finally {
            setLoadingData(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;


        if (name === 'observationType') {
            const selectedType = observationTypes.find(t => t.type === value);
            setForm(prev => ({
                ...prev,
                [name]: value,
                unit: selectedType ? selectedType.unit : ''
            }));
        } else {
            setForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!form.encounterId) {
            setError('Encounter-ID måste anges');
            return;
        }

        setLoading(true);

        try {
            const data = {
                encounterId: parseInt(form.encounterId),
                observationType: form.observationType,
                value: form.value,
                unit: form.unit || null,
                observedAt: form.observedAt || new Date().toISOString()
            };

            if (isEdit) {
                await observationApi.update(id, data);
            } else {
                await observationApi.create(data);
            }

            navigate(-1);
        } catch (err) {
            console.error('Save observation error:', err);
            setError(err.message || `Kunde inte ${isEdit ? 'uppdatera' : 'skapa'} observation`);
        } finally {
            setLoading(false);
        }
    };

    if (loadingData) {
        return <div className="loading">Laddar observation...</div>;
    }

    const selectedType = observationTypes.find(t => t.type === form.observationType);

    return (
        <div className="form-container">
            <div className="form-header">
                <h2>{isEdit ? 'Redigera observation' : 'Ny observation/mätning'}</h2>
                <button onClick={() => navigate(-1)} className="btn-back">
                    ← Tillbaka
                </button>
            </div>

            <form onSubmit={handleSubmit} className="observation-form">
                <div className="form-group">
                    <label htmlFor="encounterId">
                        Vårdmöte-ID <span className="required">*</span>
                    </label>
                    <input
                        type="number"
                        id="encounterId"
                        name="encounterId"
                        value={form.encounterId}
                        onChange={handleChange}
                        required
                        disabled={!!encounterId || isEdit}
                    />
                    <small>ID för vårdmötet som mätningen gjordes vid</small>
                </div>

                <div className="form-group">
                    <label htmlFor="observationType">
                        Typ av mätning <span className="required">*</span>
                    </label>
                    <select
                        id="observationType"
                        name="observationType"
                        value={form.observationType}
                        onChange={handleChange}
                        required
                    >
                        <option value="">-- Välj mätningstyp --</option>
                        {observationTypes.map(type => (
                            <option key={type.type} value={type.type}>
                                {type.type} {type.unit && `(${type.unit})`}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="value">
                            Värde <span className="required">*</span>
                        </label>
                        <input
                            type="text"
                            id="value"
                            name="value"
                            value={form.value}
                            onChange={handleChange}
                            placeholder={selectedType?.placeholder || 'Ange värde'}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="unit">
                            Enhet {form.unit && <span className="optional">(förifylld)</span>}
                        </label>
                        <input
                            type="text"
                            id="unit"
                            name="unit"
                            value={form.unit}
                            onChange={handleChange}
                            placeholder="T.ex. mmHg, kg, °C"
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="observedAt">
                        Tidpunkt för mätning
                    </label>
                    <input
                        type="datetime-local"
                        id="observedAt"
                        name="observedAt"
                        value={form.observedAt}
                        onChange={handleChange}
                    />
                </div>


                <div className="form-actions">
                    <button
                        type="submit"
                        className="btn-primary btn-large"
                        disabled={loading}
                    >
                        {loading ? 'Sparar...' : (isEdit ? 'Uppdatera observation' : 'Skapa observation')}
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
