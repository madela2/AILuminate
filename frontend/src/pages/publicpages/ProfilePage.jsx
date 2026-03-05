import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import styles from './styles/ProfilePage.module.css';
import { useParams, useNavigate } from 'react-router-dom';
import LoaderAnimation from '../../components/common/LoadingAnitmation.jsx';
import { useAuth } from '../../components/auth/AuthContext';

const ProfilePage = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    
    const [user, setUser] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                // Determine if we're viewing our own profile or someone else's
                const profileId = id || (currentUser?._id);
                
                if (!profileId) {
                    setError("No user ID available");
                    setLoading(false);
                    return;
                }
                
                // Always fetch from API to ensure complete data
                const profileUrl = `/public/account/${profileId}`;
                
                const userResponse = await api.get(profileUrl);
                const userData = userResponse.data;
                setUser(userData);

                // Fetch quizzes for researchers
                if (userData && userData.role === 'researcher') {
                    try {
                        // Filter quizzes by owner
                        const quizzesResponse = await api.get('/public/quizzes');
                        const allQuizzes = quizzesResponse.data;
                        
                        // Filter quizzes by owner
                        const userQuizzes = allQuizzes.filter(
                            (quiz) => quiz.owner?._id === profileId
                        );
                        
                        setQuizzes(userQuizzes);
                    } catch (err) {
                        console.error('Failed to load quizzes:', err);
                    }
                }
                
                setLoading(false);
            } catch (err) {
                console.error('Failed to load profile:', err);
                setError('Failed to load user profile');
                setLoading(false);
            }
        };
        
        fetchUserProfile();
    }, [id, currentUser]);

    // Helper function to check if current user is the profile owner
    const isOwnProfile = () => {
        if (!currentUser || !user) return false;
        return currentUser._id === user._id;
    };

    const handleDeleteAccount = async () => {
        if (user.role === 'researcher') {
            const confirmed = window.confirm('Are you sure you want to request your account deleted? This will send a confirmation link to your email.');

            if (!confirmed) return;

            const password = prompt('Please enter your password to confirm:');
            if (!password) {
                alert('Password is required to proceed.');
                return;
            }

            try {
                const res = await api.post('/users/request-researcher', {
                    username: user.username,
                    email: user.email,
                    password,
                    action: 'delete',
                });

                alert(res.data.message || 'Delete request submitted');
                navigate('/');
            } catch (err) {
                console.error(err);
                alert(err.response?.data?.message || 'Failed to send deletion request.');
            }
        } else if (user.role === 'admin') {
            alert('Please contact support to delete your account!');
        }
    };

    const handleChangeUsername = () => {
        alert('This feature is not yet implemented.');
    };

    const handleChangePassword = () => {
        alert('This feature is not yet implemented.');
    };

    if (loading) {
        return <div className={styles.loadingContainer}><LoaderAnimation /></div>;
    }

    if (error) {
        return <div className={styles.errorContainer}><p>{error}</p></div>;
    }

    if (!user) {
        return <div className={styles.errorContainer}><p>No Profile Found...</p></div>;
    }

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatarPlaceholder}>
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h1>{user.username}</h1>
                </div>
                
                <div className={styles.profileInfo}>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Email:</span>
                        <span className={styles.infoValue}>{user.email}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Role:</span>
                        <span className={styles.infoValue}>{user.role}</span>
                    </div>
                    <div className={styles.infoItem}>
                        <span className={styles.infoLabel}>Joined:</span>
                        <span className={styles.infoValue}>
                            {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                {/* Only show action buttons if this is the user's own profile */}
                {isOwnProfile() && (
                    <div className={styles.actionButtons}>
                        <button onClick={handleChangeUsername}>Change Username</button>
                        <button onClick={handleChangePassword}>Change Password</button>
                        <button onClick={handleDeleteAccount} className={styles.deleteButton}>Delete Account</button>
                    </div>
                )}

                {user.role === 'researcher' && (
                    <div className={styles.quizSection}>
                        <h2>Quizzes</h2>
                        {quizzes.length > 0 ? (
                            <ul className={styles.quizList}>
                                {quizzes.map(quiz => (
                                    <li key={quiz._id} className={styles.quizItem}>
                                        <h3>{quiz.title}</h3>
                                        <p>{quiz.description}</p>
                                        <div className={styles.quizMeta}>
                                            <span className={styles.quizStatus}>{quiz.status}</span>
                                            <span>{quiz.attemptCount || 0} attempts</span>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className={styles.noQuizzes}>No quizzes created yet...</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfilePage;