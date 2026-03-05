import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './styles/LandingPage.module.css';
import LoaderAnimation from '../../components/common/LoadingAnitmation.jsx';

const LandingPage = () =>{
    const navigate = useNavigate();
    const[randomQuiz, setRandomQuiz] = useState(null);
    const [randomQuizId, setRandomQuizId] = useState(null);
    const [topQuizzes, setTopQuizzes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startingQuizId, setStartingQuizId] = useState(null);

    useEffect(() =>{
        const timer = setTimeout(() => setLoading(false), 20000);
        return () => clearTimeout(timer);
    }, []);

    // Different from oblig3 this landingpage is fetching a random quiz from the database
    useEffect(() => {
        const fetchRandomQuiz = async () => {
            setLoading(true);
            try {
                const res = await axios.get('/api/public/quizzes', { withCredentials: true });
                const quizzes = res.data;
                if (quizzes.length > 0) {
                    const randomIndex = Math.floor(Math.random() * quizzes.length);
                    const quiz = quizzes[randomIndex];
                    setRandomQuizId(quiz._id);
                    setRandomQuiz(quiz);
                } else {
                    console.log('No quizzes found');
                }
            } catch (err) {
                console.error('Failed to fetch quizzes:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchRandomQuiz();
    }, []);


    // This part of the code is used in Emilies oblig3
    const detectDeviceType = () =>{
        const ua = navigator.userAgent;
        if(/Mobi|Android/i.test(ua)){
            return 'Mobile';
        }else if(/Tablet|iPad/i.test(ua)){
            return 'Tablet';
        }
        return 'Desktop';
    };

      const handleStartClick = async () =>{
        if(!randomQuizId) return;

        setLoading(true);
        const deviceType = detectDeviceType();
        const visitorId = localStorage.getItem('visitorId');

        try{
            const res = await axios.post(`/api/public/quizzes/${randomQuizId}/start`, { 
                deviceType, 
                visitorId 
        });

            const { sessionId, firstQuestionId } = res.data;
            navigate(`/quizzes/${randomQuizId}/sessions/${sessionId}/question/${firstQuestionId}`);
        }catch (err){
            console.error('Error starting quiz:', err);
            alert('Failed to start the quiz. Please try again later.');
        }finally{
            setLoading(false);
        }
    };

    const handleTopQuizClick = async (quizId, e) => {
        e.preventDefault(); // Prevent default link behavior
        
        try {
            setStartingQuizId(quizId); // Set loading state for specific quiz
            
            // Generate a visitor ID if not exists
            let visitorId = localStorage.getItem('visitorId');
            if (!visitorId) {
                visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('visitorId', visitorId);
            }
            
            // Start a quiz session
            const response = await axios.post(`/api/public/quizzes/${quizId}/start`, {
                deviceType: detectDeviceType(),
                visitorId: visitorId
            });
            
            // Navigate to the first question
            navigate(`/quizzes/${quizId}/sessions/${response.data.sessionId}/question/${response.data.firstQuestionId}`);
        } catch (err) {
            console.error('Failed to start quiz:', err);
            alert('Failed to start the quiz. Please try again.');
        } finally {
            setStartingQuizId(null); // Reset loading state
        }
    };

    useEffect(() => {
        const fetchTopQuizzes = async () =>{
            try{
                const res = await axios.get('/api/public/quizzes', { withCredentials: true });
                const quizzes = res.data;
                const sortedQuizzes = [...quizzes].sort(
                    (a, b) => (b.timesAnswered || 0) - (a.timesAnswered || 0)
                );
                setTopQuizzes(sortedQuizzes.slice(0, 3));
                console.log('Top quizzes:', sortedQuizzes.slice(0, 3));
            }catch (err){
                console.error('Failed to fetch top quizzes:', err);
            }
        };
        fetchTopQuizzes();
    }, []);

    return(
        <div className={styles['landingpage-container']}>
            <div className={styles['welcome']}>
                <img className={styles['logo-img']} src="/Ailuminate_transparent.png" alt="The logo of Ailuminate. A illustration of a lightbulb" />
                <h1>Welcome to Ailuminate!</h1>
            </div>
            <div className={styles['quizzes-container']}>
                <div className={styles['top-quizzes']}>
                    <h2>Top 3 Quizzes</h2>
                    <div className={styles.topQuizzesSection}>
                        <ul className={styles.topQuizList}>
                            {topQuizzes.map(quiz => (
                                <li key={quiz._id} className={styles.topQuizItem}>
                                    <Link 
                                        to={`/quizzes/${quiz._id}`}
                                        onClick={(e) => handleTopQuizClick(quiz._id, e)}
                                    >
                                        <span className={styles.quizTitle}>{quiz.title}</span>
                                        <span className={styles.attemptCount}>
                                            {quiz.attemptCount} {quiz.attemptCount === 1 ? 'answer' : 'answers'}
                                        </span>
                                        {startingQuizId === quiz._id && (
                                            <span className={styles.loadingIndicator}><LoaderAnimation /></span>
                                        )}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
                <div className={styles['quiz-start-container']}>
                    <h1>{randomQuiz ? randomQuiz.title : 'Loading quiz...'}</h1>
                    <p className={styles['conditions']}>By clicking 'begin' you agree to your data being recorded, used in academic research, and potentially presented in an
                        aggregated form to an audience. Personal data - anything that allow us to uniquely identify you as a person - will not be recorded.</p>
                    <button
                        className={styles['quiz-start']}
                        onClick={handleStartClick} 
                        disabled={loading || !randomQuizId}
                    >
                        {loading ? <LoaderAnimation /> : 'START!'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;