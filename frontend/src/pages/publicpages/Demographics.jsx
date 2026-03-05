import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import styles from './styles/Demographics.module.css';

const Demographics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const answers = location.state?.answers || [];
    const sessionId = location.state?.sessionId;
    
    const [email, setEmail] = useState('');
    const [ageGroup, setAgeGroup] = useState('');
    const [gender, setGender] = useState('');
    const [aiExperience, setAiExperience] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    const visitorId = localStorage.getItem('visitorId');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!ageGroup || !gender || !aiExperience) {
            setError('Please fill out all demographic fields');
            return;
        }
        
        setLoading(true);
        
        try {
            // First submit the quiz answers
            const answerResponse = await axios.post(`/api/public/quizzes/${id}/submit`, {
                answers,
                visitorId
            }, { withCredentials: true });
            
            const { attemptId, visitorId: responseVisitorId } = answerResponse.data;
            
            // Then submit demographics
            await axios.post('/api/public/demographics', {
                attemptId,
                visitorId: responseVisitorId,
                email,
                ageGroup,
                gender,
                aiExperience,
                quizId: id
            }, { withCredentials: true });
            
            // Navigate to results page
            navigate(`/quizzes/${id}/results`, {
                state: { attemptId, email }
            });
        } catch (err) {
            console.error('Error submitting demographics:', err);
            console.error('Error details:', err.response?.data);
            setError(`Failed to submit: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };
    
    if (!answers.length) {
        return (
            <div className={styles.errorContainer}>
                <p>No quiz data found. Please start a new quiz.</p>
                <button onClick={() => navigate('/')}>Return to Home</button>
            </div>
        );
    }
    
    return (
        <div className={styles.demographicsContainer}>
            <h1>Just a Few More Questions</h1>
            <p>Help us understand our audience by providing some demographic information.</p>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                    <label>Email (optional, for receiving results)</label>
                    <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your.email@example.com"
                    />
                </div>
                
                <div className={styles.formGroup}>
                    <label>Age Group</label>
                    <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} required>
                        <option value="">Select an age group</option>
                        <option value="Under 18">Under 18</option>
                        <option value="18-24">18-24</option>
                        <option value="25-34">25-34</option>
                        <option value="35-44">35-44</option>
                        <option value="45-54">45-54</option>
                        <option value="55-64">55-64</option>
                        <option value="65+">65+</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                </div>
                
                <div className={styles.formGroup}>
                    <label>Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} required>
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Non-binary">Non-binary</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                </div>
                
                <div className={styles.formGroup}>
                    <label>Familiarity with AI</label>
                    <select value={aiExperience} onChange={(e) => setAiExperience(e.target.value)} required>
                        <option value="">Select familiarity level</option>
                        <option value="Novice">Novice - little to no experience</option>
                        <option value="Beginner">Beginner - basic understanding</option>
                        <option value="Intermediate">Intermediate - regular user</option>
                        <option value="Advanced">Advanced - technical knowledge</option>
                        <option value="Expert">Expert - professional in the field</option>
                    </select>
                </div>
                
                <button 
                    type="submit" 
                    className={styles.submitButton} 
                    disabled={loading}
                >
                    {loading ? 'Submitting...' : 'Submit and View Results'}
                </button>
            </form>
        </div>
    );
};

export default Demographics;