import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './styles/QuizDetail.module.css';
import LoaderAnimation from '../../components/common/LoadingAnitmation.jsx';

const QuizDetail = () => {
    const { id } = useParams();
    const [quiz, setQuiz] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [error, setError] = useState('');
    const [statsError, setStatsError] = useState('');

    useEffect(() => {
        const fetchQuizAndStats = async () => {
            try {
                setLoading(true);
                // First fetch the quiz details
                const quizResponse = await api.get(`/quizzes/${id}`);
                setQuiz(quizResponse.data);
                setLoading(false);
                
                // Then fetch the stats
                try {
                    setStatsLoading(true);
                    const statsResponse = await api.get(`/admin/quiz/${id}/stats`);
                    console.log('Stats response:', statsResponse.data);
                    setStats(statsResponse.data);
                    setStatsError('');
                } catch (statsErr) {
                    console.error('Stats fetch error:', statsErr);
                    setStatsError(`Couldn't load analytics: ${statsErr.response?.data?.message || statsErr.message}`);
                    setStats({
                        totalAttempts: 0,
                        completedAttempts: 0,
                        incompleteAttempts: 0,
                        scores: { avgScore: null }
                    });
                } finally {
                    setStatsLoading(false);
                }
            } catch (err) {
                console.error('Quiz fetch error:', err);
                setError(`Failed to load quiz data: ${err.response?.data?.message || err.message}`);
                setLoading(false);
            }
        };

        fetchQuizAndStats();
    }, [id]);

    // Handle status change (publish/unpublish)
    async function handleStatusChange(newStatus) {
        try {
            await api.put(`/quizzes/${id}`, { status: newStatus });
            setQuiz({ ...quiz, status: newStatus });
        } catch (err) {
            setError(`Failed to update quiz status: ${err.response?.data?.message || err.message}`);
        }
    }

    const calculatePercentages = (data) => {
        if (!data || data.length === 0) return [];
        const totalCount = data.reduce((sum, item) => sum + item.count, 0);
        return data.map(item => ({
            ...item,
            percentage: ((item.count / totalCount) * 100).toFixed(1)
        }));
    };

    if (loading) return <div className={styles['loading-container']}><LoaderAnimation /></div>;
    if (error) return <p className={styles.error}>{error}</p>;
    if (!quiz) return <p>Quiz not found</p>;

    return (
        <div className={styles['quiz-detail-container']}>
            <div className={styles.header}>
                <h1>{quiz.title}</h1>
                <div className={styles['status-badge']}>{quiz.status}</div>
            </div>

            <div className={styles.description}>
                <p>{quiz.description || "No description provided."}</p>
            </div>

            <h2>Performance Statistics</h2>
            {statsLoading ? (
                <div className={styles['stats-loading']}><LoaderAnimation /></div>
            ) : statsError ? (
                <div className={styles.statsError}>
                    <p>{statsError}</p>
                    <p>This may happen if the quiz has no responses yet.</p>
                </div>
            ) : (
                <div className={styles['stats-grid']}>
                    <div className={styles['stat-card']}>
                        <h3>Total Responses</h3>
                        <div className={styles['stat-number']}>{stats.totalAttempts}</div>
                    </div>
                    <div className={styles['stat-card']}>
                        <h3>Complete Quizzes</h3>
                        <div className={styles['stat-number']}>{stats.completedAttempts}</div>
                    </div>
                    <div className={styles['stat-card']}>
                        <h3>Incomplete Quizzes</h3>
                        <div className={styles['stat-number']}>{stats.incompleteAttempts}</div>
                    </div>
                    <div className={styles['stat-card']}>
                        <h3>Average Score</h3>
                        <div className={styles['stat-number']}>
                            {stats.scores?.avgScore ? `${(stats.scores.avgScore * 100).toFixed(1)}%` : 'N/A'}
                        </div>
                    </div>
                </div>
            )}

            {/* Demographics Section */}
            {!statsLoading && !statsError && stats.demographics && (
                <div className={styles.demographicsSection}>
                    <h2>Demographic Insights</h2>
                    
                    {/* Age Groups */}
                    {stats.demographics.ageGroups && stats.demographics.ageGroups.length > 0 ? (
                        <div className={styles.demographicsCard}>
                            <h3>Age Group Distribution</h3>
                            <div className={styles.chartContainer}>
                                <table className={styles.demographicsTable}>
                                    <thead>
                                        <tr>
                                            <th>Age Group</th>
                                            <th>Percentage</th>
                                            <th>Average Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calculatePercentages(stats.demographics.ageGroups).map((group, index) => (
                                            <tr key={index}>
                                                <td>{group._id || 'Not specified'}</td>
                                                <td>{group.percentage}%</td>
                                                <td>
                                                    {typeof group.avgScore === 'number' && !isNaN(group.avgScore) && stats.totalQuestions > 0 
                                                        ? `${((group.avgScore / stats.totalQuestions) * 100).toFixed(1)}%` 
                                                        : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <p>No age group data available</p>
                    )}

                    {/* Gender Distribution */}
                    {stats.demographics.gender && stats.demographics.gender.length > 0 ? (
                        <div className={styles.demographicsCard}>
                            <h3>Gender Distribution</h3>
                            <div className={styles.chartContainer}>
                                <table className={styles.demographicsTable}>
                                    <thead>
                                        <tr>
                                            <th>Gender</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calculatePercentages(stats.demographics.gender).map((item, index) => (
                                            <tr key={index}>
                                                <td>{item._id || 'Not specified'}</td>
                                                <td>{item.percentage}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <p>No gender data available</p>
                    )}

                    {/* AI Familiarity Distribution */}
                    {stats.demographics.aiFamiliarity && stats.demographics.aiFamiliarity.length > 0 ? (
                        <div className={styles.demographicsCard}>
                            <h3>AI Familiarity Distribution</h3>
                            <div className={styles.chartContainer}>
                                <table className={styles.demographicsTable}>
                                    <thead>
                                        <tr>
                                            <th>AI Experience Level</th>
                                            <th>Percentage</th>
                                            <th>Average Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {calculatePercentages(stats.demographics.aiFamiliarity).map((item, index) => (
                                            <tr key={index}>
                                                <td>{item._id || 'Not specified'}</td>
                                                <td>{item.percentage}%</td>
                                                <td>
                                                    {typeof item.avgScore === 'number' && !isNaN(item.avgScore) && stats.totalQuestions > 0
                                                        ? `${((item.avgScore / stats.totalQuestions) * 100).toFixed(1)}%` 
                                                        : 'N/A'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <p>No AI familiarity data available</p>
                    )}
                    

                    {/* Question Difficulty */}
                    {stats.questionDifficulty && stats.questionDifficulty.length > 0 && (
                        <div className={styles.demographicsCard}>
                            <h3>Question Difficulty</h3>
                            <div className={styles.chartContainer}>
                                <table className={styles.demographicsTable}>
                                    <thead>
                                        <tr>
                                            <th>Question</th>
                                            <th>Difficulty Rate</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.questionDifficulty.map((item, index) => {
                                            const question = quiz.questions.find(q => q._id === item.questionId);
                                            return (
                                                <tr key={index}>
                                                    <td>Q{index + 1}: {question ? question.content.substring(0, 30) + (question.content.length > 30 ? '...' : '') : 'Unknown'}</td>
                                                    <td>{(item.difficultyRate * 100).toFixed(0)}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className={styles.actions}>
                <Link to={`/researcher/quizzes/${id}/edit`} className={styles['edit-button']}>
                    Edit Quiz
                </Link>
                
                {quiz.status === 'draft' ? (
                    <button 
                        className={styles['publish-button']}
                        onClick={() => handleStatusChange('published')}
                    >
                        Publish Quiz
                    </button>
                ) : quiz.status === 'published' ? (
                    <button 
                        className={styles['unpublish-button']}
                        onClick={() => handleStatusChange('draft')}
                    >
                        Unpublish Quiz
                    </button>
                ) : null}
            </div>

            <h2>Questions ({quiz.questions?.length || 0})</h2>
            {quiz.questions?.length > 0 ? (
                <div className={styles['questions-list']}>
                    {quiz.questions.map((question, index) => (
                        <div key={question._id} className={styles['question-card']}>
                            <h3>Question {index + 1}</h3>
                            <p>{question.content}</p>
                        </div>
                    ))}
                </div>
            ) : (
                <p>This quiz doesn't have any questions yet.</p>
            )}
        </div>
    );
};

export default QuizDetail;