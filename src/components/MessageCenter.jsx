import { useState, useEffect } from 'react';
import { messageApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
//import './MessageCenter.css';

export default function MessageCenter() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [newMessage, setNewMessage] = useState({
        patientId: '',
        subject: '',
        content: ''
    });
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            setLoading(true);
            const data = await messageApi.getAll();
            setMessages(Array.isArray(data) ? data : []);
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
            await messageApi.create({
                patientId: parseInt(newMessage.patientId),
                subject: newMessage.subject,
                content: newMessage.content,
                senderName: user.username,
                sentAt: new Date().toISOString(),
                isRead: false
            });

            // Reset form
            setNewMessage({ patientId: '', subject: '', content: '' });
            setShowNewMessage(false);

            // Reload messages
            loadMessages();
        } catch (err) {
            console.error('Error sending message:', err);
            setError(err.message || 'Kunde inte skicka meddelande');
        } finally {
            setSending(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await messageApi.markAsRead(id);
            loadMessages();
        } catch (err) {
            console.error('Error marking as read:', err);
        }
    };

    if (loading) {
        return <div className="loading">Laddar meddelanden...</div>;
    }

    return (
        <div className="message-center">
            <div className="message-header">
                <h1>Meddelanden</h1>
                {['DOCTOR', 'STAFF', 'ADMIN'].includes(user.role) && (
                    <button
                        onClick={() => setShowNewMessage(!showNewMessage)}
                        className="btn-primary"
                    >
                        {showNewMessage ? '✕ Stäng' : '+ Nytt meddelande'}
                    </button>
                )}
            </div>

            {error && <div className="error-message">{error}</div>}

            {/* Formulär för nytt meddelande */}
            {showNewMessage && (
                <div className="new-message-form">
                    <h2>Skicka meddelande till patient</h2>
                    <form onSubmit={handleSend}>
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

                        <div className="form-group">
                            <label>Ämne *</label>
                            <input
                                type="text"
                                value={newMessage.subject}
                                onChange={(e) => setNewMessage({...newMessage, subject: e.target.value})}
                                placeholder="T.ex. Provsvar, Uppföljning..."
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
                <h2>Alla meddelanden ({messages.length})</h2>

                {messages.length === 0 ? (
                    <p className="empty-text">Inga meddelanden</p>
                ) : (
                    <div className="messages">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`message-card ${!msg.isRead ? 'unread' : ''}`}
                                onClick={() => !msg.isRead && handleMarkAsRead(msg.id)}
                            >
                                <div className="message-header-card">
                                    <h3>{msg.subject}</h3>
                                    {!msg.isRead && <span className="unread-badge">Nytt</span>}
                                </div>
                                <p className="message-content">{msg.content}</p>
                                <div className="message-footer">
                                    <span className="sender">Från: {msg.senderName}</span>
                                    <span className="date">
                    {new Date(msg.sentAt).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                  </span>
                                    <span className="patient-id">Patient #{msg.patientId}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
