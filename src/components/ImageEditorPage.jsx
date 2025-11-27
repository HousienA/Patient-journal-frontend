import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageEditor from './ImageEditor'; // Se till att sökvägen stämmer

export default function ImageEditorPage() {
    const { imageId } = useParams(); // Hämtar ID från URLen /images/:imageId/edit
    const navigate = useNavigate();

    return (
        <div className="image-editor-page" style={{ padding: '20px' }}>
            <button onClick={() => navigate(-1)} className="btn-back" style={{ marginBottom: '20px' }}>
                ← Tillbaka
            </button>

            <h1>Redigera bild</h1>

            {/* Här laddar vi in själva rit-komponenten */}
            <ImageEditor
                imageId={imageId}
                onSave={() => console.log("Bild sparad!")}
            />
        </div>
    );
}
