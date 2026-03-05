import { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './styles/AuthPages.module.css';
import api from '../../services/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await api.post('/auth/forgot-password', { email });
            setMessage(res.data.message || 'Password reset instructions sent to your email!');
            setSubmitted(true);
        } catch (err) {
            setError(err.response?.data.message || 'Something went wrong. Please try again.');
            setSubmitted(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles['login-container']}>
            <div className={styles['login-card']}>
                <h1>Reset Password</h1>
                
                {submitted ? (
                    <div className={styles.successMessage}>
                        <p>{message}</p>
                        <p>Please check your email for instructions to reset your password.</p>
                        <Link to="/login" className={styles.loginButton}>
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <>
                        <p>Enter your email address and we'll send you a link to reset your password.</p>
                        
                        <form className={styles['login-group']} onSubmit={handleSubmit}>
                            <input
                                type="email"
                                placeholder="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            
                            <button
                                type="submit"
                                disabled={loading}
                                className={styles.submitBtn}
                            >
                                {loading ? 'Sending...' : 'Send Reset Link'}
                            </button>
                            
                            {error && <p className={styles.errorMessage}>{error}</p>}
                            {message && !submitted && <p className={styles.infoMessage}>{message}</p>}
                            
                            <div className={styles.redirect}>
                                <p>Remember your password? <Link to="/login">Login</Link></p>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;