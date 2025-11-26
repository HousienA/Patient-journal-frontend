import { useEffect, useState } from 'react';
// authApi är borttaget här
import { patientApi, practitionerApi } from '../services/api';

// Om du vill köra med Keycloak senare, avkommentera denna rad:
// import { useAuth } from "react-oidc-context";

export default function AdminPanel() {
    // Om du kör TEST-LÄGE (utan auth):
    const user = { username: "TestAdmin", role: "ADMIN" };

    // Om du kör KEYCLOAK (avkommentera detta och ta bort raden ovan):
    // const { user } = useAuth();

    const [tab, setTab] = useState('PATIENTS');
    const [patients, setPatients] = useState([]);
    const [practitioners, setPractitioners] = useState([]);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    // create forms
    const [newPatient, setNewPatient] = useState({ fullName: '', personalNumber: '', email: '', phone: '' });
    const [newDoctor, setNewDoctor] = useState({ username: '', email: '', password: '', fullName: '' });
    const [newStaff, setNewStaff] = useState({ username: '', email: '', password: '' });

    useEffect(() => { load(); }, [tab]);

    const load = async () => {
        setError('');
        try {
            if (tab === 'PATIENTS') {
                const data = await patientApi.getAll();
                setPatients(Array.isArray(data) ? data : []);
            } else {
                const data = await practitionerApi.getAll();
                setPractitioners(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Failed to load');
        }
    };

    const createPatient = async () => {
        setCreating(true); setError('');
        try {
            await patientApi.create({
                fullName: newPatient.fullName.trim(),
                personalNumber: newPatient.personalNumber.trim(),
                email: newPatient.email?.trim() || null,
                phone: newPatient.phone?.trim() || null,
                authId: null // Vi sätter ingen inloggning på patienten just nu
            });
            setNewPatient({ fullName: '', personalNumber: '', email: '', phone: '' });
            await load();
        } catch (err) {
            setError(err.message || 'Failed to create patient');
        }
        finally { setCreating(false); }
    };

    const deletePatient = async (id) => {
        if (!window.confirm('Delete patient?')) return;
        try { await patientApi.delete(id); await load(); } catch (err) { alert(err.message || 'Failed to delete'); }
    };

    const createDoctor = async () => {
        // Vi kan inte skapa användare via API längre, det görs i Keycloak
        alert("För att lägga till en läkare:\n1. Skapa användaren i Keycloak.\n2. Kopiera användarens ID.\n3. Skapa sedan Practitioners-profilen här (Funktion ej implementerad i frontend än).");
        setNewDoctor({ username: '', email: '', password: '', fullName: '' });
    };

    const createStaff = async () => {
        alert("Använd Keycloak Admin Console för att skapa personal-konton.");
        setNewStaff({ username: '', email: '', password: '' });
    };

    const deletePractitioner = async (id) => {
        if (!window.confirm('Delete doctor?')) return;
        try { await practitionerApi.delete(id); await load(); } catch (err) { alert(err.message || 'Failed to delete'); }
    };

    return (
        <div className="admin-panel">
            <h1>Manage Users</h1>
            {user && (
                <p>Logged in as: {user.username}</p>
            )}
            <div className="tabs">
                <button onClick={() => setTab('PATIENTS')} className={tab==='PATIENTS'?'active':''}>Patients</button>
                <button onClick={() => setTab('DOCTORS')} className={tab==='DOCTORS'?'active':''}>Doctors</button>
                <button onClick={() => setTab('STAFF')} className={tab==='STAFF'?'active':''}>Staff</button>
            </div>

            {tab === 'PATIENTS' && (
                <>
                    <h2>Create patient</h2>
                    <div className="grid">
                        <input placeholder="Full name" value={newPatient.fullName} onChange={e=>setNewPatient({...newPatient, fullName:e.target.value})}/>
                        <input placeholder="YYYYMMDD-XXXX" value={newPatient.personalNumber} onChange={e=>setNewPatient({...newPatient, personalNumber:e.target.value})}/>
                        <input placeholder="Email (optional)" value={newPatient.email} onChange={e=>setNewPatient({...newPatient, email:e.target.value})}/>
                        <input placeholder="Phone (optional)" value={newPatient.phone} onChange={e=>setNewPatient({...newPatient, phone:e.target.value})}/>
                        <button onClick={createPatient} disabled={creating}>Create</button>
                    </div>

                    {error && <div style={{color: 'red', marginBottom: '10px'}}>{error}</div>}

                    <h2>All patients ({patients.length})</h2>
                    <ul className="list">
                        {patients.map(p => (
                            <li key={p.id}>
                                #{p.id} {p.fullName} – {p.personalNumber}
                                <button onClick={() => deletePatient(p.id)} style={{marginLeft:8}}>Delete</button>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {tab === 'DOCTORS' && (
                <>
                    <h2>Create doctor</h2>
                    <p style={{fontStyle: 'italic', color: '#666'}}>Obs: Skapande av användare sker nu i Keycloak.</p>
                    <div className="grid">
                        <input placeholder="Username" value={newDoctor.username} onChange={e=>setNewDoctor({...newDoctor, username:e.target.value})}/>
                        <input placeholder="Email" value={newDoctor.email} onChange={e=>setNewDoctor({...newDoctor, email:e.target.value})}/>
                        <input placeholder="Password" type="password" value={newDoctor.password} onChange={e=>setNewDoctor({...newDoctor, password:e.target.value})}/>
                        <input placeholder="Full name" value={newDoctor.fullName} onChange={e=>setNewDoctor({...newDoctor, fullName:e.target.value})}/>
                        <button onClick={createDoctor} disabled={creating}>Create (Demo)</button>
                    </div>

                    <h2>All doctors ({practitioners.length})</h2>
                    <ul className="list">
                        {practitioners.map(pr => (
                            <li key={pr.id}>
                                #{pr.id} {pr.fullName} {pr.email ? `– ${pr.email}` : ''}
                                <button onClick={() => deletePractitioner(pr.id)} style={{marginLeft:8}}>Delete</button>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {tab === 'STAFF' && (
                <>
                    <h2>Create staff</h2>
                    <div className="grid">
                        <input placeholder="Username" value={newStaff.username} onChange={e=>setNewStaff({...newStaff, username:e.target.value})}/>
                        <input placeholder="Email" value={newStaff.email} onChange={e=>setNewStaff({...newStaff, email:e.target.value})}/>
                        <input placeholder="Password" type="password" value={newStaff.password} onChange={e=>setNewStaff({...newStaff, password:e.target.value})}/>
                        <button onClick={createStaff} disabled={creating}>Create</button>
                    </div>
                    <p>Note: listing/removing staff accounts requires a dedicated endpoint; for the lab, creation is usually enough.</p>
                </>
            )}
        </div>
    );
}
