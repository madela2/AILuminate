import { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../../services/api';
import LoaderAnimation from '../../components/common/LoadingAnitmation.jsx';
import SearchBar from '../../components/common/SearchBar.jsx';
import styles from './styles/AdminDashboard.module.css';
import { Link } from 'react-router-dom';

const AdminDashboard = ({ user }) => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [analytics, setAnalytics] = useState(null);
    const [platformLoad, setPlatformLoad] = useState([]);
    const [researchers, setResearchers] = useState([]);
    const [researcherLoading, setResearcherLoading] = useState(true);
    const [researcherError, setResearcherError] = useState('');
    const [banActionLoading, setBanActionLoading] = useState(false);

    // Fetch researcher requests and analytics on component mount
    useEffect(() => {
        fetchRequests();
        fetchAnalytics();
        fetchPlatformLoad();
    }, []);

    useEffect(() => {
        fetchResearchers();
    }, []);

    // Fetch researchers
    const fetchResearchers = async () => {
        try {
            setResearcherLoading(true);
            const response = await api.get('/public/accounts');
            console.log("Fetched researchers:", response.data);
            setResearchers(response.data);
            setResearcherError('');
        } catch (err) {
            console.error('Failed to fetch researchers:', err);
            setResearcherError('Failed to load researchers. Please try again.');
        } finally {
            setResearcherLoading(false);
        }
    };

    // Fetch researcher requests
    const fetchRequests = async () => {
        try {
            setLoading(true);
            const response = await api.get('/users/researcher-requests');
            setRequests(response.data);
            setError('');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Authentication failed. Please log in again.');
            } else {
                setError(`Failed to load researcher requests: ${err.response?.data?.message || err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch platform analytics
    const fetchAnalytics = async () => {
        try {
            const res = await api.get('/admin/analytics');
            setAnalytics(res.data);
        } catch (err) {
            setError('Failed to load platform analytics.');
        }
    };

    // Fetch platform load data
    const fetchPlatformLoad = async () => {
        try {
            const res = await api.get('/admin/requests-analytics');
            setPlatformLoad(res.data);
        } catch (err) {
            setError('Failed to load platform load info.');
        }
    };

    // Approve researcher request
    const handleApprove = async (id) => {
        try {
            await api.post(`/users/approve-researcher/${id}`);
            setRequests(requests.filter(request => request._id !== id));
            setSuccessMessage('Researcher approved successfully.');
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (err) {
            setError('Failed to approve researcher. Please try again.');
        }
    };

    // Toggle ban status
    const handleBanToggle = async (userId, currentBanStatus) => {
        try {
            setBanActionLoading(true);
            
            // Log the request details for debugging
            console.log(`Attempting to ${currentBanStatus ? 'unban' : 'ban'} user: ${userId}`);
            
            // Set the correct banned value in the request body
            const newBannedStatus = !currentBanStatus;
            
            // Make the API call with proper path and authorization
            const response = await api.patch(`/users/ban/${userId}`, { 
                banned: newBannedStatus 
            });
            
            console.log("Ban/unban response:", response);
            
            if (response.status === 200) {
                // Update the local state only after successful API response
                setResearchers(prevResearchers => prevResearchers.map(researcher => 
                    researcher._id === userId 
                        ? {...researcher, banned: newBannedStatus} 
                        : researcher
                ));
                
                setSuccessMessage(`User ${newBannedStatus ? 'banned' : 'unbanned'} successfully`);
                
                // Clear success message after 3 seconds
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                setError('Failed to update user status. Please try again.');
            }
        } catch (err) {
            console.error('Failed to update ban status:', err);
            setError('Failed to update user status. Please try again.');
        } finally {
            setBanActionLoading(false);
        }
    };

    return (
        <div className={styles.dashboard}>
            <h1>Admin Dashboard</h1>

            <div className={styles.searchContainer}>
                <SearchBar />
            </div>

            <div className={styles['linkBtns']}>
                <button className={styles['linkBtn']}>
                    <Link to={'/quizzes'}>
                        Quizzes
                    </Link>
                </button>
                <button className={styles['linkBtn']}>
                    <Link to={'/accounts'}>
                        Researchers
                    </Link>
                </button>
            </div>
            
            {successMessage && (
                <div className={styles['success-message']}>{successMessage}</div>
            )}
            
            {error && <div className={styles.error}>{error}</div>}

            {/* Analytics Section */}
            <div className={styles.section}>
                <div className={styles['section-header']}>
                    <h2>Platform Analytics</h2>
                    <button 
                        className={styles['refresh-button']} 
                        onClick={fetchAnalytics}
                    >
                        Refresh Data
                    </button>
                </div>
                
                {analytics && (
                    <div className={styles['analytics-grid']}>
                        <div className={styles['analytics-card']}>
                            <h3>Total Users</h3>
                            <p className={styles.value}>{analytics.userStats?.researchers || 0}</p>
                            <p className={styles['trend']}>Researchers</p>
                        </div>
                        
                        <div className={styles['analytics-card']}>
                            <h3>Total Quizzes</h3>
                            <p className={styles.value}>{analytics.quizStats?.total || 0}</p>
                            <p className={styles['trend']}>
                                <span className={styles['trend-up']}>
                                    +{analytics.newQuizzes || 0} this week
                                </span>
                            </p>
                        </div>
                        
                        <div className={styles['analytics-card']}>
                            <h3>Published Quizzes</h3>
                            <p className={styles.value}>{analytics.quizStats?.totalPublished || 0}</p>
                            <p className={styles['trend']}>
                                <span className={styles['trend-up']}>
                                    +{analytics.newPublishedQuizzes || 0} this week
                                </span>
                            </p>
                        </div>
                        
                        <div className={styles['analytics-card']}>
                            <h3>Weekly Visitors</h3>
                            <p className={styles.value}>
                                {analytics.visitorStats?.dailyVisitors?.reduce((sum, day) => sum + day.uniqueVisitors, 0) || 0}
                            </p>
                            <p className={styles['trend']}>Unique visitors</p>
                        </div>
                    </div>
                )}
                
                {platformLoad.length > 0 && (
                    <div className={styles['chart-container']}>
                        <h3>Platform Traffic (24h)</h3>
                        {/* Chart would go here - placeholder for now */}
                        <div style={{ 
                            display: 'flex', 
                            height: '200px',
                            alignItems: 'flex-end',
                            gap: '4px'
                        }}>
                            {platformLoad.map((hour, i) => (
                                <div 
                                    key={i} 
                                    style={{
                                        height: `${(hour.count / Math.max(...platformLoad.map(h => h.count))) * 100}%`,
                                        backgroundColor: '#4285F4',
                                        flex: '1',
                                        minWidth: '10px',
                                        borderRadius: '4px 4px 0 0'
                                    }}
                                    title={`Hour ${hour.hour}: ${hour.count} requests`}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
            
            {/* Researcher Requests Section */}
            <div className={styles.section}>
                <div className={styles['section-header']}>
                    <h2>Researcher Requests</h2>
                    <button 
                        className={styles['refresh-button']}
                        onClick={fetchRequests}
                    >
                        Refresh Requests
                    </button>
                </div>
                
                {loading && <LoaderAnimation />}
                
                {!loading && requests.length === 0 && (
                    <div className={styles['empty-state']}>
                        <p>No pending researcher requests at this time.</p>
                    </div>
                )}
                
                {!loading && requests.length > 0 && (
                    <ul className={styles['request-list']}>
                        {requests.map(request => (
                            <li key={request._id} className={styles['request-item']}>
                                <div className={styles['request-info']}>
                                    <h3>{request.researcherRequest.username}</h3>
                                    <p>{request.researcherRequest.email}</p>
                                    <p className={styles['request-date']}>
                                        Requested: {new Date(request.researcherRequest.requestDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className={styles['request-actions']}>
                                    <button
                                        className={styles['approve-button']}
                                        onClick={() => handleApprove(request._id)}
                                    >
                                        Approve
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            {/* Manage Researchers Section */}
            <div className={styles.section}>
                <div className={styles['section-header']}>
                    <h2>Manage Researchers</h2>
                    <button 
                        onClick={fetchResearchers}
                        className={styles['refresh-button']}
                        disabled={researcherLoading}
                    >
                        {researcherLoading ? 'Refreshing...' : 'Refresh List'}
                    </button>
                </div>
                
                {researcherError && <p className={styles.error}>{researcherError}</p>}
                
                {researcherLoading && <LoaderAnimation />}
                
                {!researcherLoading && researchers.length === 0 && (
                    <p>No researchers found.</p>
                )}
                
                {!researcherLoading && researchers.length > 0 && (
                    <table className={styles["researchers-table"]}>
                        <thead>
                            <tr>
                                <th>Username</th>
                                <th>Email</th>
                                <th>Status</th>
                                <th>Joined Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {researchers.map(researcher => (
                                <tr key={researcher._id} className={researcher.banned ? styles["banned-row"] : ''}>
                                    <td>{researcher.username}</td>
                                    <td>{researcher.email}</td>
                                    <td>
                                        <span className={researcher.banned ? styles["status-banned"] : styles["status-active"]}>
                                            {researcher.banned ? 'Banned' : 'Active'}
                                        </span>
                                    </td>
                                    <td>{new Date(researcher.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <button 
                                            className={researcher.banned ? styles["unban-button"] : styles["ban-button"]}
                                            onClick={() => handleBanToggle(researcher._id, researcher.banned)}
                                            disabled={banActionLoading}
                                        >
                                            {researcher.banned ? 'Unban' : 'Ban'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;