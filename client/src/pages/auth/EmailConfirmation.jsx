import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosInstance } from '../../api/apiConfig';
import useAuth from '../../hooks/useAuth';

export default function AuthComponent() {
    const { setAccessToken, setCSRFToken, setIsLoggedIn } = useAuth();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [firstName, setFirstName] = useState('');
    const [confirmationCode, setConfirmationCode] = useState('');
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleEmailChange = (event) => setEmail(event.target.value);
    const handlePasswordChange = (event) => setPassword(event.target.value);
    const handleFirstNameChange = (event) => setFirstName(event.target.value);
    const handleConfirmationCodeChange = (event) => setConfirmationCode(event.target.value);

    const checkIfUserExists = async () => {
        try {
            const response = await axiosInstance.get(`auth/check-email?email=${email}`);
            return response.data.exists;
        } catch {
            return false;
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            if (isVerifying) {
                const data = {
                    email,
                    confirmation_code: confirmationCode,
                };
                const response = await axiosInstance.post('auth/confirm-email/', JSON.stringify(data));
                setMessage(response.data);
                navigate('/auth/login');
            } else if (isSigningUp) {
                const userExists = await checkIfUserExists();

                if (userExists) {
                    setMessage("User already exists, please enter the confirmation code.");
                    setIsVerifying(true);
                } else {
                    await axiosInstance.post('auth/register/', JSON.stringify({ first_name: firstName, email, password }));
                    setMessage('Registration successful! Please check your email for confirmation.');
                    setIsVerifying(true);
                }
            } else {
                const response = await axiosInstance.post('auth/login/', JSON.stringify({ email, password }));
                setAccessToken(response.data.access_token);
                setCSRFToken(response.headers['x-csrftoken']);
                setIsLoggedIn(true);
                navigate('/');
            }
        } catch (error) {
            setError(error.response?.data.detail || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h2>{isSigningUp ? 'Sign Up' : 'Sign In'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={handleEmailChange}
                        className="form-control"
                        required
                    />
                </div>
                {isSigningUp && (
                    <>
                        <div className="mb-3">
                            <input
                                type="text"
                                placeholder="First Name"
                                value={firstName}
                                onChange={handleFirstNameChange}
                                className="form-control"
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={handlePasswordChange}
                                className="form-control"
                                required
                            />
                        </div>
                    </>
                )}
                {!isSigningUp && (
                    <div className="mb-3">
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={handlePasswordChange}
                            className="form-control"
                            required
                        />
                    </div>
                )}
                {isSigningUp && isVerifying && (
                    <div className="mb-3">
                        <input
                            type="text"
                            placeholder="Confirmation Code"
                            value={confirmationCode}
                            onChange={handleConfirmationCodeChange}
                            className="form-control"
                            maxLength="6"
                            required
                        />
                    </div>
                )}
                <div className="mb-3">
                    <button disabled={loading} className="btn btn-success" type="submit">
                        {loading ? (isVerifying ? 'Confirming...' : 'Processing...') : (isVerifying ? 'Confirm Code' : isSigningUp ? 'Sign Up' : 'Sign In')}
                    </button>
                </div>
                {/* {message && <p className="text-success">{message}</p>} */}
                {/* {error && <p className="text-danger">{error}</p>} */}
            </form>
            <div className="mt-3">
                <button className="btn btn-link" onClick={() => setIsSigningUp(!isSigningUp)}>
                    {isSigningUp ? 'Already have an account? Sign In' : 'Don’t have an account? Sign Up'}
                </button>
            </div>
        </div>
    );
}
