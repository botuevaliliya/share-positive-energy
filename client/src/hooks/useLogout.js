import useAuth from './useAuth';
import { axiosPrivateInstance } from '../api/apiConfig';

export default function useLogout() {
    const { setUser, setAccessToken, setCSRFToken, setIsLoggedIn,setOtherUser } = useAuth();

    const logout = async () => {
        try {
            const response = await axiosPrivateInstance.post('auth/logout', {}, { withCredentials: true });

            setAccessToken(null);
            setCSRFToken(null);
            setUser({});
            setIsLoggedIn(false);
            setOtherUser('');
        } catch (error) {
            console.log(error);
        }
    };

    return logout;
}
