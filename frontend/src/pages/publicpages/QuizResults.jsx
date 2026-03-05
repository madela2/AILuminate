import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import styles from './styles/QuizResults.module.css';
import LoaderAnimation from '../../components/common/LoadingAnitmation.jsx';

const QuizResults = () => {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const attemptId = location.state?.attemptId;
    const userEmail = location.state?.email;
    
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [emailSending, setEmailSending] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(120);
    
    useEffect(() => {
        if (!attemptId) {
            setError('No quiz attempt found. Please take a quiz first.');
            setLoading(false);
            return;
        }
        
        const fetchResults = async () => {
            try {
                const response = await axios.get(`/api/public/quizzes/attempts/${attemptId}`, {
                    withCredentials: true
                });
                setResult(response.data);
            } catch (err) {
                console.error('Error fetching results:', err);
                setError('Failed to load your results. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        
        fetchResults();
    }, [attemptId]);

    useEffect(() => {
        if (loading) return; // Don't start timer until results are loaded

        const timer = setInterval(() => {
            setTimeRemaining(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timer);
                    navigate('/'); // Redirect to landing page
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        // Cleanup timer on component unmount
        return () => clearInterval(timer);
    }, [loading, navigate]);
    
    const handleSendEmail = async () => {
        if (!userEmail) {
            alert('Please provide an email address on the demographics page to receive results.');
            return;
        }
        
        setEmailSending(true);
        
        try {
            await axios.post('/api/public/email-results', {
                attemptId
            }, { withCredentials: true });
            
            setEmailSent(true);
        } catch (err) {
            console.error('Error sending email:', err);
            alert('Failed to send the results email. Please try again.');
        } finally {
            setEmailSending(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    if (loading) return <div className={styles.loading}>Loading your results...</div>;
    
    if (error) {
        return (
            <div className={styles.errorContainer}>
                <p>{error}</p>
                <button onClick={() => navigate('/')}>Return to Home</button>
            </div>
        );
    }

    if (!result) {
        return (
            <div className={styles.errorContainer}>
                <p>No results found. Please try taking the quiz again.</p>
                <button onClick={() => navigate('/')}>Return to Home</button>
            </div>
        );
    }
    
    const averageScore = result.averageScore || 0;
    
    return (
        <div className={styles.resultsContainer}>
            <div className={styles.countdownTimer}>
                <p>Redirecting to home in <span>{formatTime(timeRemaining)}</span></p>
                <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill} 
                        style={{ width: `${(timeRemaining / 120) * 100}%` }}
                    ></div>
                </div>
            </div>
            
            <h1>{result.quizTitle || 'Quiz'} Your Quiz Results</h1>
            
            <div className={styles.scoreCard}>
                <div className={styles.scoreCircle}>
                    <span className={styles.scoreNumber}>{result.score}</span>
                    <span className={styles.scoreTotal}>/{result.totalQuestions}</span>
                </div>
                <p className={styles.scorePercentage}>{result.percentage}%</p>
                <p className={styles.averageComparison}>
                    {result.percentage > averageScore 
                        ? `Above average! (Avg: ${averageScore}%)` 
                        : `Average score: ${averageScore}%`}
                </p>
            </div>
            
            <div className={styles.actions}>
                {userEmail && (
                    <button 
                        onClick={handleSendEmail}
                        disabled={emailSending || emailSent}
                        className={styles.emailButton}
                    >
                        {emailSending ? <LoaderAnimation /> : emailSent ? 'Email Sent!' : 'Send Results to Email'}
                    </button>
                )}
                
                <button 
                    onClick={() => navigate('/')}
                    className={styles.homeButton}
                >
                    Take Another Quiz
                </button>
            </div>
        </div>
    );
};

export default QuizResults;