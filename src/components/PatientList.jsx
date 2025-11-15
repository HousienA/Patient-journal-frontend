import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientApi } from '../services/api';
//import './PatientList.css';

export default function PatientList() {
    const navigate = useNavigate();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Search state
    const [pnr, setPnr] = useState('');
    const [name, setName] = useState('');

    const loadAll = async () => {
        setError('');
        setLoading(true);
        try {
            const data = await patientApi.getAll();
            if (Array.isArray(data)) {
                setPatients(data);
            } else if (data && Array.isArray(data.data)) {
                setPatients(data.data);
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
            const data = await patientApi.searchByFields({
                pnr: pnr.trim() || undefined,
                name: name.trim() || undefined
            });
            if (Array.isArray(data)) {
                setPatients(data);
            } else if (data && Array.isArray(data.data)) {
                setPatients(data.data);
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

    useEffect(() => { loadAll(); }, []);

    if (loading) return <div className="loading">Laddar patienter...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="patient-list">
            <div className="list-header">
                <h2>Patienter ({patients.length})</h2>
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
                    <button onClick={runSearch} className="btn-primary">Sök</button>
                    <button
                        onClick={() => {
                            setPnr('');
                            setName('');
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
                            style={{marginBottom: '16px', cursor: 'pointer'}}
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
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
