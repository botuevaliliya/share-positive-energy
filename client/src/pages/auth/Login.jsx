import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { axiosInstance } from '../../api/apiConfig';
import useAuth from '../../hooks/useAuth';
import './Login.css';

export default function Login() {
    const { setAccessToken, setCSRFToken, setIsLoggedIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState(location?.state?.email || '');
    const [password, setPassword] = useState();
    const [message, setMessage] = useState('');
    let fromLocation = location?.state?.from?.pathname || `/user_wall/${email}`;

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
    }, [location.state]);

    function onEmailChange(event) {
        setEmail(event.target.value);
    }

    function onPasswordChange(event) {
        setPassword(event.target.value);
    }

    async function onSubmitForm(event) {
        event.preventDefault();

        setLoading(true);

        try {
            const response = await axiosInstance.post(
                'auth/login/',
                JSON.stringify({
                    email,
                    password,
                })
            );

            setAccessToken(response?.data?.access_token);
            setCSRFToken(response.headers['x-csrftoken']);
            setIsLoggedIn(true);
            setEmail();
            setPassword();
            setLoading(false);
            navigate(fromLocation, { replace: true });
            window.location.reload();
        } catch (error) {
            setLoading(false);
            if (error.response) {
                if (error.response.status === 404) {
                    navigate('/auth/register', { state: { email } });
                } else if (error.response.status === 401) {
                    setMessage('Invalid credentials. Please try again.');
                } else {
                    setMessage('An error occurred. Please try again.');
                }
            } else {
                setMessage('Network error. Please check your connection.');
            }
        }
    }

    return (
        <div className="login-page">
            <h1 className="login-title">Share Positive Energy</h1>
            <form className="login-form" onSubmit={onSubmitForm}>
                <div>
                    <input
                        type="email"
                        placeholder="Email"
                        autoComplete="off"
                        className="login-input"
                        id="email"
                        value={email}
                        onChange={onEmailChange}
                        required
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="Password"
                        autoComplete="off"
                        className="login-input"
                        id="password"
                        onChange={onPasswordChange}
                        required
                    />
                </div>
                <div className="buttonContainer">
                    <button
                        disabled={loading}
                        className="login-button"
                        type="submit"
                    >
                        Login
                    </button>
                </div>
                <div className="ErrorMessage">{message}</div>
            </form>
            <div className="buttonContainer">
                    <button className="forgot-button" onClick={() => navigate('../forgot-password', { state: { email }})}>
                        Forgot Password?
                    </button>
                </div>
        </div>
    );
}

