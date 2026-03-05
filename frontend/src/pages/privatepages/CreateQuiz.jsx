import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import FileSelector from '../../components/common/FileSelector';
import OptionMediaModal from '../../components/common/OptionMediaModel';
import LoaderAnimation from '../../components/common/LoadingAnitmation';
import styles from './styles/CreateQuiz.module.css';

const CreateQuiz = () => {
    const navigate = useNavigate();
    const { quizId } = useParams();
    const isEditMode = !!quizId;
    const fileInputRef = useRef(null);

    // State variables
    const [isLoading, setIsLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [deleteQuestionIds, setDeletedQuestionIds] = useState([]);
    const [isOptionMediaModalOpen, setIsOptionMediaModalOpen] = useState(false);
    const [editingOptionIndex, setEditingOptionIndex] = useState(null);
    const [editingQuestionId, setEditingQuestionId] = useState(null);
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [savedQuizId, setSavedQuizId] = useState(null);
    
    // Quiz data
    const [quizData, setQuizData] = useState({ title: '', description: '' });
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState({
        type: 'text',
        content: '',
        options: ['', ''],
        correctIndex: 0,
        explanation: '',
        mediaUrls: '',
        optionMedia: {}
    });

    // Fetch quiz data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            fetchQuizData();
        }
    }, [isEditMode, quizId]);

    // Auto-save quiz after period of inactivity
    useEffect(() => {
        if (!quizData.title || isLoading) return;
        
        const saveTimer = setTimeout(() => {
            if (isEditMode || questions.length > 0) {
                console.log('Auto-saving quiz...');
                saveQuizDraft();
            }
        }, 30000); // Auto-save after 30 seconds of inactivity
        
        return () => clearTimeout(saveTimer);
    }, [quizData, questions]);

    const fetchQuizData = async () => {
        try {
            setIsLoading(true);
            const quizRes = await api.get(`/quizzes/${quizId}`);
            const questionsRes = await api.get(`/questions?quizId=${quizId}`);

            const { title, description } = quizRes.data;
            setQuizData({ title, description });
            setQuestions(questionsRes.data);
        } catch (err) {
            setError(`Failed to fetch quiz: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Form change handlers
    const handleQuizChange = (e) => {
        const { name, value } = e.target;
        setQuizData(prev => ({ ...prev, [name]: value }));
    };

    const handleQuestionChange = (e) => {
        const { name, value } = e.target;
        setCurrentQuestion(prev => ({ ...prev, [name]: value }));
    };

    // Media handlers
    const handleMediaSelect = (url) => {
        const newMediaUrls = Array.isArray(url) ? url : [url];
        setCurrentQuestion(prev => ({ ...prev, mediaUrls: newMediaUrls }));
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/files/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                }
            });
            
            setSuccess(`File uploaded successfully!`);
            
            if (currentQuestion.type !== 'text') {
                handleMediaSelect(response.data.url);
            }
            
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setError(`Upload failed: ${err.response?.data?.message || err.message}`);
        } finally {
            setUploading(false);
        }
    };

    // Option handlers
    const handleOptionChange = (index, value) => {
        const newOptions = [...currentQuestion.options];
        newOptions[index] = value;
        setCurrentQuestion(prev => ({ ...prev, options: newOptions }));
    };

    const addOption = () => {
        if (currentQuestion.options.length < 6) {
            setCurrentQuestion(prev => ({
                ...prev,
                options: [...prev.options, '']
            }));
        }
    };

    const removeOption = (index) => {
        if (currentQuestion.options.length > 2) {
            const newOptions = [...currentQuestion.options];
            newOptions.splice(index, 1);
            
            let newCorrectIndex = currentQuestion.correctIndex;
            if (index === currentQuestion.correctIndex) {
                newCorrectIndex = 0;
            } else if (index < currentQuestion.correctIndex) {
                newCorrectIndex--;
            }

            const newOptionMedia = { ...currentQuestion.optionMedia };
            delete newOptionMedia[index];
            
            setCurrentQuestion(prev => ({
                ...prev,
                options: newOptions,
                correctIndex: newCorrectIndex,
                optionMedia: newOptionMedia
            }));
        }
    };

    const handleOptionMediaSelect = (optionIndex, mediaUrls) => {
        setCurrentQuestion(prev => {
            const newOptionMedia = { ...prev.optionMedia };
            if (mediaUrls.length > 0) {
                newOptionMedia[optionIndex] = mediaUrls;
            } else {
                delete newOptionMedia[optionIndex];
            }
            return { ...prev, optionMedia: newOptionMedia };
        });
    };

    const handleEditOptionMedia = (optionIndex) => {
        setEditingOptionIndex(optionIndex);
        setIsOptionMediaModalOpen(true);
    };

    const setCorrectAnswer = (index) => {
        setCurrentQuestion(prev => ({ ...prev, correctIndex: index }));
    };

    // Question management
    const addQuestion = () => {
        if (!validateQuestion()) return;

        setQuestions(prev => [...prev, { 
            ...currentQuestion, 
            id: Date.now(),
            optionMedia: { ...currentQuestion.optionMedia }
        }]);
        
        resetQuestionForm();
        setShowQuestionForm(false);
        setError('');
    };

    const editQuestion = (id) => {
        const question = questions.find(q => q._id === id);
        if (question) {
            setCurrentQuestion({...question});
            setEditingQuestionId(id);
            setShowQuestionForm(true);
        }
    };

    const updateQuestion = () => {
        if (!validateQuestion()) return;

        setQuestions(questions.map(q => 
            q._id === editingQuestionId ? {...currentQuestion, _id: editingQuestionId} : q
        ));
        
        resetQuestionForm();
        setEditingQuestionId(null);
        setShowQuestionForm(false);
    };

    const cancelEdit = () => {
        resetQuestionForm();
        setEditingQuestionId(null);
        setShowQuestionForm(false);
    };

    const resetQuestionForm = () => {
        setCurrentQuestion({
            type: 'text',
            content: '',
            options: ['', ''],
            correctIndex: 0,
            explanation: '',
            mediaUrls: '',
            optionMedia: {}
        });
    };

    const removeQuestion = (id) => {
        if (window.confirm('Are you sure you want to remove this question?')) {
            // If the question has an _id, mark it for deletion from backend
            const question = questions.find(q => q._id === id);
            if (question && question._id) {
                setDeletedQuestionIds(prev => [...prev, question._id]);
            }
            
            setQuestions(questions.filter(q => q._id !== id));
        }
    };

    // Quiz actions
    const saveQuizDraft = async () => {
        console.log("Save as draft button clicked"); // Debug
        
        if (!quizData.title.trim()) {
            setError('Quiz title is required');
            return;
        }
        
        try {
            setIsLoading(true);
            setError('');
            
            let currentQuizId = quizId;
            let promises = [];

            console.log("About to save quiz:", isEditMode ? "update" : "create", quizData); // Debug

            if (isEditMode) {
                // Update existing quiz
                const quizResponse = await api.patch(`/quizzes/${quizId}`, {
                    title: quizData.title,
                    description: quizData.description,
                    status: 'draft'
                });
                
                console.log("Quiz update response:", quizResponse.data); // Debug
                
                currentQuizId = quizResponse.data._id || quizId;
                
                // Handle question updates
                await updateQuizQuestions(currentQuizId);
            } else {
                // Create new quiz
                const quizResponse = await api.post('/quizzes', {
                    title: quizData.title,
                    description: quizData.description,
                    status: 'draft'
                });
                
                console.log("Quiz create response:", quizResponse.data); // Debug
                
                currentQuizId = quizResponse.data._id;
                
                // Create questions for new quiz
                for (const question of questions) {
                    promises.push(api.post('/questions', {
                        quizId: currentQuizId,
                        type: question.type,
                        content: question.content,
                        options: question.options,
                        correctIndex: question.correctIndex,
                        explanation: question.explanation,
                        mediaUrls: question.mediaUrls,
                        optionMedia: question.optionMedia
                    }));
                }
                
                await Promise.all(promises);
            }

            setLastSaved(new Date());
            setSavedQuizId(currentQuizId);
            setSuccess('Quiz draft saved successfully!');
            setShowSuccess(true);

            // Auto-hide success message after 5 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 5000);
            
            // If it's a new quiz, navigate to the edit page
            if (!isEditMode) {
                navigate(`/researcher/quizzes/${currentQuizId}/edit`);
            }
        } catch (err) {
            console.error("Error saving draft:", err); // Debug
            setError(`Failed to save: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const publishQuiz = async () => {
        if (!validateQuiz()) return;
        
        try {
            setIsLoading(true);
            setError('');

            let currentQuizId = quizId;

            if (isEditMode) {
                // Update quiz with published status
                const quizResponse = await api.patch(`/quizzes/${quizId}`, {
                    title: quizData.title,
                    description: quizData.description,
                    status: 'published'
                });
                
                currentQuizId = quizResponse.data._id || quizId;
                
                // Handle question updates
                await updateQuizQuestions(currentQuizId);
            } else {
                // Create new published quiz
                const quizResponse = await api.post('/quizzes', {
                    title: quizData.title,
                    description: quizData.description,
                    status: 'published'
                });
                
                currentQuizId = quizResponse.data._id;
                
                // Create questions
                for (const question of questions) {
                    await api.post('/questions', {
                        quizId: currentQuizId,
                        type: question.type,
                        content: question.content,
                        options: question.options,
                        correctIndex: question.correctIndex,
                        explanation: question.explanation,
                        mediaUrls: question.mediaUrls,
                        optionMedia: question.optionMedia
                    });
                }
            }

            setSuccess('Quiz published successfully!');
            
            // Navigate to the quiz detail page
            setTimeout(() => {
                navigate(`/researcher/quizzes/${currentQuizId}`);
            }, 1000);
        } catch (err) {
            setError(`Failed to publish: ${err.response?.data?.message || err.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper methods
    const updateQuizQuestions = async (currentQuizId) => {
        let promises = [];

        // Delete removed questions
        for (const deletedId of deleteQuestionIds) {
            promises.push(api.delete(`/questions/${deletedId}`).catch(err => 
                console.error(`Failed to delete question ${deletedId}:`, err)
            ));
        }

        // Update or create questions
        for (const question of questions) {
            if (question._id) {
                // Update existing question
                promises.push(api.patch(`/questions/${question._id}`, {
                    quiz: currentQuizId,
                    type: question.type,
                    content: question.content,
                    options: question.options,
                    correctIndex: question.correctIndex,
                    explanation: question.explanation,
                    mediaUrls: question.mediaUrls,
                    optionMedia: question.optionMedia
                }));
            } else {
                // Create new question
                promises.push(api.post('/questions', {
                    quizId: currentQuizId,
                    type: question.type,
                    content: question.content,
                    options: question.options,
                    correctIndex: question.correctIndex,
                    explanation: question.explanation,
                    mediaUrls: question.mediaUrls,
                    optionMedia: question.optionMedia
                }));
            }
        }
        
        // Wait for all operations to complete
        const results = await Promise.allSettled(promises);
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            console.error("Failed operations:", failures);
            setError(`${failures.length} operation(s) failed. See console for details.`);
        }
        
        // Clear deleted question IDs
        setDeletedQuestionIds([]);
    };

    const validateQuestion = () => {
        if (!currentQuestion.content.trim()) {
            setError('Question content is required');
            return false;
        }

        if (currentQuestion.options.some(opt => !opt.trim())) {
            setError('All options must have content');
            return false;
        }

        if (currentQuestion.type !== 'text' && !currentQuestion.mediaUrls) {
            setError('Media URL is required for non-text questions');
            return false;
        }

        return true;
    };

    const validateQuiz = () => {
        if (!quizData.title.trim()) {
            setError('Quiz title is required');
            return false;
        }
        
        if (questions.length === 0) {
            setError('Quiz must have at least one question');
            return false;
        }
        
        return true;
    };

    // Rendering
    return (
        <div className={styles.quizCreator}>
            <h1>{isEditMode ? 'Edit Quiz' : 'Create New Quiz'}</h1>

            {/* Quiz metadata form */}
            <div className={styles.metadataForm}>
                <div className={styles.formGroup}>
                    <label>Quiz Title</label>
                    <input
                        type="text"
                        name="title"
                        value={quizData.title}
                        onChange={handleQuizChange}
                        placeholder="Enter quiz title"
                        required
                    />
                </div>
                
                <div className={styles.formGroup}>
                    <label>Description</label>
                    <textarea
                        name="description"
                        value={quizData.description}
                        onChange={handleQuizChange}
                        placeholder="Enter quiz description"
                        rows="3"
                    />
                </div>
            </div>

            {/* Questions section */}
            <div className={styles.questionsSection}>
                <h2>Questions ({questions.length})</h2>
                
                {questions.length > 0 && (
                    <div className={styles.questionsList}>
                        {questions.map((question, index) => (
                            <div key={question._id || index} className={styles.questionItem}>
                                {editingQuestionId === question._id ? (
                                    // In-place edit form
                                    <div className={styles.questionForm}>
                                        <h3>Edit Question {index + 1}</h3>
                                        
                                        <div className={styles.formGroup}>
                                            <label>Question Type</label>
                                            <select
                                                name="type"
                                                value={currentQuestion.type}
                                                onChange={handleQuestionChange}
                                            >
                                                <option value="text">Text Only</option>
                                                <option value="image">Image Based</option>
                                                <option value="audio">Audio Based</option>
                                                <option value="video">Video Based</option>
                                            </select>
                                        </div>
                                        
                                        <div className={styles.formGroup}>
                                            <label>Question Content</label>
                                            <textarea
                                                name="content"
                                                value={currentQuestion.content}
                                                onChange={handleQuestionChange}
                                                placeholder="Enter question text"
                                                required
                                            />
                                        </div>
                                        
                                        {currentQuestion.type !== 'text' && (
                                            <div className={styles.formGroup}>
                                                <label>Media File</label>
                                                <div className={styles.fileUploadContainer}>
                                                    <input
                                                        type="file"
                                                        onChange={handleFileUpload}
                                                        ref={fileInputRef}
                                                        disabled={uploading}
                                                    />
                                                    {uploading && (
                                                        <div className={styles.progressBar}>
                                                            <div 
                                                                className={styles.progressBarFill}
                                                                style={{ width: `${uploadProgress}%` }}
                                                            ></div>
                                                            <span>{uploadProgress}%</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.selectedMedia}>
                                                    <FileSelector
                                                        onFileSelect={handleMediaSelect}
                                                        selectedFile={currentQuestion.mediaUrls}
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        
                                        <div className={styles.formGroup}>
                                            <label>Answer Options</label>
                                            {currentQuestion.options.map((option, idx) => (
                                                <div key={idx} className={styles.optionRow}>
                                                    <input
                                                        type="radio"
                                                        checked={currentQuestion.correctIndex === idx}
                                                        onChange={() => setCorrectAnswer(idx)}
                                                    />
                                                    <input
                                                        type="text"
                                                        value={option}
                                                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                                                        placeholder={`Option ${idx + 1}`}
                                                        required
                                                    />
                                                    
                                                    {/* Media preview area */}
                                                    {currentQuestion.optionMedia[idx] && currentQuestion.optionMedia[idx].length > 0 && (
                                                        <div className={styles.optionMediaContainer}>
                                                            <div className={styles.optionMediaPreview}>
                                                                {currentQuestion.optionMedia[idx][0].match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                                    <img 
                                                                        src={currentQuestion.optionMedia[idx][0]} 
                                                                        alt="Option media" 
                                                                        className={styles.mediaPreviewSmall} 
                                                                    />
                                                                ) : currentQuestion.optionMedia[idx][0].match(/\.(mp4|webm)$/i) ? (
                                                                    <div className={styles.mediaFileIndicator}>
                                                                        <span>🎬</span>
                                                                    </div>
                                                                ) : currentQuestion.optionMedia[idx][0].match(/\.(mp3|wav)$/i) ? (
                                                                    <div className={styles.mediaFileIndicator}>
                                                                        <span>🎵</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className={styles.mediaFileIndicator}>
                                                                        <span>📄</span>
                                                                    </div>
                                                                )}
                                                                <span className={styles.mediaName}>
                                                                    {currentQuestion.optionMedia[idx][0].split('/').pop().substring(0, 15)}
                                                                    {currentQuestion.optionMedia[idx][0].split('/').pop().length > 15 ? '...' : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                    
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditOptionMedia(idx)}
                                                        className={styles.mediaButton}
                                                    >
                                                        {currentQuestion.optionMedia[idx] && currentQuestion.optionMedia[idx].length > 0 
                                                            ? 'Change Media' 
                                                            : 'Add Media'
                                                        }
                                                    </button>
                                                    
                                                    {currentQuestion.options.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeOption(idx)}
                                                            className={styles.removeButton}
                                                        >
                                                            Remove
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                            
                                            {currentQuestion.options.length < 6 && (
                                                <button
                                                    type="button"
                                                    onClick={addOption}
                                                    className={styles.addOptionButton}
                                                >
                                                    Add Option
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className={styles.formGroup}>
                                            <label>Explanation (shown after answering)</label>
                                            <textarea
                                                name="explanation"
                                                value={currentQuestion.explanation}
                                                onChange={handleQuestionChange}
                                                placeholder="Explain why the correct answer is right"
                                            />
                                        </div>
                                        
                                        <div className={styles.questionFormButtons}>
                                            <button onClick={updateQuestion} className={styles.saveButton}>
                                                Update Question
                                            </button>
                                            <button onClick={cancelEdit} className={styles.cancelButton}>
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    // Normal question display
                                    <>
                                        <div className={styles.questionHeader}>
                                            <h3>Question {index + 1}</h3>
                                            <div className={styles.questionActions}>
                                                <button 
                                                    onClick={() => editQuestion(question._id)}
                                                    className={styles.editButton}
                                                >
                                                    Edit
                                                </button>
                                                <button 
                                                    onClick={() => removeQuestion(question._id)}
                                                    className={styles.deleteButton}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        <div className={styles.questionPreview}>
                                            <p><strong>Type:</strong> {question.type}</p>
                                            <p><strong>Content:</strong> {question.content}</p>
                                            <p><strong>Options:</strong> {question.options.join(', ')}</p>
                                            <p><strong>Correct Answer:</strong> {question.options[question.correctIndex]}</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
                
                {!showQuestionForm && !editingQuestionId && (
                    <button 
                        className={styles.addQuestionButton}
                        onClick={() => setShowQuestionForm(true)}
                    >
                        Add New Question
                    </button>
                )}
            </div>

            {/* Question form (conditionally shown) - only for adding new questions */}
            {showQuestionForm && !editingQuestionId && (
                <div className={styles.questionForm}>
                    <h3>Add New Question</h3>
                    
                    <div className={styles.formGroup}>
                        <label>Question Type</label>
                        <select
                            name="type"
                            value={currentQuestion.type}
                            onChange={handleQuestionChange}
                        >
                            <option value="text">Text Only</option>
                            <option value="image">Image Based</option>
                            <option value="audio">Audio Based</option>
                            <option value="video">Video Based</option>
                        </select>
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label>Question Content</label>
                        <textarea
                            name="content"
                            value={currentQuestion.content}
                            onChange={handleQuestionChange}
                            placeholder="Enter question text"
                            required
                        />
                    </div>
                    
                    {currentQuestion.type !== 'text' && (
                        <div className={styles.formGroup}>
                            <label>Media File</label>
                            <div className={styles.fileUploadContainer}>
                                <input
                                    type="file"
                                    onChange={handleFileUpload}
                                    ref={fileInputRef}
                                    disabled={uploading}
                                />
                                {uploading && (
                                    <div className={styles.progressBar}>
                                        <div 
                                            className={styles.progressBarFill}
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                )}
                            </div>
                            <div className={styles.selectedMedia}>
                                <FileSelector
                                    onFileSelect={handleMediaSelect}
                                    selectedFile={currentQuestion.mediaUrls}
                                />
                            </div>
                        </div>
                    )}
                    
                    <div className={styles.formGroup}>
                        <label>Answer Options</label>
                        {currentQuestion.options.map((option, index) => (
                            <div key={index} className={styles.optionRow}>
                                <div className={styles.correctAnswerSelector}>
                                    <input
                                        type="radio"
                                        id={`option-${index}`}
                                        checked={currentQuestion.correctIndex === index}
                                        onChange={() => setCorrectAnswer(index)}
                                    />
                                    <label htmlFor={`option-${index}`}>
                                        {currentQuestion.correctIndex === index ? 
                                            <span className={styles.correctLabel}>✓ Correct Answer</span> : 
                                            "Set as correct"}
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => handleOptionChange(index, e.target.value)}
                                    placeholder={`Option ${index + 1}`}
                                    required
                                    className={currentQuestion.correctIndex === index ? styles.correctOption : ''}
                                />
                                
                                {/* Add media preview here */}
                                {currentQuestion.optionMedia[index] && currentQuestion.optionMedia[index].length > 0 && (
                                    <div className={styles.optionMediaContainer}>
                                        <div className={styles.optionMediaPreview}>
                                            {currentQuestion.optionMedia[index][0].match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                <img 
                                                    src={currentQuestion.optionMedia[index][0]} 
                                                    alt="Option media" 
                                                    className={styles.mediaPreviewSmall} 
                                                />
                                            ) : currentQuestion.optionMedia[index][0].match(/\.(mp4|webm)$/i) ? (
                                                <div className={styles.mediaFileIndicator}>
                                                    <span>🎬</span>
                                                </div>
                                            ) : currentQuestion.optionMedia[index][0].match(/\.(mp3|wav)$/i) ? (
                                                <div className={styles.mediaFileIndicator}>
                                                    <span>🎵</span>
                                                </div>
                                            ) : (
                                                <div className={styles.mediaFileIndicator}>
                                                    <span>📄</span>
                                                </div>
                                            )}
                                            <span className={styles.mediaName}>
                                                {currentQuestion.optionMedia[index][0].split('/').pop().substring(0, 15)}
                                                {currentQuestion.optionMedia[index][0].split('/').pop().length > 15 ? '...' : ''}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                <button
                                    type="button"
                                    onClick={() => handleEditOptionMedia(index)}
                                    className={styles.mediaButton}
                                >
                                    {currentQuestion.optionMedia[index] && currentQuestion.optionMedia[index].length > 0 
                                        ? 'Change Media' 
                                        : 'Add Media'
                                    }
                                </button>
                                {currentQuestion.options.length > 2 && (
                                    <button
                                        type="button"
                                        onClick={() => removeOption(index)}
                                        className={styles.removeButton}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        ))}
                        
                        {currentQuestion.options.length < 6 && (
                            <button
                                type="button"
                                onClick={addOption}
                                className={styles.addOptionButton}
                            >
                                Add Option
                            </button>
                        )}
                    </div>
                    
                    <div className={styles.formGroup}>
                        <label>Explanation (shown after answering)</label>
                        <textarea
                            name="explanation"
                            value={currentQuestion.explanation}
                            onChange={handleQuestionChange}
                            placeholder="Explain why the correct answer is right"
                        />
                    </div>
                    
                    <div className={styles.questionFormButtons}>
                        <button onClick={addQuestion} className={styles.saveButton}>
                            Add Question
                        </button>
                        <button onClick={() => setShowQuestionForm(false)} className={styles.cancelButton}>
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Option media modal */}
            {isOptionMediaModalOpen && (
                <OptionMediaModal
                    isOpen={isOptionMediaModalOpen}
                    onClose={() => setIsOptionMediaModalOpen(false)}
                    onSelect={handleOptionMediaSelect}
                    currentMedia={currentQuestion.optionMedia[editingOptionIndex] || []}
                    optionIndex={editingOptionIndex}
                />
            )}

            {/* Notifications */}
            <div className={styles.notificationArea}>
                {error && <div className={styles.error}>{error}</div>}
                
                {showSuccess && (
                    <div className={styles.successContainer}>
                        <div className={styles.success}>{success}</div>
                    </div>
                )}

                {lastSaved && !showSuccess && (
                    <div className={styles.lastSaved}>
                        Last auto-saved: {lastSaved.toLocaleTimeString()}
                    </div>
                )}
                
                {isLoading && <LoaderAnimation />}
            </div>

            {/* Always visible navigation links */}
            <div className={styles.navigationLinks}>
                <Link to="/researcher/dashboard" className={styles.navButton}>
                    Back to Dashboard
                </Link>
                {(savedQuizId || quizId) && (
                    <Link to={`/researcher/quizzes/${savedQuizId || quizId}`} className={styles.navButton}>
                        View Quiz Analytics
                    </Link>
                )}
            </div>
            
            {/* Quiz action buttons */}
            <div className={styles.quizActionButtons}>
                <div className={styles.buttonGroup}>
                    <button
                        onClick={saveQuizDraft}
                        disabled={isLoading}
                        className={styles.draftButton}
                    >
                        {isLoading ? 'Saving...' : 'Save as Draft'}
                    </button>
                    {isLoading && <div className={styles.inlineLoader}><LoaderAnimation /></div>}
                </div>
                
                <button
                    onClick={publishQuiz}
                    disabled={isLoading}
                    className={styles.publishButton}
                >
                    {isEditMode ? 'Update & Publish' : 'Publish Quiz'}
                </button>
            </div>
        </div>
    );
};

export default CreateQuiz;