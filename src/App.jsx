import { useEffect, useState } from 'react';

function App() {
    const [msg, setMsg] = useState('...');

    useEffect(() => {
        fetch('/api/hello')
            .then(r => r.text())
            .then(setMsg)
            .catch(() => setMsg('Kunde inte hämta'));
    }, []);

    return (
        <main style={{ fontFamily: 'system-ui', padding: 24 }}>
            <h1>Patient Journal – Hello World</h1>
            <p>Backend säger: <strong>{msg}</strong></p>
        </main>
    );
}

export default App;