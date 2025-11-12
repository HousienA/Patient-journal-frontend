import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../services/api';
//import './PatientForm.css';

export default function PatientForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        fullName: '',
        personalNumber: '',
        email: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const validatePersonalNumber = (pnr) => {
        // Acceptera formaten: ÅÅMMDD-XXXX, ÅÅÅÅMMDD-XXXX
        const regex = /^(\d{6}|\d{8})[-+]?\d{4}$/;
        return regex.test(pnr);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validera personnummer
        if (!validatePersonalNumber(form.personalNumber)) {
            setError('Personnummer måste vara i formatet ÅÅMMDD-XXXX eller ÅÅÅÅMMDD-XXXX');
            return;
        }

        setLoading(true);

        try {
            await patientApi.create({
                fullName: form.fullName.trim(),
                personalNumber: form.personalNumber.trim(),
                email: form.email.trim() || null,
                phone: form.phone.trim() || null,
                userId: null  // Patient skapas utan användarkonto
            });

            // Navigera tillbaka till listan
            navigate('/patients');
        } catch (err) {
            setError(err.message || 'Kunde inte skapa patient');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="form-container">
            <div className="form-header">
                <h2>Skapa ny patient</h2>
                <button
                    onClick={() => navigate('/patients')}
                    className="btn-back"
                >
                    ← Tillbaka
                </button>
            </div>

            <form onSubmit={handleSubmit} className="patient-form">
                <div className="form-group">
                    <label htmlFor="fullName">
                        Fullständigt namn <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="För- och efternamn"
                        required
                        maxLength={200}
                    />
                    <small>Max 200 tecken</small>
                </div>

                <div className="form-group">
                    <label htmlFor="personalNumber">
                        Personnummer <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        id="personalNumber"
                        name="personalNumber"
                        value={form.personalNumber}
                        onChange={handleChange}
                        placeholder="ÅÅMMDD-XXXX eller ÅÅÅÅMMDD-XXXX"
                        required
                    />
                    <small>Exempel: 950215-1234 eller 19950215-1234</small>
                </div>

                <div className="form-group">
                    <label htmlFor="email">
                        E-post <span className="optional">(valfritt)</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="exempel@mail.com"
                        maxLength={255}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="phone">
                        Telefon <span className="optional">(valfritt)</span>
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="070-123 45 67"
                        maxLength={50}
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
                        {loading ? 'Skapar patient...' : 'Skapa patient'}
                    </button>
                    <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => navigate('/patients')}
                    >
                        Avbryt
                    </button>
                </div>
            </form>
        </div>
    );
}
