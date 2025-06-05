import React, { useState } from 'react';
import { axiosInstance } from '../../api/apiConfig'; // Adjust the import according to your project structure
import useAuth from '../../hooks/useAuth';
import './Feedback.css';

export default function Feedback({ setRefreshFlag }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { accessToken, csrftoken, otherUser } = useAuth();

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axiosInstance.post(
                '/auth/send_feedback/',
                {
                    content,
                    email_to: otherUser,
                }
                // {headers: { Authorization: `Bearer ${accessToken}`, 'X-CSRFToken': csrftoken }}
            );
            if (response.data.message === 'NEGATIVE') {
                setError('Your message was classified as negative.');
            } else {
                setContent('');
                // console.log('Post sent successfully!', response.data);
                setRefreshFlag((prev) => !prev);
            }
        } catch (err) {
            setError('Error sending post');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="feedback-container">
            <form onSubmit={handleSubmit} className="landing-form">
                <div className="input-container">
                    <textarea
                        className="feedback-input"
                        placeholder="Share positive energy!"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                    />
                    <button
                        className="feedback-button"
                        disabled={loading}
                        type="submit"
                    >
                        {loading ? 'Sending...' : 'Send'}
                    </button>
                    {error && <div className="error-message">{error}</div>}
                </div>
            </form>
        </div>
    );
}
