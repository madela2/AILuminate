import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'; // Add this import
import api from '../../services/api'; // Use the configured API instance instead
import LoaderAnimation from '../../components/common/LoadingAnitmation.jsx';
import styles from './styles/ResearcherList.module.css';

const ResearcherList = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await api.get('/public/accounts');
                setAccounts(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Failed to load accounts:', err);
                setError('Failed to load researcher accounts. Please try again later.');
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    if (loading) {
        return <LoaderAnimation />
    }

    return (
        <div className={styles['accounts-container'] || 'accounts-container'}>
            <h1>Researcher Accounts</h1>
            
            {error && <p className={styles.error || 'error'}>{error}</p>}
            
            {accounts.length === 0 && !error ? (
                <p>No researcher accounts found.</p>
            ) : (
                <ul>
                    {accounts.map(user => (
                        <li key={user._id}>
                            <Link
                                className={styles['account-link'] || 'account-link'}
                                to={`/profile/${user._id}`}
                            >
                                <h2>{user.username}</h2>
                                <p>{user.email}</p>
                                <p>Role: {user.role}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ResearcherList;