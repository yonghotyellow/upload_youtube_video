import React, { useState } from 'react';
import axios from 'axios';
import '../styles/UploadForm.css';
import PreviewItem from './PreviewItem';

const UploadForm = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [descriptions, setDescriptions] = useState([]);
    const [previewURLs, setPreviewURLs] = useState([]);

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setSelectedFiles(files);
        setPreviewURLs(files.map(file => URL.createObjectURL(file)));
    };

    const handleDescriptionChange = (index, event) => {
        const newDescriptions = [...descriptions];
        newDescriptions[index] = event.target.value;
        setDescriptions(newDescriptions);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);
        setSelectedFiles(files);
        setPreviewURLs(files.map(file => URL.createObjectURL(file)));
    };

    const handleDragOver = (event) => {
        event.preventDefault();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData();
        for (let i = 0; i < selectedFiles.length; i++) {
            formData.append('files', selectedFiles[i]);
            formData.append('descriptions', descriptions[i] || '');
        }
        try {
            await axios.post('/api/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Videos uploaded successfully');
        } catch (error) {
            console.error('Error uploading videos:', error);
            alert('Failed to upload videos');
        }
    };

    return (
        <div className="upload-form-container">
            <div
                className="upload-box"
                onClick={() => document.getElementById('fileInput').click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <div className="plus-sign">+</div>
                <div className="upload-text">Upload Media</div>
            </div>
            <input
                id="fileInput"
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            {previewURLs.length > 0 && (
                <div className="preview-container">
                    <div className="header">
                        <div className="column">Video</div>
                        <div className="column">Title</div>
                        <div className="column">Description</div>
                    </div>
                    {previewURLs.map((url, index) => (
                        <PreviewItem
                            key={index}
                            url={url}
                            name={selectedFiles[index].name}
                            description={descriptions[index] || ''}
                            onDescriptionChange={(event) => handleDescriptionChange(index, event)}
                        />
                    ))}
                </div>
            )}
            <form onSubmit={handleSubmit}>
                <button type="submit">Upload</button>
            </form>
        </div>
    );
};

export default UploadForm;
