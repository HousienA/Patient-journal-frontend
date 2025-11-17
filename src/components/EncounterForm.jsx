import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { encounterApi, organizationApi, locationApi } from '../services/api';


export default function EncounterForm() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const patientId = searchParams.get('patientId');

    const [form, setForm] = useState({
        patientId: patientId || '',
        encounterDate: new Date().toISOString().slice(0, 16),
        diagnosis: '',
        notes: '',
        practitionerId: '',
        locationId: '',
        organizationId: ''
    });

    const [organizations, setOrganizations] = useState([]);
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadOrganizationsAndLocations();
    }, []);

    const loadOrganizationsAndLocations = async () => {
        try {
            const [orgs, locs] = await Promise.all([
                organizationApi.getAll().catch(() => []),
                locationApi.getAll().catch(() => [])
            ]);
            console.log('Loaded organizations:', orgs);
            console.log('Loaded all locations:', locs);
            setOrganizations(Array.isArray(orgs) ? orgs : []);
            setLocations(Array.isArray(locs) ? locs : []);
        } catch (err) {
            console.error('Error loading orgs/locations:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleOrganizationChange = async (e) => {
        const orgId = e.target.value;
        setForm(prev => ({ ...prev, organizationId: orgId, locationId: '' }));

        if (orgId) {
            try {
                console.log('Filtering locations for org:', orgId);
                const filteredLocs = await locationApi.getAll(parseInt(orgId));
                console.log('Filtered locations:', filteredLocs);
                setLocations(Array.isArray(filteredLocs) ? filteredLocs : []);
            } catch (err) {
                console.error('Error loading locations:', err);
                setLocations([]);
            }
        } else {
            loadOrganizationsAndLocations();
        }
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
                practitionerId: form.practitionerId ? parseInt(form.practitionerId) : null,
                locationId: form.locationId ? parseInt(form.locationId) : null
            });

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
                <button onClick={() => navigate(-1)} className="btn-back">
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
                        disabled={!!patientId}
                    />
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
                        Orsak <span className="required">*</span>
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
                </div>

                {/* Organisation */}
                <div className="form-group">
                    <label htmlFor="organizationId">
                        Organisation <span className="optional">(valfritt)</span>
                    </label>
                    <select
                        id="organizationId"
                        name="organizationId"
                        value={form.organizationId}
                        onChange={handleOrganizationChange}
                    >
                        <option value="">-- Välj organisation --</option>
                        {organizations.map(org => (
                            <option key={org.id} value={org.id}>
                                {org.name}
                            </option>
                        ))}
                    </select>
                    <small>
                        {organizations.length === 0
                            ? 'Inga organisationer hittades (kör DataSeeder)'
                            : `${organizations.length} organisationer tillgängliga`}
                    </small>
                </div>

                {/* Location */}
                <div className="form-group">
                    <label htmlFor="locationId">
                        Plats <span className="optional">(valfritt)</span>
                    </label>
                    <select
                        id="locationId"
                        name="locationId"
                        value={form.locationId}
                        onChange={handleChange}
                    >
                        <option value="">-- Välj plats --</option>
                        {locations.map(loc => (
                            <option key={loc.id} value={loc.id}>
                                {loc.name}
                            </option>
                        ))}
                    </select>
                    <small>
                        {form.organizationId
                            ? `${locations.length} platser för vald organisation`
                            : locations.length > 0
                                ? `${locations.length} platser (välj organisation för att filtrera)`
                                : 'Inga platser hittades'}
                    </small>
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
                        placeholder="Detaljerade anteckningar om vårdmötet..."
                    />
                </div>


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
