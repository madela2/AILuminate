import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/QuizPage.module.css';
import { HiArrowRight, HiArrowLeft } from "react-icons/hi";
import LoaderAnimation from '../../../components/common/LoadingAnitmation.jsx';

const QuizPage = () =>{
    const navigate = useNavigate();
    const { quizId, sessionId, questionId } = useParams();

    const [quiz, setQuiz] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [answered, setAnswered] = useState(false);

    // Inactivity timer
    const [inactiveTime, setInactiveTime] = useState(0);
    const [showWarning, setShowWarning] = useState(false);
    const inactivityTimerRef = useRef(null);
    const INACTIVE_LIMIT = 120;
    const WARNING_THRESHOLD = 90; // Show warning after 90 seconds

    // Reset inactivity timer whenever user interacts with the page
    const resetInactivityTimer = () => {
        setInactiveTime(0);
        setShowWarning(false);
    };

    useEffect(() => {
        // Set up inactivity timer only after loading is complete
        if (loading) return;

        inactivityTimerRef.current = setInterval(() => {
            setInactiveTime(prevTime => {
                const newTime = prevTime + 1;

                // Show warning if approaching timeout
                if (newTime >= WARNING_THRESHOLD && newTime < INACTIVE_LIMIT) {
                    setShowWarning(true);
                }

                // Redirect if timeout reached
                if (newTime >= INACTIVE_LIMIT) {
                    clearInterval(inactivityTimerRef.current);
                    navigate('/');
                    return 0;
                }

                return newTime;
            });
        }, 1000);

        // Event listeners for user activity
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        activityEvents.forEach(event => {
            document.addEventListener(event, resetInactivityTimer);
        });

        // Clean up timers and event listeners
        return () => {
            clearInterval(inactivityTimerRef.current);
            activityEvents.forEach(event => {
                document.removeEventListener(event, resetInactivityTimer);
            });
        };
    }, [loading, navigate]);

    useEffect(() => {
        const fetchQuiz = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/api/public/quizzes/${quizId}`, { withCredentials: true });
                setQuiz(response.data);
                
                // Find current question and its index
                const index = response.data.questions.findIndex(q => q._id === questionId);
                if (index !== -1) {
                    setCurrentQuestion(response.data.questions[index]);
                    setQuestionIndex(index);

                    // Check if the question was already answered
                    const existingAnswer = answers.find(a => a.questionId === questionId);
                    if (existingAnswer) {
                        setSelectedOption(existingAnswer.selectedOption);
                        setAnswered(true);
                    } else {
                        setSelectedOption(null);
                        setAnswered(false);
                    }
                } else {
                    setError('Question not found');
                }
            } catch (err) {
                console.error('Error loading quiz:', err);
                setError('Failed to load quiz data');
            } finally {
                setLoading(false);
            }
        };
        
        fetchQuiz();
    }, [quizId, questionId, answers]);

    // Format time for display
    const formatTime = (seconds) => {
        const mins = Math.floor((INACTIVE_LIMIT - seconds) / 60);
        const secs = (INACTIVE_LIMIT - seconds) % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleOptionSelect = (optionIndex) => {
        if (answered) return;
        
        setSelectedOption(optionIndex);
        setAnswered(true);
        
        // Check if answer is correct
        const isCorrect = optionIndex === currentQuestion.correctIndex;
        
        // Store the answer
        const answer = {
            questionId: currentQuestion._id,
            selectedOption: optionIndex,
            isCorrect: isCorrect
        };
        
        setAnswers([...answers, answer]);
    };

    const handleNext = () => {
        if (selectedOption === null) {
            alert('Please select an answer before proceeding');
            return;
        }

        // Reset inactivity timer when user navigates
        resetInactivityTimer();

        // Save answer
        const newAnswers = [...answers];
        newAnswers[questionIndex] = {
            questionId: currentQuestion._id,
            selectedOption: selectedOption
        };
        setAnswers(newAnswers);

        // If last question, go to demographics
        if (questionIndex >= quiz.questions.length - 1) {
            navigate(`/quizzes/${quizId}/demographics`, {
                state: { answers: newAnswers, sessionId, quizId }
            });
            return;
        }

        // Otherwise go to next question
        const nextQuestion = quiz.questions[questionIndex + 1];
        navigate(`/quizzes/${quizId}/sessions/${sessionId}/question/${nextQuestion._id}`);
        setSelectedOption(null); // Reset selection for next question
    };

    const handlePrevious = () => {
        if (questionIndex <= 0) return;

        // Reset inactivity timer when user navigates
        resetInactivityTimer();

        // Save the current answer before navigating
        if (selectedOption !== null) {
            const newAnswers = [...answers];
            newAnswers[questionIndex] = {
                questionId: currentQuestion._id,
                selectedOption: selectedOption
            };
            setAnswers(newAnswers);
        }

        const prevQuestion = quiz.questions[questionIndex - 1];
        navigate(`/quizzes/${quizId}/sessions/${sessionId}/question/${prevQuestion._id}`);
    }

    if (loading) return <div className={styles.loadingContainer}><LoaderAnimation /></div>;

    if (error) return (
        <div className={styles.errorContainer}>
            <p>{error}</p>
            <button onClick={() => navigate('/')}>Return to Home</button>
        </div>
    );

    if (!currentQuestion) return (
        <div className={styles.errorContainer}>
            <p>Question not found</p>
            <button onClick={() => navigate('/')}>Return to Home</button>
        </div>
    );

    return (
        <div className={styles.quizContainer} onClick={resetInactivityTimer}>
            {showWarning && (
                <div className={styles.inactivityWarning}>
                    <p>You will be redirected to the home page in {formatTime(inactiveTime)} due to inactivity</p>
                    <button onClick={resetInactivityTimer} className={styles.stayButton}>Continue Quiz</button>
                    <div className={styles.progressBar}>
                        <div 
                            className={styles.progressFill} 
                            style={{ width: `${((INACTIVE_LIMIT - inactiveTime) / (INACTIVE_LIMIT - WARNING_THRESHOLD)) * 100}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <div className={styles.quizCard}>
                <div className={styles.progressBar}>
                    <div 
                        className={styles.progressFill} 
                        style={{ width: `${(questionIndex + 1) * 100 / quiz.questions.length}%` }}
                    />
                </div>
                
                <h1 className={styles.quizTitle}>{quiz.title}</h1>
                
                <div className={styles.questionContainer}>
                    <h2 className={styles.questionCounter}>Question {questionIndex + 1} of {quiz.questions.length}</h2>
                    <p className={styles.questionContent}>{currentQuestion.content}</p>
                    
                    {/* Display media (images, audio, video) above the question */}
                    {currentQuestion.mediaUrls?.length > 0 && (
                    <div className={styles.questionMedia}>
                        {currentQuestion.mediaUrls.map((url, index) => {
                        if (currentQuestion.type === 'image') {
                            return (
                            <img
                                key={index}
                                src={url}
                                alt={`Question media ${index + 1}`}
                                className={styles.mediaContent}
                            />
                            );
                        } else if (currentQuestion.type === 'video') {
                            return (
                            <div className={styles.videoContainer} key={index}>
                                <video
                                    controls
                                    className={styles.mediaContent}
                                    preload="metadata"
                                    playsInline
                                    onError={(e) => {
                                        console.error("Video loading error details:", {
                                            url: url,
                                            errorCode: e.target.error ? e.target.error.code : 'No error code',
                                            errorMessage: e.target.error ? e.target.error.message : 'No detailed error'
                                        });
                                    }}
                                >
                                    <source src={url} type="video/mp4" />
                                    <source src={url.replace('.mp4', '.webm')} type="video/webm" />
                                    Your browser does not support HTML5 video.
                                </video>
                            </div>
                            );
                        } else if (currentQuestion.type === 'audio') {
                            return (
                            <audio
                                key={index}
                                src={url}
                                controls
                                className={styles.mediaContent}
                            />
                            );
                        } else {
                            return null;
                        }
                        })}
                    </div>
                    )}

                    {/* Render text-based answer options */}
                    <div className={styles.options}>
                    {currentQuestion.options.map((option, index) => (
                        <button
                        key={index}
                        onClick={() => handleOptionSelect(index)}
                        className={`${styles.option} 
                            ${selectedOption === index && answered ?
                            (index === currentQuestion.correctIndex ?
                                styles.correctOption :
                                styles.incorrectOption) :
                            ''}
                            ${selectedOption === index ? styles.selected : ''}`}
                        disabled={answered}
                        >
                        {option}
                        </button>
                    ))}
                    </div>

                    {/* Explanation section - only visible after answering */}
                    <div className={`${styles.explanationSection} ${answered ? styles.visible : ''}`}>
                        <h3 className={styles.explanationTitle}>Explanation</h3>
                        <p>{currentQuestion.explanation}</p>
                    </div>

                    {/* Feedback message - shown after answering */}
                    {answered && (
                        <div className={
                            selectedOption === currentQuestion.correctIndex ? 
                            styles.correctFeedback : 
                            styles.incorrectFeedback
                        }>
                            {selectedOption === currentQuestion.correctIndex ? 
                                'Correct!' : 
                                'Incorrect! The correct answer is: ' + currentQuestion.options[currentQuestion.correctIndex]}
                        </div>
                    )}
                </div>

                <div className={styles.navigationButtons}>
                    <button 
                        className={styles.navButton}
                        onClick={handlePrevious}
                        disabled={questionIndex === 0}
                    >
                        <HiArrowLeft /> Previous
                    </button>
                    <button 
                        className={styles.navButton}
                        onClick={handleNext}
                        disabled={selectedOption === null}
                    >
                        {questionIndex === quiz.questions.length - 1 ? 'Finish' : 'Next'} <HiArrowRight />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QuizPage;