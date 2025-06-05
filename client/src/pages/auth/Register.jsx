import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { axiosInstance } from '../../api/apiConfig';
import './Register.css';
import useAuth from '../../hooks/useAuth';

export default function Register() {
    const { setAccessToken, setCSRFToken, setIsLoggedIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [showCodeInput, setShowCodeInput] = useState(false);

    const first_name = useRef();
    const [email, setEmail] = useState(location?.state?.email || '');
    const password = useRef();
    const fromLocation = location?.state?.from?.pathname || `/user_wall/${email}`;

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
    }, [location.state]);

    function onEmailChange(event) {
        setEmail(event.target.value);
    }

    async function onSubmitForm(event) {
        event.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        const data = {
            first_name: first_name.current.value,
            email: email,
            password: password.current.value,
        };

        try {
            const response = await axiosInstance.post('auth/register/', JSON.stringify(data));
            setLoading(false);
            setMessage(response.data.message || response.data); 
            setShowCodeInput(true);
        } catch (error) {
            setLoading(false);
            if (error.response?.status === 400) {
                setError(error.response.data);
                navigate('/auth/login', { state: { email } });
            } else {
                setError('Registration failed.');
            }
        }
    }

    async function onVerifyCode(event) {
        event.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const response = await axiosInstance.post('auth/confirm-email/', JSON.stringify({
                email,
                confirmation_code: confirmationCode,
            }));

            setMessage('Email confirmed! Logging in...');

            const responseLogin = await axiosInstance.post(
                'auth/login/',
                JSON.stringify({
                    email,
                    password: password.current.value,
                })
            );

            setAccessToken(responseLogin?.data?.access_token);
            setCSRFToken(responseLogin.headers['x-csrftoken']);
            setIsLoggedIn(true);
            navigate(fromLocation, { replace: true });
        } catch (error) {
            setLoading(false);
            if (error.response?.data?.detail) {
                setError(error.response.data.detail);
            } else {
                setError('Invalid confirmation code.');
            }
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        if (showCodeInput) {
            onVerifyCode(e);
        } else {
            onSubmitForm(e);
        }
    };

    return (
        <div className="register-container">
            <h1 className="register-title">Share Positive Energy</h1>
            <form onSubmit={handleSubmit} className="register">
                <div><input type="text" placeholder="First Name" autoComplete="off" ref={first_name} required className="register-input" /></div>
                <div><input type="email" placeholder="Email" autoComplete="off" value={email} onChange={onEmailChange} required className="register-input" /></div>
                <div><input type="password" placeholder="Password" autoComplete="off" ref={password} required className="register-input" /></div>
                {showCodeInput && (
                    <input
                        type="text"
                        placeholder="Confirmation Code"
                        value={confirmationCode}
                        onChange={(e) => setConfirmationCode(e.target.value)}
                        maxLength="6"
                        className="register-input"
                        required
                    />
                )}
                <button type="submit" className="register-button" disabled={loading}>
                    {loading ? "Processing..." : showCodeInput ? "Register" : "Send Code"}
                </button>
            </form>
            {!error && message && (<p className="register-message">{message}</p>)}
            {error && <p className="register-error">{error}</p>}
        </div>
    );
}
