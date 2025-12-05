import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { messageApi, patientApi, practitionerApi, profileApi } from '../services/api'; // Added profileApi
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
    const [myPractitionerId, setMyPractitionerId] = useState(null);
    const [practitioners, setPractitioners] = useState([]);

    // New: Store a map of PatientID -> PatientName for the Doctor view
    const [patientNames, setPatientNames] = useState({});

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

            const practitionerList = await practitionerApi.getAll();
            setPractitioners(Array.isArray(practitionerList) ? practitionerList : []);

            if (user.role === 'PATIENT') {
                // --- FIX FOR 500 ERROR ---
                // Instead of fetching ALL patients (which crashes/is forbidden),
                // we fetch only OUR OWN profile.
                const profileResponse = await profileApi.exists();

                if (profileResponse && profileResponse.exists && profileResponse.profileType === 'PATIENT') {
                    const myId = profileResponse.profile.id;
                    setMyPatientId(myId);

                    // Get messages for me
                    const myMessages = await messageApi.getByPatientId(myId);
                    setMessages(Array.isArray(myMessages) ? myMessages : []);
                } else {
                    setMessages([]);
                    setError("Kunde inte hitta din patientprofil.");
                }

            } else if (user.role === 'DOCTOR') {
                // 1. Identify the Doctor
                const myPractitioner = Array.isArray(practitionerList)
                    ? practitionerList.find((p) => p.authId === user.id || p.userId === user.id)
                    : null;

                if (myPractitioner) {
                    setMyPractitionerId(myPractitioner.id);
                    const myMessages = await messageApi.getByPractitionerId(myPractitioner.id);
                    setMessages(Array.isArray(myMessages) ? myMessages : []);

                    // 2. Fetch Patients to show Names instead of IDs
                    try {
                        const allPatients = await patientApi.getAll();
                        if (Array.isArray(allPatients)) {
                            const nameMap = {};
                            allPatients.forEach(p => {
                                nameMap[p.id] = p.fullName;
                            });
                            setPatientNames(nameMap);
                        }
                    } catch (e) {
                        console.warn("Could not load patient names for mapping", e);
                    }

                } else {
                    setMessages([]);
                }
            } else {
                // STAFF
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
            const patientIdToUse =
                user.role === 'PATIENT' ? myPatientId : parseInt(newMessage.patientId, 10);

            if (!patientIdToUse || Number.isNaN(patientIdToUse)) {
                setError('Patient-ID måste anges');
                setSending(false);
                return;
            }

            if (!newMessage.subject.trim()) {
                setError('Ämne får inte vara tomt');
                setSending(false);
                return;
            }
            if (!newMessage.content.trim()) {
                setError('Meddelande får inte vara tomt');
                setSending(false);
                return;
            }

            let practitionerIdToUse = null;
            let subjectToSend = newMessage.subject.trim();

            if (user.role === 'PATIENT') {
                if (!newMessage.receiverPractitionerId) {
                    setError('Du måste välja vilken läkare du vill skicka till');
                    setSending(false);
                    return;
                }
                practitionerIdToUse = parseInt(newMessage.receiverPractitionerId, 10);
                const receiver = practitioners.find((p) => p.id === practitionerIdToUse);
                const receiverName = receiver?.fullName || 'okänd läkare';
                subjectToSend = `Till ${receiverName}: ${subjectToSend}`;
            } else {
                practitionerIdToUse = myPractitionerId;
            }

            const finalContent = `Ämne: ${subjectToSend}\n\n${newMessage.content.trim()}`;

            await messageApi.create({
                patientId: patientIdToUse,
                practitionerId: practitionerIdToUse,
                content: finalContent,
                senderType: user.role === 'PATIENT' ? 'PATIENT' : 'PRACTITIONER',
                sentAt: new Date().toISOString(),
                isRead: false,
            });

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

            {error && <div className="error-message">{error}</div>}

            {showNewMessage && (
                <div className="new-message-form">
                    <h2>
                        {user.role === 'PATIENT'
                            ? 'Skicka meddelande till vårdpersonalen'
                            : 'Skicka meddelande till patient'}
                    </h2>

                    <form onSubmit={handleSend}>
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
                                placeholder="T.ex. Fråga om recept..."
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
                                                // FIX: Show Patient Name if available, otherwise ID
                                                <span className="patient-badge">
                                                    {patientNames[msg.patientId]
                                                        ? `${patientNames[msg.patientId]} (#${msg.patientId})`
                                                        : `Patient #${msg.patientId}`}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="message-content">{msg.content}</p>
                                    <div className="message-footer">
                                      <span className="sender">
                                        {/* Logic to handle undefined senderName */}
                                          {msg.senderType === 'PATIENT' && user.role === 'PATIENT'
                                              ? '🔵 Du'
                                              : msg.senderType === 'PRACTITIONER' && user.role === 'DOCTOR'
                                                  ? '🔵 Du'
                                                  : `Från: ${msg.senderName || (msg.senderType === 'PATIENT' ? 'Patienten' : 'Läkaren')}`
                                          }
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