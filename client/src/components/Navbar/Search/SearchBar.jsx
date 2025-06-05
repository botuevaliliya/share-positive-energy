import { useState } from 'react';
import s from './Search.module.css';
import useAuth from '../../../hooks/useAuth';
import { axiosInstance } from '../../../api/apiConfig';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const SearchBar = ({ setResults, setInput, input }) => {
    const { accessToken, setOtherUser } = useAuth();
    const navigate = useNavigate();

    const fetchData = async (value) => {
        try {
            const response = await axiosInstance.get('auth/emails/', {
                // headers: {
                //     Authorization: `Bearer ${accessToken}`,
                // },
            });
            setResults(
                response.data.filter((email) =>
                    email.toLowerCase().includes(value.toLowerCase())
                )
            );
        } catch (err) {
            console.log(err);
        }
    };

    const handleChange = (value) => {
        setInput(value);
        fetchData(value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === 'Return' || e.keyCode === 13) {
            e.preventDefault();
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(input)) {
                console.log('Please enter a valid email address.');
                return;
            }
            setOtherUser(input);
            navigate(`/user_wall/${input}`);
            setInput('');
        }
    };

    return (
        <div className={s.inputWrapper}>
            <FaSearch id="search-icon" />
            <input
                placeholder="Type to search..."
                value={input}
                onChange={(e) => handleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={s.searchInput}
                type="email"
            />
        </div>
    );
};

const SearchResultsList = ({ results, setInput, setOtherUser }) => {
    const navigate = useNavigate();

    const maskEmail = (email) => {
        const [user, domain] = email.split('@');
        if (!user || !domain) return email;
        const visibleLength = Math.ceil(user.length / 2);
        const visiblePart = user.slice(0, visibleLength);
        const maskedPart = '*'.repeat(user.length - visibleLength);
        return `${visiblePart}${maskedPart}@${domain}`;
    };

    return (
        <div className={s.resultsList}>
            {results.map((result) => (
                <div
                    key={result}
                    className={s.searchResult}
                    onClick={() => {
                        setOtherUser(result);
                        setInput('');
                        navigate(`/user_wall/${result}`);
                    }}
                >
                    {maskEmail(result)}
                </div>
            ))}
        </div>
    );
};

const SearchComponent = () => {
    const [results, setResults] = useState([]);
    const [input, setInput] = useState('');
    const { setOtherUser } = useAuth();

    return (
        <div className={s.searchBarContainer}>
            <SearchBar
                setResults={setResults}
                setInput={setInput}
                input={input}
            />
            {input && results.length > 0 && (
                <SearchResultsList
                    results={results}
                    setInput={setInput}
                    setOtherUser={setOtherUser}
                />
            )}
        </div>
    );
};

export default SearchComponent;
