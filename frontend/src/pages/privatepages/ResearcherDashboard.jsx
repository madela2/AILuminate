import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import styles from './styles/ResearcherDashboard.module.css';
import LoaderAnimation from '../../components/common/LoadingAnitmation.jsx';

const ResearcherDashboard = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState({
        quizzes: true,
        files: true,
        fileUpload: false
    });
    const [error, setError] = useState({
        quizzes: '',
        files: ''
    });
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchQuizzes = async () => {
            try {
                const response = await api.get('/quizzes');
                setQuizzes(response.data);
                setError(prev => ({ ...prev, quizzes: '' }));
            } catch (err) {
                setError(prev => ({ 
                    ...prev, 
                    quizzes: `Failed to load quizzes: ${err.response?.data?.message || err.message}` 
                }));
            } finally {
                setLoading(prev => ({ ...prev, quizzes: false }));
            }
        };

        const fetchFiles = async () => {
            try {
                const response = await api.get('/files');
                setFiles(response.data);
                setError(prev => ({ ...prev, files: '' }));
            } catch (err) {
                setError(prev => ({ 
                    ...prev, 
                    files: `Failed to load files: ${err.response?.data?.message || err.message}` 
                }));
            } finally {
                setLoading(prev => ({ ...prev, files: false }));
            }
        };

        fetchQuizzes();
        fetchFiles();
    }, []);

    const handleStatusChange = async (quizId, newStatus) => {
        try {
            await api.put(`/quizzes/${quizId}`, { status: newStatus });
            
            // Update the quiz status in the state
            setQuizzes(quizzes.map(quiz => 
                quiz._id === quizId ? { ...quiz, status: newStatus } : quiz
            ));
        } catch (err) {
            setError(prev => ({ 
                ...prev, 
                quizzes: `Failed to update quiz status: ${err.response?.data?.message || err.message}` 
            }));
        }
    };

    // Helper function to format file sizes
    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };
    
    // File upload handler
    const handleFileUpload = async (event) => {
        if (!event.target.files || event.target.files.length === 0) return;
        
        setLoading(prev => ({...prev, fileUpload: true}));
        const files = Array.from(event.target.files);
        let uploadedFiles = [];
        
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await api.post('/files/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                });
                
                uploadedFiles.push(response.data);
            }
            
            // Add all new files to the list
            setFiles(prev => [...prev, ...uploadedFiles]);
            
            // Show success message
            setSuccess(`${uploadedFiles.length} file(s) uploaded successfully!`);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(prev => ({
                ...prev,
                files: `Failed to upload file(s): ${err.response?.data?.message || err.message}`
            }));
        } finally {
            setLoading(prev => ({ ...prev, fileUpload: false }));
        }
    };

    // File delete handler (to be implemented)
    const handleDeleteFile = async (fileId) => {
        try {
            const response = await api.delete(`/files/${fileId}`);

            // Remove the file from the list
            setFiles(prev => prev.filter(file => file.id !== fileId));

            // Show success message with info about affected questions
            const affectedQuestions = response.data.affectedQuestions || 0;
            const message = `File deleted successfully. ${affectedQuestions > 0 ?
                `${affectedQuestions} question(s) using this file were also deleted.` : ''}`;
            
            setSuccess(message);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(prev => ({
                ...prev,
                files: `Failed to delete file: ${err.response?.data?.message || err.message}`
            }));
        }
    };

    return (
        <div className={styles['dashboard-container']}>
            <h1>Researcher Dashboard</h1>
            
            <section className={styles['dashboard-section']}>
                <div className={styles['section-header']}>
                    <h2>My Quizzes</h2>
                    <Link 
                        to="/researcher/quizzes/create" 
                        className={styles['create-button']}
                    >
                        Create New Quiz
                    </Link>
                </div>
                
                {loading.quizzes ? (
                    <LoaderAnimation />
                ) : error.quizzes ? (
                    <p className={styles['error-message']}>{error.quizzes}</p>
                ) : quizzes.length === 0 ? (
                    <p>You haven't created any quizzes yet.</p>
                ) : (
                    <div className={styles['quiz-list']}>
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
            </section>
            
            <section className={styles['dashboard-section']}>
                <div className={styles['section-header']}>
                    <h2>My Files</h2>
                    <label className={styles['upload-button']}>
                        Upload File
                        <input 
                            type="file" 
                            hidden
                            multiple
                            onChange={handleFileUpload}
                        />
                    </label>
                </div>
                
                {loading.files ? (
                    <p>Loading files...</p>
                ) : error.files ? (
                    <p className={styles['error-message']}>{error.files}</p>
                ) : files.length === 0 ? (
                    <p>You haven't uploaded any files yet.</p>
                ) : (
                    <div className={styles['file-list']}>
                        <table className={styles['file-table']}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Size</th>
                                    <th>Uploaded</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {files.map(file => (
                                    <tr key={file.id}>
                                        <td>
                                            <a 
                                                href={file.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                            >
                                                {file.originalName}
                                            </a>
                                        </td>
                                        <td>{file.mimetype}</td>
                                        <td>{formatFileSize(file.size)}</td>
                                        <td>{new Date(file.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <button
                                                onClick={() => handleDeleteFile(file.id)}
                                                className={styles['delete-button']}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default ResearcherDashboard;