import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles/AuthPages.module.css';
import api from '../../services/api';

const SignupPage = () => {
    const[email, setEmail] = useState('');
    const[username, setUsername] = useState('');
    const[password, setPassword] = useState('');
    const[confirmPassword, setConfirmPassword] = useState('');
    const[error, setError] = useState('');
    const[message, setMessage] = useState('');
    const[loading, setLoading] = useState(false);
    const[registrationSuccess, setRegistrationSuccess] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

        if(password !== confirmPassword){
            setError('Passwords do not match!');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try{
            const res = await api.post('/users/request-researcher',{
                email: email,
                username: username,
                password: password,
                action: "researcher"
            });

            setMessage(res.data.message || 'Check your email to verify your account!');
            setRegistrationSuccess(true); // Set success state instead of navigating
            // Remove this line: navigate('/login');
        }catch (err){
            setError(err.response?.data.message || 'Something went wrong...');
            setRegistrationSuccess(false);
        }finally{
            setLoading(false);
        }
    };

    return(
        <div className={styles['register-container']}>
            <div className={styles['register-right']}>
                <h1>Join us!</h1>
            </div>
            
            <div className={styles['register-card']}>
                <h1>Register</h1>
                
                {registrationSuccess ? (
                    <div className={styles.successMessage}>
                        <h3>Registration Request Sent!</h3>
                        <p>{message}</p>
                        <p>Check your email inbox to verify your account.</p>
                        <p>After verification, an admin will review your request.</p>
                        <button 
                            onClick={() => navigate('/login')}
                            className={styles.loginButton}
                        >
                            Go to Login
                        </button>
                    </div>
                ) : (
                    <form 
                        className={styles['register-group']}
                        onSubmit={handleSubmit}
                    >
                        <label>Email<span className={styles['required-star']}> *</span></label>
                        <input 
                            type='email'
                            placeholder='Email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required 
                        />
                        <label>Username<span className={styles['required-star']}> *</span></label>
                        <input 
                            type='text' 
                            placeholder='Username'
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <label>Password<span className={styles['required-star']}> *</span></label>
                        <input 
                            type='password' 
                            placeholder='Password'
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <label>Confirm Password<span className={styles['required-star']}> *</span></label>
                        <input 
                            type='password' 
                            placeholder='Confirm Password'
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <p className={styles['required-field']}><span className={styles['required-star']}> *</span>Fields with this star is required</p>
                        <button
                        className={styles['submitBtn']}
                            type='submit'
                            disabled={loading}
                        >
                            {loading ? 'Submitting' : 'Register'}
                        </button>

                        {error && <p className={styles.errorMessage}>{error}</p>}
                        {message && !registrationSuccess && <p className={styles.infoMessage}>{message}</p>}

                        <div className={styles['redirect']}>
                            <p>Already have an account? <Link to='/login'>Login</Link></p>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SignupPage;