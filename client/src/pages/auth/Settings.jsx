import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import useLogout from '../../hooks/useLogout';
import { axiosInstance } from '../../api/apiConfig';
// import './Settings.css';
import './User.css';

export default function LeftSection({ setMyEmails, myEmails }) {
    const {
        user,
        setUser,
        setOtherUser,
        setAccessToken,
        setRefreshToken,
        setCSRFToken,
        setIsLoggedIn,
    } = useAuth();

    const navigate = useNavigate();
    const logout = useLogout();
    const [loading, setLoading] = useState(false);
    const passwordOld = useRef();
    const passwordNew = useRef();
    const email = useRef();
    const confirmationCode = useRef();
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { accessToken, csrftoken } = useAuth();
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isEmailAdded, setIsEmailAdded] = useState(false);

    async function onLogout() {
        setLoading(true);
        setUser();
        setOtherUser();
        setAccessToken();
        setRefreshToken();
        setCSRFToken();
        setIsLoggedIn(false);

        await logout();
        navigate('/');
    }

    useEffect(() => {
        if (message === 'Success') {
            const timer = setTimeout(() => {
                setMessage('');
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleSubmitPasswordChange = async (event) => {
        event.preventDefault();
        setError('');

        try {
            await axiosInstance.post(
                '/auth/change-password/',
                {
                    old_password: passwordOld.current.value,
                    new_password1: passwordNew.current.value,
                    new_password2: passwordNew.current.value,
                },
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'X-CSRFToken': csrftoken,
                    },
                }
            );
            setMessage('Success');
            passwordNew.current.value = '';
            passwordOld.current.value = '';
        } catch (err) {
            setError('Error sending post');
        } finally {
            setLoading(false);
        }
    };

    async function handleSubmitConfirmEmail(event) {
        event.preventDefault();
        const data = {
            user_email: user.email,
            email: email.current.value,
            confirmation_code: confirmationCode.current.value,
        };
        try {
            await axiosInstance.post(
                'auth/confirm-new-email/',
                JSON.stringify(data)
            );
            email.current.value = '';
            confirmationCode.current.value = '';
            setIsCodeSent(false);
            setIsEmailAdded(true);
        } catch (error) {
            console.log(error.response?.data.detail || 'Confirm email error');
        }
    }

    async function handleSubmitEmailAdd(event) {
        event.preventDefault();
        try {
            await axiosInstance.post(
                'auth/add-email/',
                JSON.stringify(email.current.value),
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                        'X-CSRFToken': csrftoken,
                    },
                }
            );
            setIsCodeSent(true);
        } catch (error) {
            console.log('Email was not added');
        }
    }

    const fetchData = async () => {
        try {
            const response = await axiosInstance.get('auth/get-my-emails/', {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });
            setMyEmails(
                Object.values(response.data).map(
                    (item) => item.email_additional
                )
            );
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        fetchData();
    }, [setMyEmails]);

    useEffect(() => {
        if (isEmailAdded) {
            fetchData();
            setIsEmailAdded(false);
        }
    }, [isEmailAdded]);

    async function handleSubmitDeleteEmail(email) {
        if (email === user.email) {
            await axiosInstance.delete(`auth/delete-email/${email}/`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-CSRFToken': csrftoken,
                },
            });
            localStorage.removeItem('authToken');
            sessionStorage.clear();
            navigate('/');
        }
        try {
            await axiosInstance.delete(`auth/delete-email/${email}/`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'X-CSRFToken': csrftoken,
                },
            });
            setMyEmails((prevEmails) => prevEmails.filter((e) => e !== email));
        } catch (error) {
            console.log(error.response?.data.detail || 'Delete email error');
        }
    }

    return (
        <div className="left-section">
            <div className="settings-input-group">
                <label className="settings-input-title">Old Password</label>
                <input
                    type="password"
                    placeholder="Password"
                    ref={passwordOld}
                    required
                    className="settings-input-field"
                />
                <div className="buttons-container">
                    <button
                        className="settings-button"
                        onClick={handleSubmitPasswordChange}
                    >
                        Change Password
                    </button>
                </div>
            </div>

            <div className="settings-input-group">
                <label className="settings-input-title">New Password</label>
                <input
                    type="password"
                    placeholder="Password"
                    ref={passwordNew}
                    required
                    className="settings-input-field"
                />
                <p>{message}</p>
            </div>

            <div className="settings-input-group">
                <label className="settings-input-title">Add Email</label>
                <input
                    type="email"
                    placeholder="Add email"
                    ref={email}
                    required
                    className="settings-input-field"
                />
                <div className="buttons-container">
                    <button
                        className="settings-button"
                        onClick={handleSubmitEmailAdd}
                        disabled={isCodeSent}
                    >
                        {isCodeSent ? 'Code Sent' : 'Get Code'}
                    </button>
                </div>
            </div>

            <div className="settings-input-group">
                <label className="settings-input-title">
                    Confirmation Code
                </label>
                <input
                    type="text"
                    placeholder="Confirmation code"
                    ref={confirmationCode}
                    required
                    className="settings-input-field"
                />
                <div className="buttons-container">
                    <button
                        className="settings-button"
                        onClick={handleSubmitConfirmEmail}
                    >
                        Add New Email
                    </button>
                </div>
            </div>

            <label className="settings-input-title">My Emails</label>
            <div className="settings-email-list">
                {myEmails &&
                    myEmails.map((email) => (
                        <div key={email} className="settings-email-item">
                            <span>{email}</span>
                            <div className="buttons-container">
                                <button
                                    className="settings-button"
                                    onClick={() =>
                                        handleSubmitDeleteEmail(email)
                                    }
                                >
                                    {email === user.email
                                        ? 'Delete account'
                                        : 'Delete'}
                                </button>
                            </div>
                        </div>
                    ))}
            </div>

            <div className="buttons-container">
                <button className="settings-logout-button" onClick={onLogout}>
                    Logout
                </button>
            </div>
        </div>
    );
}
