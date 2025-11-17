import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageApi, patientApi, practitionerApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
// import './MessageCenter.css';

export default function MessageCenter() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const [showNewMessage, setShowNewMessage] = useState(false);
    const [newMessage, setNewMessage] = useState({
        patientId: '',
        subject: '',
        content: '',
        receiverPractitionerId: '',
    });

    const [myPatientId, setMyPatientId] = useState(null);
    const [practitioners, setPractitioners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError('');

            // find own patient id and load only own messages
            if (user.role === 'PATIENT') {
                const allPatients = await patientApi.getAll();
                const myPatient = Array.isArray(allPatients)
                    ? allPatients.find((p) => p.userId === user.id)
                    : null;

                if (myPatient) {
                    setMyPatientId(myPatient.id);
                    const myMessages = await messageApi.getByPatientId(myPatient.id);
                    setMessages(Array.isArray(myMessages) ? myMessages : []);
                } else {
                    setMessages([]);
                }

                // load practitioners for receiver dropdown
                const practitionerList = await practitionerApi.getAll();
                setPractitioners(Array.isArray(practitionerList) ? practitionerList : []);
            } else {
                // DOCTOR / STAFF see all messages
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
            // Use own patientId
            const patientIdToUse =
                user.role === 'PATIENT' ? myPatientId : parseInt(newMessage.patientId, 10);

            if (!patientIdToUse || Number.isNaN(patientIdToUse)) {
                setError('Patient-ID måste anges');
                return;
            }

            if (!newMessage.subject.trim()) {
                setError('Ämne får inte vara tomt');
                return;
            }
            if (!newMessage.content.trim()) {
                setError('Meddelande får inte vara tomt');
                return;
            }

            // For patients: receiver selection for doctor
            let subjectToSend = newMessage.subject.trim();
            if (user.role === 'PATIENT') {
                if (!newMessage.receiverPractitionerId) {
                    setError('Du måste välja vilken läkare du vill skicka till');
                    return;
                }
                const receiver = practitioners.find(
                    (p) => p.id === Number.parseInt(newMessage.receiverPractitionerId, 10)
                );
                const receiverName = receiver?.fullName || 'okänd läkare';
                subjectToSend = `Till ${receiverName}: ${subjectToSend}`;
            }

            // Payload exactly as backend MessageDTO expects
            await messageApi.create({
                patientId: patientIdToUse,
                subject: subjectToSend,
                content: newMessage.content.trim(),
                senderName: user.username,
                sentAt: new Date().toISOString(),
                isRead: false,
            });

            // Reset form and reload list
            setNewMessage({
                patientId: '',
                subject: '',
                content: '',
                receiverPractitionerId: '',
            });
            setShowNewMessage(false);
            await loadData();
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

    const unreadCount = messages.filter((m) => !m.isRead).length;

    return (
        <div className="message-center">
            <div className="message-header">
                <h1>
                    Meddelanden{' '}
                    {unreadCount > 0 && <span className="unread-count">{unreadCount} nya</span>}
                </h1>
                <button
                    onClick={() => setShowNewMessage(!showNewMessage)}
                    className="btn-primary"
                >
                    {showNewMessage ? 'Stäng' : 'Nytt meddelande'}
                </button>
            </div>



            {showNewMessage && (
                <div className="new-message-form">
                    <h2>
                        {user.role === 'PATIENT'
                            ? 'Skicka meddelande till vårdpersonalen'
                            : 'Skicka meddelande till patient'}
                    </h2>

                    <form onSubmit={handleSend}>
                        {/* receiver selection for patients */}
                        {user.role === 'PATIENT' && (
                            <div className="form-group">
                                <label htmlFor="receiver">
                                    Välj läkare/praktiker <span className="required">*</span>
                                </label>
                                <select
                                    id="receiver"
                                    value={newMessage.receiverPractitionerId}
                                    onChange={(e) =>
                                        setNewMessage({
                                            ...newMessage,
                                            receiverPractitionerId: e.target.value,
                                        })
                                    }
                                    required
                                >
                                    <option value="">-- Välj mottagare --</option>
                                    {practitioners.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.fullName} ({p.email || 'ingen e-post'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Only DOCTOR/STAFF/ADMIN need to type patientId */}
                        {user.role !== 'PATIENT' && (
                            <div className="form-group">
                                <label>Patient-ID</label>
                                <input
                                    type="number"
                                    value={newMessage.patientId}
                                    onChange={(e) =>
                                        setNewMessage({ ...newMessage, patientId: e.target.value })
                                    }
                                    placeholder="ID för patienten"
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Ämne</label>
                            <input
                                type="text"
                                value={newMessage.subject}
                                onChange={(e) =>
                                    setNewMessage({ ...newMessage, subject: e.target.value })
                                }
                                placeholder="T.ex. Fråga om recept, Provsvar..."
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Meddelande</label>
                            <textarea
                                value={newMessage.content}
                                onChange={(e) =>
                                    setNewMessage({ ...newMessage, content: e.target.value })
                                }
                                placeholder="Skriv ditt meddelande här..."
                                rows={6}
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
                                    style={{marginBottom: '16px', cursor: 'pointer'}}

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
                        ? '🔵 Du, '
                        : `Från: ${msg.senderName}, `}
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
