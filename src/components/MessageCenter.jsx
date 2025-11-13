import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageApi, patientApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
//import './MessageCenter.css';

export default function MessageCenter() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [newMessage, setNewMessage] = useState({
        patientId: '',
        subject: '',
        content: ''
    });
    const [myPatientId, setMyPatientId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Om patient, hitta mitt patient-ID först
            if (user.role === 'PATIENT') {
                const allPatients = await patientApi.getAll();
                const myPatient = allPatients.find(p => p.userId === user.id);
                if (myPatient) {
                    setMyPatientId(myPatient.id);
                    // Ladda mina meddelanden
                    const myMessages = await messageApi.getByPatientId(myPatient.id);
                    setMessages(Array.isArray(myMessages) ? myMessages : []);
                }
            } else {
                // DOCTOR/STAFF ser alla meddelanden
                const data = await messageApi.getAll();
                setMessages(Array.isArray(data) ? data : []);
            }
        } catch (err) {
            console.error('Error loading messages:', err);
            setError('Kunde inte ladda meddelanden');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        setError('');
        setSending(true);

        try {
            // Om patient, använd mitt eget patient-ID
            const patientIdToUse = user.role === 'PATIENT'
                ? myPatientId
                : parseInt(newMessage.patientId);

            await messageApi.create({
                patientId: patientIdToUse,
                subject: newMessage.subject,
                content: newMessage.content,
                senderName: user.username,
                sentAt: new Date().toISOString(),
                isRead: false
            });

            setNewMessage({ patientId: '', subject: '', content: '' });
            setShowNewMessage(false);
            loadData();
        } catch (err) {
            console.error('Error sending message:', err);
            setError(err.message || 'Kunde inte skicka meddelande');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return <div className="loading">Laddar meddelanden...</div>;
    }

    const unreadCount = messages.filter(m => !m.isRead).length;

    return (
        <div className="message-center">
            <div className="message-header">
                <h1>
                    Meddelanden
                    {unreadCount > 0 && <span className="unread-count">{unreadCount} nya</span>}
                </h1>
                <button
                    onClick={() => setShowNewMessage(!showNewMessage)}
                    className="btn-primary"
                >
                    {showNewMessage ? '✕ Stäng' : '+ Nytt meddelande'}
                </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Formulär för nytt meddelande */}
            {showNewMessage && (
                <div className="new-message-form">
                    <h2>
                        {user.role === 'PATIENT'
                            ? 'Skicka meddelande till vårdpersonalen'
                            : 'Skicka meddelande till patient'}
                    </h2>
                    <form onSubmit={handleSend}>
                        {/* Bara DOCTOR/STAFF behöver ange patient-ID */}
                        {user.role !== 'PATIENT' && (
                            <div className="form-group">
                                <label>Patient-ID *</label>
                                <input
                                    type="number"
                                    value={newMessage.patientId}
                                    onChange={(e) => setNewMessage({...newMessage, patientId: e.target.value})}
                                    placeholder="ID för patienten"
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Ämne *</label>
                            <input
                                type="text"
                                value={newMessage.subject}
                                onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                                placeholder="T.ex. Fråga om recept, Provsvar..."
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Meddelande *</label>
                            <textarea
                                value={newMessage.content}
                                onChange={(e) => setNewMessage({...newMessage, content: e.target.value})}
                                placeholder="Skriv ditt meddelande här..."
                                rows="6"
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary" disabled={sending}>
                            {sending ? 'Skickar...' : 'Skicka meddelande'}
                        </button>
                    </form>
                </div>
            )}

            {/* Lista meddelanden */}
            <div className="message-list">
                <h2>
                    {user.role === 'PATIENT' ? 'Mina meddelanden' : 'Alla meddelanden'} ({messages.length})
                </h2>

                {messages.length === 0 ? (
                    <div className="empty-state">
                        <p className="empty-text">Inga meddelanden</p>
                        {user.role === 'PATIENT' && (
                            <p>När vårdpersonalen skickar meddelanden till dig kommer de att visas här.</p>
                        )}
                    </div>
                ) : (
                    <div className="messages">
                        {messages
                            .sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt))
                            .map(msg => (
                                <div
                                    key={msg.id}
                                    className={`message-card ${!msg.isRead ? 'unread' : ''}`}
                                    onClick={() => navigate(`/messages/${msg.id}`)}
                                >
                                    <div className="message-header-card">
                                        <h3>{msg.subject}</h3>
                                        <div className="message-badges">
                                            {!msg.isRead && <span className="unread-badge">Nytt</span>}
                                            {user.role !== 'PATIENT' && (
                                                <span className="patient-badge">Patient #{msg.patientId}</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="message-content">{msg.content}</p>
                                    <div className="message-footer">
                  <span className="sender">
                    {user.role === 'PATIENT' && msg.senderName === user.username
                        ? '🔵 Du'
                        : `Från: ${msg.senderName}`}
                  </span>
                                        <span className="date">
                    {new Date(msg.sentAt).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                  </span>
                                    </div>
                                    <div className="click-hint">
                                        💬 Klicka för att visa konversation och svara
                                    </div>
                                </div>
                            ))}
                    </div>
                )}
            </div>
        </div>
    );
}
