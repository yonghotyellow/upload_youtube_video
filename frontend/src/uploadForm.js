import React, { useState } from 'react';
import axios from 'axios';

const UploadForm = () => {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [descriptions, setDescriptions] = useState([]);

    const handleFileChange = (event) => {
        setSelectedFiles(event.target.files);
    };

    const handleDescriptionChange = (index, event) => {
        const newDescriptions = [...descriptions];
        newDescriptions[index] = event.target.value;
        setDescriptions(newDescriptions);
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
        <form onSubmit={handleSubmit}>
            <input type="file" multiple onChange={handleFileChange} />
            {Array.from(selectedFiles).map((file, index) => (
                <div key={index}>
                    <label>
                        {file.name}:
                        <input
                            type="text"
                            placeholder="Description"
                            value={descriptions[index] || ''}
                            onChange={(event) => handleDescriptionChange(index, event)}
                        />
                    </label>
                </div>
            ))}
            <button type="submit">Upload</button>
        </form>
    );
};

export default UploadForm;
