import { useState, useEffect, createContext } from 'react';

export const AuthContext = createContext({
    user: {},
    setUser: () => {},
    otherUser: '',
    setOtherUser: () => {},
    accessToken: null,
    refreshToken: null,
    csrftoken: null,
    setAccessToken: () => {},
    setRefreshToken: () => {},
    setCSRFToken: () => {},
    isLoggedIn: false,
    setIsLoggedIn: () => {},
});

export function AuthContextProvider(props) {
    const [user, setUser] = useState({});
    const [otherUser, setOtherUser] = useState('');
    const [accessToken, setAccessToken] = useState();
    const [refreshToken, setRefreshToken] = useState();
    const [csrftoken, setCSRFToken] = useState();
    const [isLoggedIn, setIsLoggedIn] = useState(
        JSON.parse(localStorage.getItem('isLoggedIn')) || false
    );
    {
        /* */
    }

    useEffect(() => {
        localStorage.setItem('isLoggedIn', JSON.stringify(isLoggedIn));
    }, [isLoggedIn]);

    useEffect(() => {
        localStorage.setItem('otherUser', otherUser);
    }, [otherUser]);

    return (
        <AuthContext.Provider
            value={{
                user,
                setUser,
                otherUser,
                setOtherUser,
                accessToken,
                setAccessToken,
                refreshToken,
                setRefreshToken,
                csrftoken,
                setCSRFToken,
                isLoggedIn,
                setIsLoggedIn,
            }}
        >
            {props.children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
