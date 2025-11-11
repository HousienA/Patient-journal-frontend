import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {Link} from "react-router-dom";

export default function Register() {
    const [form, setForm] = useState({ username: '', email: '', password: '', role: 'PATIENT' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { register } = useAuth();

    const handleChange = e => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess(false);
        try {
            await register(form);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Kunde inte registrera.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <h2>Skapa konto</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    name="username"
                    placeholder="Användarnamn"
                    value={form.username}
                    onChange={handleChange}
                    required
                />
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Lösenord"
                    value={form.password}
                    onChange={handleChange}
                    required
                />
                <select name="role" value={form.role} onChange={handleChange}>
                    <option value="PATIENT">Patient</option>
                    <option value="DOCTOR">Doktor</option>
                    <option value="STAFF">Personal</option>
                </select>
                <button type="submit" disabled={loading}>
                    {loading ? 'Registrerar...' : 'Skapa konto'}
                </button>
                <p><Link to="/login">Login</Link></p>
            </form>
            {error && <p className="error">{error}</p>}
            {success && <p className="success">Kontot är skapat!</p>}
        </div>
    );
}
