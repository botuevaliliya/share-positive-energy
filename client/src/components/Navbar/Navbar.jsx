import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import SearchComponent from './Search/SearchBar';
import mylogo from './images/smile.jpeg';
import userlogo from './images/flower.jpeg';
import settings from './images/Edit.svg';
import s from './Navbar.module.css';
import chel from './images/mainlogo.png';

export default function Navbar() {
    const { isLoggedIn, setOtherUser, user, otherUser, setUser } = useAuth();
    const [isOtherUser, setIsOtherUser] = useState(false);
    const [isInSettings, setIsInSettings] = useState(false);
    const { email } = useParams();
    const navigate = useNavigate();

    const maskEmail = (email) => {
        const [user, domain] = email.split('@');
        if (!user || !domain) return email;
        const visibleLength = Math.ceil(user.length / 2);
        const visiblePart = user.slice(0, visibleLength);
        const maskedPart = '*'.repeat(user.length - visibleLength);
        return `${visiblePart}${maskedPart}@${domain}`;
    };

    useEffect(() => {
        setOtherUser(email);
    }, [email]);

    useEffect(() => {
        if (!otherUser || otherUser === user?.email) {
            setIsOtherUser(false);
        } else {
            setIsOtherUser(true);
        }
    }, [otherUser]);

    return (
        <nav className={s.header}>
            <div className={s.container}>
                <div className={s.leftContainer}>
                    {isLoggedIn ? (
                        <>
                            <button
                                className={s.logoContainer}
                                onClick={() => {
                                    setOtherUser(user?.email);
                                    navigate(`/user_wall/${user.email}`);
                                }}
                                style={{ background: 'none', border: 'none' }}
                            >
                                <img
                                    src={mylogo}
                                    className={s.logo}
                                    alt="User Logo"
                                />
                            </button>
                            {isOtherUser ? (
                                <>
                                    <img
                                        src={userlogo}
                                        className={s.logo}
                                        alt="Other User"
                                    />
                                    <p className={s.profilename}>{maskEmail(otherUser)}</p>
                                </>
                            ) : (
                                <p className={s.profilename}>{user?.email}</p>
                            )}
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => navigate('/')}
                                style={{
                                    textDecoration: 'none',
                                    background: 'none',
                                    border: 'none',
                                    color: 'inherit',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                                className={s.mainlogo}
                            >
                                Share positive energy
                                <img
                                    src={chel}
                                    className={s.logo}
                                    alt="SPE logo"
                                />
                            </button>
                            {isOtherUser ? (<p className={s.profilename}>{maskEmail(otherUser)}</p>):(<></>)}
                        </>
                    )}
                </div>
                <div className={s.rightContainer}>
                    <SearchComponent />
                    {isLoggedIn ? (
                        <>
                            <button
                                className={s.settingsLink}
                                onClick={() => {
                                    setIsInSettings(!isInSettings);
                                    navigate(
                                        isInSettings
                                            ? `/user_wall/${otherUser}`
                                            : '/auth/user'
                                    );
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                }}
                            >
                                <img src={settings} alt="Settings" />
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </nav>
    );
}