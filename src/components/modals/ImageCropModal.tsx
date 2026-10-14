import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Check, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Crop, 
  Maximize2, 
  Move,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

export interface AspectRatioOption {
  label: string;
  ratio: number;
  width: number;
  height: number;
  tag: string;
  description: string;
}

interface ImageCropModalProps {
  isOpen: boolean;
  imageUrl: string;
  title?: string;
  mode?: 'avatar' | 'banner' | 'post';
  onCropComplete: (croppedDataUrl: string) => void;
  onClose: () => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  isOpen,
  imageUrl,
  title,
  mode = 'post',
  onCropComplete,
  onClose,
}) => {
  // Preset Aspect Ratios per mode
  const getOptionsForMode = (): AspectRatioOption[] => {
    if (mode === 'avatar') {
      return [
        { label: '1:1 Square', ratio: 1, width: 400, height: 400, tag: '400×400', description: 'Recommended for Profile Avatar' },
      ];
    }
    if (mode === 'banner') {
      return [
        { label: '3:1 Panoramic', ratio: 3 / 1, width: 1200, height: 400, tag: '1200×400', description: 'Recommended for Profile Banner' },
        { label: '16:9 Widescreen', ratio: 16 / 9, width: 1280, height: 720, tag: '1280×720', description: 'Standard Widescreen Header' },
      ];
    }
    // Post mode
    return [
      { label: '1:1 Square', ratio: 1, width: 1080, height: 1080, tag: '1080×1080', description: 'Standard Feed Square' },
      { label: '4:5 Portrait', ratio: 4 / 5, width: 1080, height: 1350, tag: '1080×1350', description: 'Feed Optimized Portrait' },
      { label: '16:9 Landscape', ratio: 16 / 9, width: 1280, height: 720, tag: '1280×720', description: 'Widescreen Coding / Proof' },
      { label: 'Free / Original', ratio: 0, width: 0, height: 0, tag: 'Auto', description: 'Keep Natural Proportion' },
    ];
  };

  const ratioOptions = getOptionsForMode();
  const [selectedOption, setSelectedOption] = useState<AspectRatioOption>(ratioOptions[0]);
  
  // Transform states
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // in degrees: 0, 90, 180, 270
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Image metadata
  const [imageElement, setImageElement] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [circleMaskPreview, setCircleMaskPreview] = useState(mode === 'avatar');

  const containerRef = useRef<HTMLDivElement>(null);

  // Load image
  useEffect(() => {
    if (!imageUrl) return;
    setImageLoaded(false);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageElement(img);
      setImageLoaded(true);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = imageUrl;
  }, [imageUrl]);

  // Reset transforms when option changes
  const handleSelectOption = (opt: AspectRatioOption) => {
    setSelectedOption(opt);
    setOffset({ x: 0, y: 0 });
    setZoom(1);
  };

  // Drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Perform final crop with canvas
  const handleApplyCrop = () => {
    if (!imageElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Determine target dimensions
    let targetWidth = selectedOption.width || imageElement.naturalWidth;
    let targetHeight = selectedOption.height || imageElement.naturalHeight;

    if (selectedOption.ratio === 0) {
      // Natural ratio
      targetWidth = Math.min(imageElement.naturalWidth, 1200);
      targetHeight = Math.round(targetWidth * (imageElement.naturalHeight / imageElement.naturalWidth));
    } else {
      // Scale target if needed to keep crisp resolution
      if (mode === 'avatar') {
        targetWidth = 400;
        targetHeight = 400;
      } else if (mode === 'banner') {
        targetWidth = selectedOption.ratio >= 2.5 ? 1200 : 1280;
        targetHeight = Math.round(targetWidth / selectedOption.ratio);
      } else {
        targetWidth = 1080;
        targetHeight = Math.round(targetWidth / selectedOption.ratio);
      }
    }

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    // Fill dark background in case of margins
    ctx.fillStyle = '#080B10';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Compute transforms on canvas
    ctx.save();
    ctx.translate(targetWidth / 2, targetHeight / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // Scaling factor between viewport container and natural image
    const container = containerRef.current;
    const viewW = container ? container.clientWidth : 300;
    const viewH = container ? container.clientHeight : 300;

    // Draw scale based on zoom and offset
    const scaleFactor = (targetWidth / viewW) * zoom;
    const drawOffsetX = offset.x * (targetWidth / viewW);
    const drawOffsetY = offset.y * (targetHeight / viewH);

    ctx.translate(drawOffsetX, drawOffsetY);

    // Base fitted size
    const imgAspect = imageElement.naturalWidth / imageElement.naturalHeight;
    const targetAspect = targetWidth / targetHeight;

    let baseDrawW = targetWidth;
    let baseDrawH = targetHeight;

    if (imgAspect > targetAspect) {
      // Image is wider than target crop
      baseDrawH = targetHeight;
      baseDrawW = targetHeight * imgAspect;
    } else {
      // Image is taller than target crop
      baseDrawW = targetWidth;
      baseDrawH = targetWidth / imgAspect;
    }

    // Apply zoom
    const finalDrawW = baseDrawW * zoom;
    const finalDrawH = baseDrawH * zoom;

    ctx.drawImage(
      imageElement,
      -finalDrawW / 2,
      -finalDrawH / 2,
      finalDrawW,
      finalDrawH
    );

    ctx.restore();

    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCropComplete(croppedDataUrl);
  };

  if (!isOpen) return null;

  // Compute crop box style for UI preview
  const getCropBoxAspect = () => {
    if (selectedOption.ratio === 0 && imageElement) {
      return `${imageElement.naturalWidth} / ${imageElement.naturalHeight}`;
    }
    return `${selectedOption.ratio || 1} / 1`;
  };

  const defaultTitle = 
    mode === 'avatar' 
      ? 'Crop Profile Picture (1:1)' 
      : mode === 'banner' 
      ? 'Crop Profile Banner (1200×400)' 
      : 'Crop Photo to Resolution';

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[#080B10] border border-[#20242C] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94dvh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#20242C] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#2166FF]/20 border border-[#2166FF]/40 flex items-center justify-center text-[#3B82FF]">
              <Crop size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">
                {title || defaultTitle}
              </h3>
              <p className="text-[10px] text-[#9298A3]">
                Drag to reposition • Use slider to zoom
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={17} />
          </button>
        </div>

        {/* Aspect Ratio Options */}
        <div className="px-4 py-2.5 bg-[#040608] border-b border-[#20242C]/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] font-semibold text-[#9298A3] uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Layers size={11} /> Resolution:
          </span>
          {ratioOptions.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => handleSelectOption(opt)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedOption.label === opt.label
                  ? 'bg-[#2166FF] text-white shadow-sm'
                  : 'bg-[#101010] hover:bg-[#1a1f29] text-[#9298A3] hover:text-white border border-[#20242C]'
              }`}
            >
              <span>{opt.label}</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-mono ${
                selectedOption.label === opt.label ? 'bg-white/20 text-white' : 'bg-black/40 text-[#9298A3]'
              }`}>
                {opt.tag}
              </span>
            </button>
          ))}
        </div>

        {/* Viewport Cropper Area */}
        <div className="flex-1 bg-black p-4 flex items-center justify-center overflow-hidden min-h-[260px] relative select-none">
          {imageLoaded ? (
            <div
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              style={{
                aspectRatio: getCropBoxAspect(),
                maxWidth: '100%',
                maxHeight: '340px',
              }}
              className={`relative border-2 border-[#2166FF] shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center bg-[#080B10] ${
                mode === 'avatar' && circleMaskPreview ? 'rounded-full' : 'rounded-2xl'
              }`}
            >
              {/* Inner Image */}
              <div
                className="w-full h-full flex items-center justify-center"
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
                  transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                }}
              >
                <img
                  src={imageUrl}
                  alt="Crop Target"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                    maxWidth: 'none',
                  }}
                  className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
                />
              </div>

              {/* Grid overlay for rule of thirds */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30 border border-white/20">
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-r border-b border-white/20" />
                <div className="border-b border-white/20" />
                <div className="border-r border-white/20" />
                <div className="border-r border-white/20" />
                <div />
              </div>

              {/* Pan hint badge */}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white/80 pointer-events-none flex items-center gap-1 border border-white/10">
                <Move size={10} /> Pan & Position
              </div>
            </div>
          ) : (
            <div className="text-center text-[#9298A3] text-xs">
              Loading image preview...
            </div>
          )}
        </div>

        {/* Transform Controls Toolbar */}
        <div className="px-4 py-3 bg-[#080B10] border-t border-[#20242C] space-y-3 shrink-0">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              className="w-7 h-7 rounded-lg bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer"
              title="Zoom out"
            >
              <ZoomOut size={14} />
            </button>

            <div className="flex-1 flex items-center gap-2">
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#2166FF] h-1.5 bg-[#20242C] rounded-lg cursor-pointer"
              />
              <span className="text-[11px] font-mono text-[#9298A3] w-10 text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              className="w-7 h-7 rounded-lg bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer"
              title="Zoom in"
            >
              <ZoomIn size={14} />
            </button>

            {/* Rotate button */}
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-xs font-medium text-[#9298A3] hover:text-white transition-colors cursor-pointer"
              title="Rotate 90 degrees"
            >
              <RotateCw size={13} />
              <span>Rotate</span>
            </button>

            {/* Reset */}
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setOffset({ x: 0, y: 0 });
                setRotation(0);
              }}
              className="text-xs text-[#9298A3] hover:text-white px-2 py-1 transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Avatar Circular Mask Toggle if avatar mode */}
          {mode === 'avatar' && (
            <div className="flex items-center justify-between text-xs text-[#9298A3] pt-1">
              <span className="flex items-center gap-1.5 text-[11px]">
                <Info size={12} className="text-[#3B82FF]" />
                Preview as Circular Avatar
              </span>
              <button
                type="button"
                onClick={() => setCircleMaskPreview(!circleMaskPreview)}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                  circleMaskPreview ? 'bg-[#2166FF]/20 text-[#3B82FF] border border-[#2166FF]/40' : 'bg-[#101010] text-[#9298A3]'
                }`}
              >
                {circleMaskPreview ? 'Circle On' : 'Square View'}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 border-t border-[#20242C]/60 flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyCrop}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-lg shadow-[#2166FF]/30 transition-all cursor-pointer"
            >
              <Check size={16} />
              <span>
                {mode === 'post' ? 'Crop & Add to Post' : 'Apply Cropped Photo'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-[#101010] hover:bg-[#20242C] text-[#9298A3] hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
