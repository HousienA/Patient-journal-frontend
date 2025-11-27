import React, { useRef, useState, useEffect } from 'react';
import CanvasDraw from 'react-canvas-draw';

// OBS: Byt ut om du kör på annan URL i prod
const ImageServiceURL = import.meta.env.VITE_IMAGE_API_URL || 'http://localhost:8084';

export default function ImageEditor({ imageId, onSave }) {
    const [imageData, setImageData] = useState(null);
    const [brushColor, setBrushColor] = useState("#FF0000");
    const [brushRadius, setBrushRadius] = useState(4);

    // Text-läge
    const [isTextMode, setIsTextMode] = useState(false);
    const [texts, setTexts] = useState([]); // Array av { x, y, text, color }
    const [currentText, setCurrentText] = useState("");
    const [textPosition, setTextPosition] = useState(null); // { x, y } för inmatningsrutan

    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        loadImage();
    }, [imageId]);

    const loadImage = async () => {
        try {
            const res = await fetch(`${ImageServiceURL}/images/${imageId}`);
            const data = await res.json();
            setImageData(data);
            if (data.texts && Array.isArray(data.texts)) {
                setTexts(data.texts);
            }
        } catch (err) {
            console.error("Kunde inte ladda bild", err);
        }
    };

    const handleSave = async () => {
        const saveData = canvasRef.current.getSaveData();

        await fetch(`${ImageServiceURL}/images/${imageId}/annotate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                annotations: saveData,
                texts: texts // Skicka med texterna också
            })
        });

        alert('Bild och text sparad!');
        if (onSave) onSave();
    };

    const handleCanvasClick = (e) => {
        if (!isTextMode) return;

        // Räkna ut position relativt till containern
        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setTextPosition({ x, y });
        setCurrentText(""); // Återställ inmatning
        // Fokusera automatiskt på inputen (sker via autoFocus på inputen nedan)
    };

    const addText = () => {
        if (!currentText.trim() || !textPosition) {
            setTextPosition(null);
            return;
        }

        setTexts([...texts, {
            x: textPosition.x,
            y: textPosition.y,
            text: currentText,
            color: brushColor
        }]);

        setTextPosition(null);
        setCurrentText("");
        // Stäng inte textläget automatiskt ifall man vill skriva mer,
        // men man kan göra setIsTextMode(false) om man vill.
    };

    const undoLastText = () => {
        setTexts(texts.slice(0, -1));
    };

    const clearAll = () => {
        if (window.confirm("Vill du rensa allt (både ritning och text)?")) {
            canvasRef.current.clear();
            setTexts([]);
        }
    };

    if (!imageData) return <div>Laddar bild...</div>;

    return (
        <div className="image-editor">
            {/* Verktygsfält */}
            <div className="toolbar" style={{ marginBottom: '10px', padding: '10px', background: '#f5f5f5', borderRadius: '8px' }}>
                <div style={{ marginBottom: '10px' }}>
                    <label>Färg: </label>
                    <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)} />

                    <label style={{ marginLeft: '10px' }}>Pensel: </label>
                    <input
                        type="range" min="1" max="20"
                        value={brushRadius}
                        onChange={e => setBrushRadius(parseInt(e.target.value))}
                        disabled={isTextMode}
                    />
                </div>

                <div>
                    <button
                        onClick={() => setIsTextMode(false)}
                        className={!isTextMode ? 'btn-primary' : 'btn-secondary'}
                    >
                        🖌️ Rita
                    </button>
                    <button
                        onClick={() => setIsTextMode(true)}
                        className={isTextMode ? 'btn-primary' : 'btn-secondary'}
                        style={{ marginLeft: '10px' }}
                    >
                        text Text
                    </button>

                    <button onClick={() => isTextMode ? undoLastText() : canvasRef.current.undo()} style={{ marginLeft: '20px' }}>
                        Ångra {isTextMode ? '(Text)' : '(Rita)'}
                    </button>
                    <button onClick={clearAll} style={{ marginLeft: '5px' }}>Rensa allt</button>

                    <button onClick={handleSave} className="btn-primary" style={{ marginLeft: '20px', backgroundColor: '#2ecc71', border: 'none' }}>
                        SPARA
                    </button>
                </div>

                {isTextMode && <small style={{display:'block', marginTop:'5px'}}>Klicka på bilden för att lägga till text.</small>}
            </div>

            {/* Bildyta */}
            <div
                ref={containerRef}
                style={{ position: 'relative', width: '800px', height: '600px', border: '2px solid #ccc', cursor: isTextMode ? 'text' : 'crosshair' }}
                onClick={handleCanvasClick} // Fånga klick för text
            >
                {/* Bakgrundsbilden */}
                <img
                    src={imageData.url}
                    alt="Original"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', zIndex: 1, userSelect: 'none' }}
                />

                {/* Rit-lagret (Klicka igenom det om vi är i textläge) */}
                <div style={{ position: 'absolute', top: 0, left: 0, zIndex: 2, pointerEvents: isTextMode ? 'none' : 'auto' }}>
                    <CanvasDraw
                        ref={canvasRef}
                        brushColor={brushColor}
                        brushRadius={brushRadius}
                        lazyRadius={0}
                        canvasWidth={800}
                        canvasHeight={600}
                        imgSrc=""
                        backgroundColor="transparent"
                        saveData={
                            (typeof imageData.annotations === 'string' && imageData.annotations.length > 5)
                                ? imageData.annotations
                                : undefined
                        }
                    />
                </div>

                {/* Text-lagret (Renderar sparade texter) */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 3, pointerEvents: 'none' }}>
                    {texts.map((t, i) => (
                        <div key={i} style={{
                            position: 'absolute',
                            left: t.x,
                            top: t.y,
                            color: t.color,
                            fontSize: '16px',
                            fontWeight: 'bold',
                            textShadow: '1px 1px 0 #fff' // Vit skugga för läsbarhet
                        }}>
                            {t.text}
                        </div>
                    ))}
                </div>

                {/* Inmatningsruta för ny text */}
                {textPosition && (
                    <div style={{ position: 'absolute', left: textPosition.x, top: textPosition.y, zIndex: 4 }}>
                        <input
                            autoFocus
                            type="text"
                            value={currentText}
                            onChange={e => setCurrentText(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') addText(); }}
                            onBlur={addText} // Spara när man klickar utanför
                            style={{
                                border: '1px solid blue',
                                color: brushColor,
                                fontWeight: 'bold',
                                background: 'rgba(255,255,255,0.8)'
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
