import { usePatient } from '../components/usePatient';

export default function PatientDetail({ patientId }) {
    const { patient, loading, error } = usePatient(patientId);

    if (loading) return <p>Laddar patient...</p>;
    if (error) return <p className="error">{error}</p>;
    if (!patient) return <p>Patient hittades inte</p>;

    return (
        <div className="patient-detail">
            <h2>{patient.fullName}</h2>
            <p><strong>Personnummer:</strong> {patient.personalNumber}</p>
            <p><strong>Email:</strong> {patient.email}</p>
            <p><strong>Telefon:</strong> {patient.phone}</p>
        </div>
    );
}
