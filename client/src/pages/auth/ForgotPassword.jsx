import { useRef, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { axiosInstance } from '../../api/apiConfig';
import './ForgotPassword.css';
import useAuth from '../../hooks/useAuth';

export default function Register() {
    const { setAccessToken, setCSRFToken, setIsLoggedIn } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const password = useRef();
    const confirmationCode = useRef();
    const [isVerifying, setIsVerifying] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [email, setEmail] = useState(location?.state?.email || '');
    const fromLocation = location?.state?.from?.pathname || `/user_wall/${email}`;

    useEffect(() => {
        if (location.state?.email) {
            setEmail(location.state.email);
        }
    }, [location.state]);

    function onEmailChange(event) {
        setEmail(event.target.value);
    }

    async function checkIfUserExists(email) {
        try {
            const response = await axiosInstance.get(
                `auth/check-email?email=${email}`
            );

            return response.data.exists;
        } catch {
            return false;
        }
    }

    async function onSubmitForm(event) {
        event.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        if (isVerifying) {
            const data = {
                email,
                confirmation_code: confirmationCode.current.value,
            };

            try {
                const response = await axiosInstance.post(
                    'auth/reset-password/',
                    JSON.stringify(data)
                );
                setLoading(false);
                setMessage(response.data.message);

                const responseLogin = await axiosInstance.post(
                    'auth/login/',
                    JSON.stringify({
                        email,
                        password: password.current.value,
                    })
                );

                setAccessToken(responseLogin?.data?.access_token);
                setCSRFToken(responseLogin.headers['x-csrftoken']);
                setEmail();
                setLoading(false);
                navigate(fromLocation, { replace: true });
                window.location.reload();
                setIsLoggedIn(true);
                navigate(fromLocation, { replace: true });
            } catch (error) {
                setLoading(false);
                setError(
                    error.response?.data.detail ||
                        'An error occurred. Please try again.'
                );
            }
        } else {
            const userExists = await checkIfUserExists(email);

            if (userExists) {
                const data = {
                    email,
                    password: password.current.value,
                };

                try {
                    await axiosInstance.post(
                        'auth/forgot-password/',
                        JSON.stringify(data)
                    );
                    setLoading(false);
                    setIsVerifying(true);
                } catch (error) {
                    setLoading(false);
                    setError('Registration failed. Please check your details.');
                }
            } else {
                setLoading(false);
                setIsVerifying(true);
            }
        }
    }

    return (
        <div className="register-container">
            <h1 className="register-title">Share Positive Energy</h1>
            <form onSubmit={onSubmitForm} className="register">
                <div>
                    <input
                        type="email"
                        placeholder="Email"
                        autoComplete="off"
                        value={email}
                        onChange={onEmailChange}
                        required
                        className="register-input"
                    />
                </div>
                <div>
                    <input
                        type="password"
                        placeholder="New password"
                        autoComplete="off"
                        ref={password}
                        required
                        className="register-input"
                    />
                </div>
                {isVerifying && (
                    <div>
                        <input
                            type="text"
                            placeholder="Confirmation Code"
                            autoComplete="off"
                            ref={confirmationCode}
                            required
                            maxLength="6"
                            className="register-input"
                        />
                    </div>
                )}
                <div>
                    <button
                        disabled={loading}
                        type="submit"
                        className="register-button"
                    >
                        {loading
                            ? isVerifying
                                ? 'Confirming...'
                                : 'Updating password...'
                            : isVerifying
                              ? 'Update'
                              : 'Confirm Update'}
                    </button>
                </div>
                {!error && message && (
                    <p className="register-message">{message}</p>
                )}
                {error && <p className="register-error">{error}</p>}
            </form>
        </div>
    );
}
