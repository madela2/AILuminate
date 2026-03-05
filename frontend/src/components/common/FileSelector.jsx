import { useState, useEffect } from 'react';
import api from '../../services/api';
import styles from './styles/FileSelector.module.css';

const FileSelector = ({ onFileSelect, fileType, selectedFile, multiple = false }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                setLoading(true);
                const response = await api.get('/files');
                
                // Filter files by type if specified
                let filteredFiles = response.data;
                if (fileType) {
                    filteredFiles = filteredFiles.filter(file => {
                        if (fileType === 'image') return file.mimetype.startsWith('image/');
                        if (fileType === 'audio') return file.mimetype.startsWith('audio/');
                        if (fileType === 'video') return file.mimetype.startsWith('video/');
                        return true;
                    });
                }
                
                setFiles(filteredFiles);
            } catch (err) {
                setError(`Failed to load files: ${err.response?.data?.message || err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, [fileType]);

    if (loading) return <p>Loading files...</p>;
    if (error) return <p className={styles.error}>{error}</p>;
    if (files.length === 0) return <p>No {fileType || ''} files available. Please upload some first.</p>;

    return (
        <div className={styles.fileSelectorContainer}>
            <h4>Select a file</h4>
            <div className={styles.fileGrid}>
                {files.map(file => (
                    <div 
                        key={file.id} 
                        className={`${styles.fileItem} ${
                            Array.isArray(selectedFile)
                                ? selectedFile.includes(file.url)
                                :selectedFile === file.url
                        ? styles.selected : ''}`}
                        onClick={() => {
                            if (multiple) {
                                // If already selected, remove it; otherwise add it
                                const newSelection = selectedFile.includes(file.url)
                                    ? selectedFile.filter(url => url !== file.url)
                                    : [...selectedFile, file.url];
                                onFileSelect(newSelection);
                            } else {
                                onFileSelect(file.url);
                            }
                        }}
                    >
                        {file.mimetype.startsWith('image/') ? (
                            <img 
                                src={`/uploads/${file.filename}`} 
                                alt={file.originalName} 
                                className={styles.filePreview} 
                            />
                        ) : file.mimetype.startsWith('video/') ? (
                            <div className={styles.videoPlaceholder}>
                                <span>Video</span>
                                <p>{file.originalName}</p>
                            </div>
                        ) : file.mimetype.startsWith('audio/') ? (
                            <div className={styles.audioPlaceholder}>
                                <span>Audio</span>
                                <p>{file.originalName}</p>
                            </div>
                        ) : (
                            <div className={styles.filePlaceholder}>
                                <span>File</span>
                                <p>{file.originalName}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FileSelector;