import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import LoaderAnimation from '../../components/common/LoadingAnitmation.jsx';

const ResearcherQuizList = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const response = await api.get('/quizzes');
                setQuizzes(response.data);
                setLoading(false);
            } catch (err) {
                setError(`Failed to load quizzes: ${err.response?.data?.message || err.message}`);
                setLoading(false);
            }
        };

        fetchQuizzes();
    }, []);

    const handleStatusChange = async (quizId, newStatus) => {
        try {
            await api.put(`/quizzes/${quizId}`, { status: newStatus });
            
            // Update the quiz status in the state
            setQuizzes(quizzes.map(quiz => 
                quiz._id === quizId ? { ...quiz, status: newStatus } : quiz
            ));
        } catch (err) {
            setError(`Failed to update quiz status: ${err.response?.data?.message || err.message}`);
        }
    };

    return (
        <div className={styles['quiz-list-container']}>
            <div className={styles['header']}>
                <h1>My Quizzes</h1>
                <Link to="/researcher/quizzes/create" className={styles['create-button']}>
                    Create New Quiz
                </Link>
            </div>

            {loading && <LoaderAnimation />}
            {error && <p className={styles['error']}>{error}</p>}
            
            {!loading && quizzes.length === 0 ? (
                <p>You haven't created any quizzes yet.</p>
            ) : (
                <div className={styles['quiz-table-container']}>
                    <table className={styles['quiz-table']}>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Questions</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quizzes.map(quiz => (
                                <tr key={quiz._id}>
                                    <td>
                                        <Link to={`/researcher/quizzes/${quiz._id}`}>
                                            {quiz.title}
                                        </Link>
                                    </td>
                                    <td>{quiz.description}</td>
                                    <td>
                                        <span className={styles[`status-${quiz.status}`]}>
                                            {quiz.status}
                                        </span>
                                    </td>
                                    <td>{quiz.questions?.length || 0}</td>
                                    <td>{new Date(quiz.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className={styles['action-buttons']}>
                                            {quiz.status === 'draft' && (
                                                <button 
                                                    onClick={() => handleStatusChange(quiz._id, 'published')}
                                                    className={styles['publish-button']}
                                                >
                                                    Publish
                                                </button>
                                            )}
                                            {quiz.status === 'published' && (
                                                <button 
                                                    onClick={() => handleStatusChange(quiz._id, 'draft')}
                                                    className={styles['unpublish-button']}
                                                >
                                                    Unpublish
                                                </button>
                                            )}
                                            <Link 
                                                to={`/researcher/quizzes/${quiz._id}/edit`} 
                                                className={styles['edit-button']}
                                            >
                                                Edit
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ResearcherQuizList;