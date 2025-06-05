import { Routes, Navigate, Route } from 'react-router-dom';
import AuthMiddleware from './middlewares/AuthMiddleware';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
// import Home from './pages/Home';
// import Feedback from './pages/auth/Feedback';
import UserNew from './pages/auth/UserNew';
import PersistLogin from './components/PersistLogin';
import Navbar from './components/Navbar/Navbar';
import EmailConfirmation from './pages/auth/EmailConfirmation';
import Wall from './pages/auth/Wall';
import LandingPage from './pages/auth/LandingPage';
import ForgotPassword from './pages/auth/ForgotPassword';
import useAuth from './hooks/useAuth';

function App() {
    const {otherUser} = useAuth();
    // console.log(otherUser);
    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={<PersistLogin />}>
                    <Route index exact element={<LandingPage />}></Route>
                    <Route path="user_wall" > {/* element={<AuthMiddleware />} */}
                            <Route path=":email" element={<Wall />} />
                        </Route>
                    <Route path="/auth">
                        <Route path="login" element={<Login />}></Route>
                        <Route
                            path="forgot-password"
                            element={<ForgotPassword />}
                        />
                        <Route path="register" element={<Register />}></Route>
                        <Route path="confirm-email" element={<EmailConfirmation />}></Route>
                        {/* <Route path="landos" element={<LandingPage />}></Route> */}
                        {/* <Route path="feedback" element={<AuthMiddleware />}>
                            <Route index element={<Feedback />}></Route>
                        </Route> */}
                        <Route path="user" element={<AuthMiddleware />}>
                            <Route index element={<UserNew />}></Route>
                        </Route>
                        {/* <Route index element={<Navigate to="user_wall" />} /> */}
                    </Route>
                </Route>
                {/* <Route path="/" element={<Navigate to="/auth" />} /> */}
                {/* <Route
                    path="*"
                    element={<Navigate to="/auth/user_wall" />}
                ></Route> */}
            </Routes>
        </>
    );
}

export default App;
