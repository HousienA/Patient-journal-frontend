import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
    // ✅ Alla hooks först
    const navigate = useNavigate();
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            // Efter lyckad login, navigera till dashboard
            navigate('/');
        } catch (err) {
            setError(err.message || 'Inloggning misslyckades');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <h2>Logga in</h2>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Användarnamn</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            placeholder="Ange användarnamn"
                        />
                    </div>

                    <div className="form-group">
                        <label>Lösenord</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Ange lösenord"
                        />
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Loggar in...' : 'Logga in'}
                    </button>
                </form>

                <p className="register-link">
                    Har du inget konto?
                    <button onClick={() => navigate('/register')}>
                        Registrera dig här
                    </button>
                </p>
            </div>
        </div>
    );
}
