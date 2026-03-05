import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './styles/AuthPages.module.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await axios.get(`/api/users/verify-researcher-request/${token}`);
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Verification failed');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token]);

  return (
    <div className={styles['register-container']}>
      <div className={styles['register-card']}>
        <h1>Email Verification</h1>
        
        {status === 'verifying' && <p>Verifying your email...</p>}
        
        {status === 'success' && (
          <div>
            <p className={styles['success-message']}>{message}</p>
            <p>Your request will be reviewed by an administrator.</p>
            <Link to="/login" className={styles['submitBtn']}>Return to Login</Link>
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <p className={styles['error-message']}>{message}</p>
            <p>Please try submitting your request again with a valid email.</p>
            <Link to="/register" className={styles['submitBtn']}>Sign up again</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;