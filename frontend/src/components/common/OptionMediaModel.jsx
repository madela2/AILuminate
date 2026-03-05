import { useState } from 'react';
import FileSelector from './FileSelector';
import api from '../../services/api';
import styles from './styles/OptionMediaModul.module.css';

const OptionMediaModal = ({ isOpen, onClose, onSelect, currentMedia = [], optionIndex }) => {
    const [selectedMedia, setSelectedMedia] = useState(currentMedia);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    if (!isOpen) return null;
    
    const handleFileUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/files/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                }
            });
            
            // Add the new file to selected media
            setSelectedMedia(prev => [...prev, response.data.url]);
        } catch (err) {
            setError(`Failed to upload file: ${err.response?.data?.message || err.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleSave = () => {
        onSelect(optionIndex, selectedMedia);
        onClose();
    };

    const handleRemoveMedia = (mediaUrl) => {
        setSelectedMedia(prev => prev.filter(url => url !== mediaUrl));
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>Add Media to Option {optionIndex + 1}</h3>
                    <button onClick={onClose} className={styles.closeButton}>×</button>
                </div>

                <div className={styles.modalBody}>
                    {/* Upload new file */}
                    <div className={styles.fileUploadSection}>
                        <h4>Upload New File</h4>
                        <input
                            type="file"
                            onChange={handleFileUpload}
                            disabled={uploading}
                            className={styles.fileInput}
                        />
                        {uploading && (
                            <div className={styles.progressBarContainer}>
                                <div 
                                    className={styles.progressBar}
                                    style={{ width: `${uploadProgress}%` }}
                                ></div>
                                <span className={styles.progressText}>{uploadProgress}%</span>
                            </div>
                        )}
                    </div>

                    {/* Select from existing */}
                    <div className={styles.fileSelectorSection}>
                        <h4>Or Select Existing Files</h4>
                        <FileSelector
                            onFileSelect={(urls) => setSelectedMedia(Array.isArray(urls) ? urls : [urls])}
                            selectedFile={selectedMedia}
                            multiple={true}
                        />
                    </div>

                    {/* Selected media preview */}
                    {selectedMedia.length > 0 && (
                        <div className={styles.selectedMediaSection}>
                            <h4>Selected Media</h4>
                            <div className={styles.selectedMediaGrid}>
                                {selectedMedia.map((url, index) => (
                                    <div key={index} className={styles.mediaItem}>
                                        {url.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                            <img src={url} alt={`Selected ${index}`} className={styles.mediaPreview} />
                                        ) : url.match(/\.(mp4|webm|ogg)$/i) ? (
                                            <div className={styles.videoPreview}>Video: {url.split('/').pop()}</div>
                                        ) : url.match(/\.(mp3|wav)$/i) ? (
                                            <div className={styles.audioPreview}>Audio: {url.split('/').pop()}</div>
                                        ) : (
                                            <div className={styles.filePreview}>File: {url.split('/').pop()}</div>
                                        )}
                                        <button 
                                            onClick={() => handleRemoveMedia(url)}
                                            className={styles.removeMediaButton}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && <div className={styles.error}>{error}</div>}
                </div>

                <div className={styles.modalFooter}>
                    <button onClick={onClose} className={styles.cancelButton}>Cancel</button>
                    <button onClick={handleSave} className={styles.saveButton}>Save</button>
                </div>
            </div>
        </div>
    );
};

export default OptionMediaModal;