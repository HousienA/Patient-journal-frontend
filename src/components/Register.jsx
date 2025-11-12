/* eslint-disable react-refresh/only-export-components */
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
//import './Register.css';

export default function Register() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'PATIENT',
        // Patient-specifika fält
        fullName: '',
        personalNumber: '',
        phone: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        // Validera lösenord matchar
        if (form.password !== form.confirmPassword) {
            setError('Lösenorden matchar inte');
            return false;
        }

        // Validera lösenordsstyrka
        if (form.password.length < 6) {
            setError('Lösenordet måste vara minst 6 tecken');
            return false;
        }

        // Validera PATIENT
        if (form.role === 'PATIENT') {
            if (!form.fullName.trim()) {
                setError('Fullständigt namn krävs för patienter');
                return false;
            }

            if (!form.personalNumber.trim()) {
                setError('Personnummer krävs för patienter');
                return false;
            }

            const pnrRegex = /^(\d{6}|\d{8})[-+]?\d{4}$/;
            if (!pnrRegex.test(form.personalNumber)) {
                setError('Personnummer måste vara i formatet ÅÅMMDD-XXXX eller ÅÅÅÅMMDD-XXXX');
                return false;
            }
        }

        // Validera DOCTOR
        if (form.role === 'DOCTOR') {
            if (!form.fullName.trim()) {
                setError('Fullständigt namn krävs för läkare');
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // Skicka registrering med all information
            const registrationData = {
                username: form.username,
                email: form.email,
                password: form.password,
                role: form.role,
                // Lägg till patientinformation om PATIENT
                ...(form.role === 'PATIENT' && {
                    fullName: form.fullName,
                    personalNumber: form.personalNumber,
                    phone: form.phone || null
                }),
                // Lägg till läkarinformation om DOCTOR
                ...(form.role === 'DOCTOR' && {
                    fullName: form.fullName
                })
            };


            await register(registrationData);
            setSuccess(true);

            // Navigera till login efter 2 sekunder
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.message || 'Kunde inte registrera. Kontrollera att användarnamnet inte redan finns.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">
                <h2>Skapa konto</h2>
                <p className="subtitle">Fyll i dina uppgifter för att registrera dig</p>

                <form onSubmit={handleSubmit} className="register-form">
                    {/* Användarinformation */}
                    <div className="form-section">
                        <h3>Kontoinformation</h3>

                        <div className="form-group">
                            <label htmlFor="username">Användarnamn *</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={form.username}
                                onChange={handleChange}
                                placeholder="Välj ett användarnamn"
                                required
                                minLength={3}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">E-post *</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="din@email.com"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Lösenord *</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="Minst 6 tecken"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Bekräfta lösenord *</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={form.confirmPassword}
                                onChange={handleChange}
                                placeholder="Upprepa lösenordet"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="role">Jag är en *</label>
                            <select
                                id="role"
                                name="role"
                                value={form.role}
                                onChange={handleChange}
                                required
                            >
                                <option value="PATIENT">Patient</option>
                                <option value="DOCTOR">Doktor</option>
                                <option value="STAFF">Personal</option>
                            </select>
                        </div>
                    </div>

                    {/* Patientinformation - visas bara om PATIENT är vald */}
                    {form.role === 'PATIENT' && (
                        <div className="form-section patient-section">
                            <h3>Patientinformation</h3>
                            <p className="section-info">
                                Som patient behöver vi ytterligare information för din journal
                            </p>

                            <div className="form-group">
                                <label htmlFor="fullName">Fullständigt namn *</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="För- och efternamn"
                                    required={form.role === 'PATIENT'}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="personalNumber">Personnummer *</label>
                                <input
                                    type="text"
                                    id="personalNumber"
                                    name="personalNumber"
                                    value={form.personalNumber}
                                    onChange={handleChange}
                                    placeholder="ÅÅMMDD-XXXX eller ÅÅÅÅMMDD-XXXX"
                                    required={form.role === 'PATIENT'}
                                />
                                <small>T.ex. 950215-1234 eller 19950215-1234</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Telefonnummer (valfritt)</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={form.phone}
                                    onChange={handleChange}
                                    placeholder="070-123 45 67"
                                />
                            </div>
                        </div>
                    )}

                    {form.role === 'DOCTOR' && (
                        <div className="form-section doctor-section">
                            <h3>Vårdgivarinformation</h3>
                            <p className="section-info">
                                Som läkare behöver vi ditt fullständiga namn
                            </p>

                            <div className="form-group">
                                <label htmlFor="fullName">Fullständigt namn *</label>
                                <input
                                    type="text"
                                    id="fullName"
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    placeholder="För- och efternamn"
                                    required={form.role === 'DOCTOR'}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error">
                            ⚠️ {error}
                        </div>
                    )}

                    {success && (
                        <div className="alert alert-success">
                            ✅ Kontot har skapats! Omdirigerar till login...
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary btn-large"
                        disabled={loading}
                    >
                        {loading ? 'Skapar konto...' : 'Skapa konto'}
                    </button>
                </form>

                <div className="form-footer">
                    <p>
                        Har du redan ett konto?
                        <button
                            onClick={() => navigate('/login')}
                            className="link-button"
                        >
                            Logga in här
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}
