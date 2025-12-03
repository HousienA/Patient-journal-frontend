import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi, searchApi, practitionerApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
//import './PatientList.css';

export default function PatientList() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search state
    const [pnr, setPnr] = useState('');
    const [name, setName] = useState('');
    const [condition, setCondition] = useState('');
    const [showMyPatients, setShowMyPatients] = useState(false);

    const loadAll = async () => {
        setError('');
        setLoading(true);
        try {
            let data;
            if (showMyPatients && user?.id && user?.role === 'DOCTOR') {
                data = await practitionerApi.getPatients(user.id);
            } else {
                // Call search without filters to get all patients
                data = await searchApi.searchPatients();
            }

            if (Array.isArray(data)) {
                setPatients(data);
            } else {
                setPatients([]);
            }
        } catch (err) {
            console.error('Error loading patients:', err);
            setError(err.message || 'Kunde inte ladda patienter');
        } finally {
            setLoading(false);
        }
    };

    const runSearch = async () => {
        setError('');
        setLoading(true);
        try {
            // Om man söker, så söker vi i hela systemet via Search API (Quarkus)
            // Eller vill vi söka BARA i mina patienter?
            // För enkelhetens skull: Sökning går alltid mot Search API just nu.
            // Men om "Mina patienter" är vald och inga sökord finns, ladda mina.

            if (showMyPatients && !name && !pnr && !condition && user?.id) {
                const data = await practitionerApi.getPatients(user.id);
                setPatients(data || []);
                setLoading(false);
                return;
            }

            const data = await searchApi.searchPatients({
                name: name.trim() || undefined,
                pnr: pnr.trim() || undefined,
                condition: condition.trim() || undefined,
            });

            if (Array.isArray(data)) {
                // Om vi vill filtrera sökresultatet på klienten för "Mina patienter":
                if (showMyPatients && user?.id) {
                    // Detta kräver att searchApi returnerar primaryPractitionerId, vilket vi inte vet säkert.
                    // Så vi kanske ska nöja oss med att "Sök" söker globalt, och "Mina patienter" listar mina.
                    // Men vi kan försöka filtrera om datat har infon.
                    const myPatients = data.filter(p => p.primaryPractitioner?.id === user.id);
                    setPatients(myPatients);
                } else {
                    setPatients(data);
                }
            } else {
                setPatients([]);
            }
        } catch (err) {
            console.error('Error searching patients:', err);
            setError(err.message || 'Kunde inte söka patienter');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadAll(); }, [showMyPatients, user?.id, user?.role]);

    if (loading) return <div className="loading">Laddar patienter...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="patient-list">
            <div className="list-header">
                <h2>Patienter ({patients.length})</h2>
                {user?.role === 'DOCTOR' && (
                    <div className="filter-toggle" style={{ display: 'flex', alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', margin: 0 }}>
                            <input
                                type="checkbox"
                                checked={showMyPatients}
                                onChange={(e) => setShowMyPatients(e.target.checked)}
                                style={{ margin: 0 }}
                            />
                            <span>Visa endast mina patienter</span>
                        </label>
                    </div>
                )}
            </div>

            {/* Search Bar */}
            <div className="search-bar">
                <div className="search-row">
                    <input
                        type="text"
                        placeholder="Personnummer (YYYYMMDD-XXXX)"
                        value={pnr}
                        onChange={(e) => setPnr(e.target.value)}
                        className="search-input"
                    />
                    <input
                        type="text"
                        placeholder="Namn (t.ex. Anna Andersson)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="search-input"
                    />
                    <input
                        type="text"
                        placeholder="Diagnos (t.ex. diabetes)"
                        value={condition}
                        onChange={(e) => setCondition(e.target.value)}
                        className="search-input"
                    />
                    <button onClick={runSearch} className="btn-primary">
                        Sök
                    </button>
                    <button
                        onClick={() => {
                            setPnr('');
                            setName('');
                            setCondition('');
                            // loadAll triggas av useEffect när vi rensar, om vi vill resetta allt
                            // Men här vill vi bara rensa fälten och ladda om listan baserat på checkbox
                            loadAll();
                        }}
                        className="btn-secondary"
                    >
                        Rensa
                    </button>
                </div>
            </div>

            {patients.length === 0 ? (
                <div className="empty-state">
                    <p>Inga patienter matchade din sökning</p>
                    <p>Kontakta admin om du vill lägga till en ny patient.</p>
                </div>
            ) : (
                <div className="patient-grid">
                    {patients.map((patient) => (
                        <div
                            key={patient.id}
                            className="patient-card"
                            style={{ marginBottom: '16px', cursor: 'pointer' }}
                            onClick={() => navigate(`${patient.id}`)}
                        >
                            <div className="patient-card-header">
                                <h3>{patient.fullName}</h3>
                                <span className="patient-id">#{patient.id}</span>
                            </div>
                            <div className="patient-card-body">
                                <p><strong>Personnummer:</strong> {patient.personalNumber}</p>
                                {patient.email && <p><strong>Email:</strong> {patient.email}</p>}
                                {patient.phone && <p><strong>Telefon:</strong> {patient.phone}</p>}
                                {patient.primaryPractitioner && (
                                    <p><strong>Läkare:</strong> {patient.primaryPractitioner.fullName}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
