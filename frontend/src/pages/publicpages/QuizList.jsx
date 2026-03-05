import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api'; // Use your configured API client
import styles from './styles/QuizList.module.css';
import LoaderAnimation from '../../components/common/LoadingAnitmation.jsx';

const QuizList = () => {
    const navigate = useNavigate();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [startingQuiz, setStartingQuiz] = useState(null);

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                setLoading(true);
                const response = await api.get('/public/quizzes');
                setQuizzes(response.data);
                setError('');
            } catch (err) {
                setError('Failed to load quizzes. Please try again.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    const handleQuizClick = async (quizId) => {
        try {
            setStartingQuiz(quizId); // Show loading state
            
            // Generate a visitor ID if not exists
            let visitorId = localStorage.getItem('visitorId');
            if (!visitorId) {
                visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('visitorId', visitorId);
            }
            
            // Start a quiz session
            const response = await api.post(`/public/quizzes/${quizId}/start`, {
                deviceType: 'web',
                visitorId: visitorId
            });
            
            // Navigate to the first question
            navigate(`/quizzes/${quizId}/sessions/${response.data.sessionId}/question/${response.data.firstQuestionId}`);
        } catch (err) {
            setError('Failed to start quiz. Please try again.');
            setStartingQuiz(null);
        }
    };

    return (
        <div className={styles['quiz-list-container']}>
            <h1>Available Quizzes</h1>
            <ul>
                {loading && <LoaderAnimation />}
                {error && <p className={styles.error}>{error}</p>}

                {!loading && quizzes.length === 0 && (
                    <p>No quizzes available at the moment.</p>
                )}

                {quizzes.map(quiz => (
                    <li 
                        className={styles['quiz-card']} 
                        key={quiz._id}
                        onClick={() => handleQuizClick(quiz._id)}
                    >
                        <div className={styles['quiz-content']}>
                            <h2>{quiz.title}</h2>
                            <p>{quiz.description}</p>
                            <div className={styles['quiz-meta']}>
                                <p>Created by: {quiz.owner?.username || 'Anonymous'}</p>
                                <p>{quiz.attemptCount || 0} attempts</p>
                            </div>
                            
                            {startingQuiz === quiz._id ? (
                                <div className={styles.startingIndicator}>
                                    <LoaderAnimation size="small" /> Starting quiz...
                                </div>
                            ) : (
                                <button className={styles.startButton}>
                                    Take Quiz
                                </button>
                            )}
                            <p className={styles['conditions']}>By clicking 'begin' you agree to your data being recorded, used in academic research, and potentially presented in an
                                aggregated form to an audience. Personal data - anything that allow us to uniquely identify you as a person - will not be recorded.</p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default QuizList;