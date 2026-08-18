import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCw, RefreshCw, Move } from 'lucide-react';

interface AvatarCropperProps {
  imageFile: File;
  onPreviewChange: (previewUrl: string | null) => void;
  onCroppedFileReady: (croppedFile: File) => void;
  uploading: boolean;
  onCancel: () => void;
}

export const AvatarCropper: React.FC<AvatarCropperProps> = ({
  imageFile,
  onPreviewChange,
  onCroppedFileReady,
  uploading,
  onCancel
}) => {
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const exportCanvasRef = useRef<HTMLCanvasElement>(null);

  // ID Card Frame Dimensions (Aspect ratio 1.048:1 matching Staff ID Card 1.8in x 1.75in frame)
  const viewportWidth = 250;
  const viewportHeight = 238;
  const outputWidth = 540;
  const outputHeight = 515;

  // Load image object from file
  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setZoom(1);
      setRotation(0);
      setPan({ x: 0, y: 0 });
    };
    img.src = url;

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile]);

  // Generate cropped preview & file blob
  const generateCroppedOutput = useCallback(() => {
    if (!imageObj) return;

    const canvas = exportCanvasRef.current || document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, outputWidth, outputHeight);

    // Save context state
    ctx.save();

    // Center output canvas
    ctx.translate(outputWidth / 2, outputHeight / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Calculate aspect scale to cover output viewport at zoom = 1
    const minScale = Math.max(viewportWidth / imageObj.width, viewportHeight / imageObj.height);
    const scaleFactor = outputWidth / viewportWidth;

    const effectiveScale = minScale * zoom * scaleFactor;

    // Apply scaling
    ctx.scale(effectiveScale, effectiveScale);

    // Apply pan offset adjusted for canvas scaling
    ctx.translate(
      (pan.x * scaleFactor) / (minScale * zoom),
      (pan.y * scaleFactor) / (minScale * zoom)
    );

    // Draw centered image
    ctx.drawImage(imageObj, -imageObj.width / 2, -imageObj.height / 2);

    ctx.restore();

    // Create live preview URL
    canvas.toBlob((blob) => {
      if (blob) {
        const previewUrl = URL.createObjectURL(blob);
        onPreviewChange(previewUrl);

        const croppedFile = new File([blob], imageFile.name || 'avatar.png', {
          type: 'image/png',
          lastModified: Date.now()
        });
        onCroppedFileReady(croppedFile);
      }
    }, 'image/png', 0.95);
  }, [imageObj, zoom, rotation, pan, imageFile, onPreviewChange, onCroppedFileReady]);

  useEffect(() => {
    generateCroppedOutput();
  }, [generateCroppedOutput]);

  // Mouse / Touch Event Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setPan({
      x: panStartRef.current.x + dx,
      y: panStartRef.current.y + dy
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '1.25rem' }}>
      {/* Hidden Canvas for High-Res Output */}
      <canvas ref={exportCanvasRef} style={{ display: 'none' }} />

      {/* Interactive Crop Viewport Box */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          position: 'relative',
          width: `${viewportWidth + 24}px`,
          height: `${viewportHeight + 24}px`,
          borderRadius: '16px',
          backgroundColor: '#0F172A',
          overflow: 'hidden',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {/* Render Base Image */}
        {imageObj && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom})`,
              transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none'
            }}
          >
            <img
              src={imageObj.src}
              alt="Avatar Target"
              style={{
                maxHeight: `${viewportHeight}px`,
                maxWidth: `${viewportWidth}px`,
                objectFit: 'contain',
                pointerEvents: 'none'
              }}
            />
          </div>
        )}

        {/* Translucent Backdrop Mask & Staff ID Card Rectangular Aperture */}
        <div
          style={{
            position: 'absolute',
            width: `${viewportWidth}px`,
            height: `${viewportHeight}px`,
            pointerEvents: 'none',
            borderRadius: '10px',
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.65)',
            border: '2px dashed rgba(255, 255, 255, 0.9)'
          }}
        >
          {/* Label inside viewport overlay */}
          <div style={{ position: 'absolute', bottom: '6px', right: '8px', fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            ID Card Frame
          </div>
        </div>

        {/* Drag Hint Indicator */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 23, 42, 0.85)',
            color: '#FFFFFF',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '4px 12px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backdropFilter: 'blur(4px)',
            pointerEvents: 'none',
            zIndex: 2
          }}
        >
          <Move size={12} /> Drag photo down to create top space
        </div>
      </div>

      {/* Interactive Controls Bar */}
      <div style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Zoom Slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#F1F5F9', padding: '0.5rem 0.85rem', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.6, +(z - 0.1).toFixed(2)))}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', display: 'flex', padding: 2 }}
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <input
            type="range"
            min="0.6"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{ flex: 1, accentColor: '#000080', cursor: 'pointer' }}
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#475569', display: 'flex', padding: 2 }}
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155', minWidth: '38px', textAlign: 'right' }}>
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Action Buttons: Rotate & Reset */}
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleRotate}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.4rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#334155',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <RotateCw size={14} /> Rotate
          </button>

          <button
            type="button"
            onClick={handleReset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.4rem 0.75rem',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#334155',
              background: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} /> Reset Frame
          </button>
        </div>

        {/* Choose another photo link */}
        <div style={{ textAlign: 'center', marginTop: '0.25rem' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={uploading}
            style={{
              background: 'none',
              border: 'none',
              color: '#000080',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Choose a different photo
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCropper;

