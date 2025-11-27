import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { messageApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
//import './MessageThread.css';

export default function MessageThread() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [reply, setReply] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadThread();
    }, [id]);

    const loadThread = async () => {
        try {
            setLoading(true);
            // 1. Hämta huvudmeddelandet du klickade på
            const mainMessage = await messageApi.getById(id);

            // 2. Hämta ALLA meddelanden för denna patient
            const allMessages = await messageApi.getByPatientId(mainMessage.patientId);


            const threadMessages = allMessages.filter(m =>
                // Matcha om det är samma läkare inblandad (eller om practitionerId är null, visa ändå)
                (m.practitionerId === mainMessage.practitionerId) ||
                (m.practitionerId == null && mainMessage.practitionerId == null)
            );

            setMessages(threadMessages.sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt)));
        } catch (err) {
            console.error('Error loading thread:', err);
            setError('Kunde inte ladda konversation');
        } finally {
            setLoading(false);
        }
    };
    const handleSendReply = async (e) => {
        e.preventDefault();
        if (!reply.trim()) return;

        setSending(true);
        setError('');

        try {
            const mainMessage = messages[0]; // Använd första meddelandet som referens
            const targetPractitionerId = mainMessage.practitionerId;

            await messageApi.create({
                patientId: mainMessage.patientId,
                practitionerId: targetPractitionerId, // Behåll samma läkare i tråden
                content: reply,
                senderType: user.role === 'PATIENT' ? 'PATIENT' : 'PRACTITIONER', // VIKTIGT
                sentAt: new Date().toISOString(), // Lägg till + ':00' om din backend kräver sekunder
                isRead: false
            });

            setReply('');
            await loadThread();
        } catch (err) {
            console.error('Error sending reply:', err);
            setError('Kunde inte skicka svar');
        } finally {
            setSending(false);
        }
    };

    if (loading) return <div className="loading">Laddar konversation...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (messages.length === 0) return <div className="error-message">Meddelande hittades inte</div>;

    const mainMessage = messages[0];

    return (
        <div className="message-thread">
            <div className="thread-header">
                <button onClick={() => navigate('/messages')} className="btn-back">
                    ← Tillbaka till meddelanden
                </button>
                <h1>{mainMessage.subject}</h1>
                <p className="thread-meta">Konversation med Patient #{mainMessage.patientId}</p>
            </div>

            {/* Meddelandetråd */}
            <div className="thread-messages">
                {messages.map((msg, index) => {
                    const isMe = msg.senderName === user.username;
                    const isFirst = index === 0;

                    return (
                        <div
                            key={msg.id}
                            className={`thread-message ${isMe ? 'sent' : 'received'} ${isFirst ? 'first' : ''}`}
                        >
                            <div className="message-bubble">
                                <div className="message-header">
                  <span className="sender-name">
                    {isMe ? 'Du' : msg.senderName}
                  </span>
                                    <span className="message-time">
                    {new Date(msg.sentAt).toLocaleString('sv-SE', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                  </span>
                                </div>
                                <div className="message-text">{msg.content}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Svarsfält */}
            <div className="reply-section">
                <form onSubmit={handleSendReply} className="reply-form">
          <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Skriv ditt svar här..."
              rows="3"
              required
          />
                    <button
                        type="submit"
                        className="btn-primary btn-send"
                        disabled={sending || !reply.trim()}
                    >
                        {sending ? 'Skickar...' : '➤ Skicka svar'}
                    </button>
                </form>
            </div>
        </div>
    );
}
