import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './styles/AuthPages.module.css';
import api from '../../services/api';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        
        setLoading(true);
        setError('');
        setMessage('');
        
        try {
            const res = await api.post(`/auth/reset-password/${token}`, { password });
            setMessage(res.data.message || 'Password reset successful!');
            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data.message || 'Failed to reset password. Please try again.');
            setSuccess(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles['login-container']}>
            <div className={styles['login-card']}>
                <h1>Create New Password</h1>
                
                {success ? (
                    <div className={styles.successMessage}>
                        <p>{message}</p>
                        <p>You will be redirected to login page shortly...</p>
                        <Link to="/login" className={styles.loginButton}>
                            Login Now
                        </Link>
                    </div>
                ) : (
                    <>
                        <p>Please enter your new password.</p>
                        
                        <form className={styles['login-group']} onSubmit={handleSubmit}>
                            <input
                                type="password"
                                placeholder="New Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength="6"
                            />
                            
                            <input
                                type="password"
                                placeholder="Confirm New Password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className={styles.submitBtn}
                            >
                                {loading ? 'Setting Password...' : 'Reset Password'}
                            </button>
                            
                            {error && <p className={styles.errorMessage}>{error}</p>}
                            {message && !success && <p className={styles.infoMessage}>{message}</p>}
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;