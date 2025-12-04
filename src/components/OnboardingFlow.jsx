import { useState, useEffect } from 'react';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';
import { onboardingApi } from '../services/api';
import './OnboardingFlow.css';

export default function OnboardingFlow() {
    const auth = useAuth();
    const navigate = useNavigate();
    const [userRole, setUserRole] = useState(null);

    // Patient form
    const [patientForm, setPatientForm] = useState({
        fullName: '',
        personalNumber: '',
        email: '',
        phone: ''
    });

    // Practitioner form
    const [practitionerForm, setPractitionerForm] = useState({
        fullName: '',
        email: '',
        phone: ''
    });

    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (auth.isAuthenticated) {
            // Determine role and pre-fill email
            const roles = auth.user.profile.realm_access?.roles || [];
            const email = auth.user.profile.email || '';

            if (roles.includes('PATIENT')) {
                setUserRole('PATIENT');
                setPatientForm(prev => ({ ...prev, email }));
            } else if (roles.includes('DOCTOR')) {
                setUserRole('DOCTOR');
                setPractitionerForm(prev => ({ ...prev, email }));
            } else if (roles.includes('STAFF')) {
                // Staff don't need profiles
                navigate('/');
            }
        }
    }, [auth.isAuthenticated, navigate]);

    const validatePersonalNumber = (pnr) => {
        const regex = /^\d{6,8}-?\d{4}$/;
        return regex.test(pnr);
    };

    const submitPatientOnboarding = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        if (!validatePersonalNumber(patientForm.personalNumber)) {
            setError('Personnummer måste vara i formatet YYYYMMDD-XXXX eller YYMMDD-XXXX');
            setSubmitting(false);
            return;
        }

        try {
            await onboardingApi.completePatient(patientForm);

            // Success - redirect to dashboard
            navigate('/', { replace: true });
        } catch (err) {
            console.error('Error creating patient profile:', err);
            setError(err.message || 'Kunde inte skapa profil. Försök igen.');
        } finally {
            setSubmitting(false);
        }
    };

    const submitPractitionerOnboarding = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            await onboardingApi.completePractitioner(practitionerForm);

            // Success - redirect to dashboard
            navigate('/', { replace: true });
        } catch (err) {
            console.error('Error creating practitioner profile:', err);
            setError(err.message || 'Kunde inte skapa profil. Försök igen.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!userRole) {
        return (
            <div className="onboarding-loading">
                <div className="spinner"></div>
                <p>Förbereder onboarding...</p>
            </div>
        );
    }

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                <div className="onboarding-header">
                    <h1>Välkommen till Patientjournalen!</h1>
                    <p className="subtitle">Slutför din profil för att komma igång</p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        <strong>Fel:</strong> {error}
                    </div>
                )}

                {userRole === 'PATIENT' && (
                    <form onSubmit={submitPatientOnboarding} className="onboarding-form">
                        <h2>Patientinformation</h2>
                        <p className="form-intro">
                            Vi behöver lite mer information för att skapa din patientjournal.
                        </p>

                        <div className="form-group">
                            <label htmlFor="fullName">
                                Fullständigt namn <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={patientForm.fullName}
                                onChange={e => setPatientForm({ ...patientForm, fullName: e.target.value })}
                                placeholder="För- och efternamn"
                                required
                                maxLength={200}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="personalNumber">
                                Personnummer <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="personalNumber"
                                value={patientForm.personalNumber}
                                onChange={e => setPatientForm({ ...patientForm, personalNumber: e.target.value })}
                                placeholder="YYYYMMDD-XXXX"
                                required
                            />
                            <small>T.ex. 19900101-1234 eller 900101-1234</small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                E-post <span className="optional">(valfritt)</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={patientForm.email}
                                onChange={e => setPatientForm({ ...patientForm, email: e.target.value })}
                                placeholder="din@email.com"
                                maxLength={255}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">
                                Telefonnummer <span className="optional">(valfritt)</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={patientForm.phone}
                                onChange={e => setPatientForm({ ...patientForm, phone: e.target.value })}
                                placeholder="070-123 45 67"
                                maxLength={50}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary btn-large" disabled={submitting}>
                                {submitting ? 'Skapar profil...' : 'Slutför registrering'}
                            </button>
                        </div>
                    </form>
                )}

                {userRole === 'DOCTOR' && (
                    <form onSubmit={submitPractitionerOnboarding} className="onboarding-form">
                        <h2>Läkarinformation</h2>
                        <p className="form-intro">
                            Välkommen som läkare! Fyll i dina uppgifter för att komma igång.
                        </p>

                        <div className="form-group">
                            <label htmlFor="fullName">
                                Fullständigt namn <span className="required">*</span>
                            </label>
                            <input
                                type="text"
                                id="fullName"
                                value={practitionerForm.fullName}
                                onChange={e => setPractitionerForm({ ...practitionerForm, fullName: e.target.value })}
                                placeholder="Dr. För- och efternamn"
                                required
                                maxLength={200}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">
                                E-post <span className="optional">(valfritt)</span>
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={practitionerForm.email}
                                onChange={e => setPractitionerForm({ ...practitionerForm, email: e.target.value })}
                                placeholder="din@sjukhus.se"
                                maxLength={255}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phone">
                                Telefonnummer <span className="optional">(valfritt)</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                value={practitionerForm.phone}
                                onChange={e => setPractitionerForm({ ...practitionerForm, phone: e.target.value })}
                                placeholder="070-123 45 67"
                                maxLength={50}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="btn-primary btn-large" disabled={submitting}>
                                {submitting ? 'Skapar profil...' : 'Slutför registrering'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
