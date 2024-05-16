import React from 'react';
import '../styles/UploadForm.css'; // Ensure this is pointing to the correct CSS file

const PreviewItem = ({ url, name, description, onDescriptionChange }) => {
    return (
        <div className="preview-item">
            <video src={url} controls width="300" height="500" />
            <div className="info-container">
                <div className="title">{name}</div>
                <input
                    type="text"
                    className="description"
                    placeholder="Description"
                    value={description}
                    onChange={onDescriptionChange}
                />
            </div>
        </div>
    );
};

export default PreviewItem;
