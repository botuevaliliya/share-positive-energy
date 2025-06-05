import React, { useEffect, useState } from 'react';
import { axiosInstance } from '../../api/apiConfig';
import useAuth from '../../hooks/useAuth';
// import './SettingsPosts.css';
import './User.css';

export default function RightSection() {
    const {user} = useAuth();
    const { accessToken, csrftoken } = useAuth();
    const [myFeedbacks, setMyFeedbacks] = useState([]);
    const [refreshFlag, setRefreshFlag] = useState(false);


    useEffect(() => {
        const getMyFeedback = async () => {
            try {
                const response = await axiosInstance.get('auth/your_feedback/', {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                    params: {
                        otherUser: user.email
                    }
                });
                setMyFeedbacks(response.data);
            } catch (err) {
                setMyFeedbacks([]);
            }
        };
        getMyFeedback();
    }, [refreshFlag]);

    async function handleSubmitDeleteFeedback(feedbackId) {
        try {
            // const encodedContent = encodeURIComponent(content);
            await axiosInstance.delete(
                `auth/delete-feedback/${feedbackId}/`,
                {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-CSRFToken': csrftoken,
                }}
            );
            setRefreshFlag((prev) => !prev);
        } catch (error) {
            console.log(error.response?.data.detail || 'Delete feedback error');
        }
    }

    return (
        <div className="right-section">
            {myFeedbacks.map((item) => (
                <div key={item.id} className="feedback-item">
                    <p className="feedback-content">{item.content}</p>
                    <div className="buttons-container">
                        <button className="feedback-button" onClick={() => handleSubmitDeleteFeedback(item.id)}>
                            Delete
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

