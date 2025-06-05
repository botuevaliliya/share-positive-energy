import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';
import useAuth from '../../hooks/useAuth';
import SearchComponent from '../../components/Navbar/Search/SearchBar';
// import { axiosInstance } from '../../api/apiConfig';

const LandingPage = () => {
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    // const response = axiosInstance.get('auth/emails');
    const { setOtherUser } = useAuth();

    setOtherUser('');

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    };

    const handleSignInClick = () => {
        navigate('/auth/login', { state: { email } });
    };

    const handleSignUpClick = () => {
        navigate('/auth/register', { state: { email } });
    };

    return (
        <div className="landing-page">
            <h1 className="landing-title">Share Positive Energy</h1>
{/*             <div className='SPE-description'>Share Positive Energy fosters a <strong>culture of appreciation and support</strong>, ultimately helping individuals <strong>recognize their strengths and lift their spirits.</strong>
            <br/><br/>Use the <strong>search</strong> button in the <strong>upper right corner</strong> to find the user by their email address. <br/><span style={{ color: "red" }}>Even if the user isn’t listed, you can still leave a thoughtful comment for them!</span>
            <br/><a href='https://steady-pizza-d64.notion.site/Share-Positive-Energy-1ab2a37abdfc80969a43fa771c31f8d1' target="_blank">Learn more</a>
            </div> */}
            <SearchComponent/>
            <form className="landing-form">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={handleEmailChange}
                    className="landing-input"
                    required
                />
                <div className="buttonContainer">
                    <button type="button" onClick={handleSignInClick} className="landing-button">
                        Sign In
                    </button>
                    <button type="button" onClick={handleSignUpClick} className="landing-button">
                        Sign Up
                    </button>
                </div>
            </form>
        </div>
    );
};

export default LandingPage;

