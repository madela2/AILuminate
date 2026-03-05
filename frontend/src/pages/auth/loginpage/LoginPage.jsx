import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/AuthPages.module.css';
import { useAuth } from '../../../components/auth/AuthContext';
import LoaderAnimation from '../../../components/common/LoadingAnitmation.jsx';

const LoginPage = () =>{
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) =>{
        e.preventDefault(); // Prevents the form from reloading the page
        setLoading (true);
        setError('');

        try {
            const res = await login(username, password);

            // Redirect based on user role
            if (res.data.role === 'admin') {
                navigate('/admin/dashboard');
            } else if (res.data.role === 'researcher') {
                navigate('/researcher/dashboard');
            } else {
                navigate('/unauthorized');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };


    return(
        <div className={styles['login-container']}>
            <div className={styles['left']}>
                <img src='/Ailuminate_logo.png' alt='The Ailuminate logo to the left of the login form' />

                <h1>Welcome to Ailuminate!</h1>
                <p>Join us in Ailuminate to:</p>
                <p>Create your own quizzes.</p>
                <p>Raise AI literacy and awareness!</p>
            </div>

            <div className={styles['login-right']}>
                <div className={styles['login-card']}>
                    <h1>Login</h1>
                    <form onSubmit={handleSubmit}>
                        <div className={styles['input-group']}>
                            <label htmlFor='username'>Username<span className={styles['required-star']}> *</span></label>
                                <input 
                                    type='text' 
                                    name='username'
                                    placeholder='Username'
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                        </div>

                        <div className={styles['input-group']}>
                            <label htmlFor='password'>Password<span className={styles['required-star']}> *</span></label>
                                <input 
                                    type='password'
                                    name='password'
                                    placeholder='Password' 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <p className={styles['required-field']}><span className={styles['required-star']}> *</span>Fields with this star is required</p>
                        </div>

                        <div className={styles.forgotPassword}>
                            <Link to='/forgot-password'>
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            className={styles['submitBtn']}
                            type='submit'
                            disabled={loading}
                        >
                            {loading ? <LoaderAnimation /> : 'Login'}
                        </button>

                        <div className={styles['register']}>
                            <p>Want to join us? <Link to='/register'>Sign Up!</Link></p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;