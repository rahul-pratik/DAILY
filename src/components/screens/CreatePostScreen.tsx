import React, { useState, useRef } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  Trophy, 
  MessageCircle, 
  Heart, 
  HelpCircle, 
  Image as ImageIcon, 
  X,
  ChevronDown,
  Crop,
  Sparkles
} from 'lucide-react';
import { Author, PurposeLabel } from '../../types';
import { ImageCropModal } from '../modals/ImageCropModal';

interface CreatePostScreenProps {
  currentUser: Author;
  onClose: () => void;
  onSubmitPost: (data: {
    content: string;
    purpose?: PurposeLabel;
    mediaUrls?: string[];
    audience?: string;
  }) => void;
}

export const CreatePostScreen: React.FC<CreatePostScreenProps> = ({
  currentUser,
  onClose,
  onSubmitPost,
}) => {
  const [content, setContent] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<PurposeLabel | undefined>(undefined);
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]);
  const [audience, setAudience] = useState<'Public' | 'Followers'>('Public');
  const [showAudienceMenu, setShowAudienceMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper states
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>('');
  const [recropIndex, setRecropIndex] = useState<number | null>(null);

  const purposeChips: { label: PurposeLabel; icon: React.ReactNode }[] = [
    { label: 'Insight', icon: <Lightbulb size={16} className="text-[#3B82FF]" /> },
    { label: 'Progress', icon: <TrendingUp size={16} className="text-[#3B82FF]" /> },
    { label: 'Achievement', icon: <Trophy size={16} className="text-[#3B82FF]" /> },
    { label: 'Opinion', icon: <MessageCircle size={16} className="text-[#3B82FF]" /> },
    { label: 'Motivation', icon: <Heart size={16} className="text-[#3B82FF]" /> },
    { label: 'Question', icon: <HelpCircle size={16} className="text-[#3B82FF]" /> },
  ];

  const handleTogglePurpose = (label: PurposeLabel) => {
    setSelectedPurpose((prev) => (prev === label ? undefined : label));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Grab first image to crop according to required resolution
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setImageToCrop(uploadEvent.target.result as string);
        setRecropIndex(null);
        setIsCropModalOpen(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (recropIndex !== null) {
      // Replacing existing image with newly cropped version
      setSelectedMedia((prev) => prev.map((m, i) => (i === recropIndex ? croppedDataUrl : m)));
    } else {
      // Adding newly cropped photo
      if (selectedMedia.length < 4) {
        setSelectedMedia((prev) => [...prev, croppedDataUrl]);
      }
    }
    setIsCropModalOpen(false);
    setRecropIndex(null);
  };

  const handleStartRecrop = (index: number) => {
    setImageToCrop(selectedMedia[index]);
    setRecropIndex(index);
    setIsCropModalOpen(true);
  };

  const handleAddSampleImage = (type: 'code' | 'runner') => {
    if (selectedMedia.length >= 4) return;
    const sample =
      type === 'code'
        ? 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80';
    
    // Open crop tool for sample image so user can pick aspect ratio
    setImageToCrop(sample);
    setRecropIndex(null);
    setIsCropModalOpen(true);
  };

  const handleRemoveMedia = (index: number) => {
    setSelectedMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const isReadyToPost = Boolean(selectedPurpose && (content.trim() || selectedMedia.length > 0));

  const handleSubmit = () => {
    if (!isReadyToPost) return;
    onSubmitPost({
      content: content.trim(),
      purpose: selectedPurpose,
      mediaUrls: selectedMedia.length > 0 ? selectedMedia : undefined,
      audience,
    });
  };

  return (
    <div className="min-h-full pb-20 pt-1 px-4 flex flex-col animate-fade-in">
      {/* Top action row with Close and Post */}
      <div className="flex items-center justify-between py-2 mb-3">
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors cursor-pointer"
          aria-label="Close composer"
        >
          <X size={22} />
        </button>

        <button
          onClick={handleSubmit}
          disabled={!isReadyToPost}
          className={`px-5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
            isReadyToPost
              ? 'bg-[#2166FF] text-white hover:bg-[#3B82FF] active:scale-95 shadow-md shadow-[#2166FF]/25 cursor-pointer'
              : 'bg-[#101010] text-[#9298A3]/50 border border-[#20242C] cursor-not-allowed'
          }`}
        >
          Post
        </button>
      </div>

      {/* User & Audience Selector */}
      <div className="flex items-center gap-3 mb-4">
        <img
          src={currentUser.avatar}
          alt={currentUser.name}
          className="w-10 h-10 rounded-full object-cover border border-[#2166FF]/60"
          referrerPolicy="no-referrer"
        />

        <div className="relative">
          <button
            onClick={() => setShowAudienceMenu(!showAudienceMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#080B10] hover:bg-[#101010] border border-[#20242C] text-xs font-medium text-white transition-colors cursor-pointer"
          >
            <span>You</span>
            <span className="text-[#9298A3] text-[11px]">({audience})</span>
            <ChevronDown size={14} className="text-[#9298A3]" />
          </button>

          {showAudienceMenu && (
            <div className="absolute left-0 top-full mt-1.5 w-44 rounded-xl bg-[#080B10] border border-[#20242C] shadow-2xl py-1 z-50">
              <button
                onClick={() => {
                  setAudience('Public');
                  setShowAudienceMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[#101010] cursor-pointer ${
                  audience === 'Public' ? 'text-[#2166FF] font-semibold' : 'text-white'
                }`}
              >
                Public (Everyone)
              </button>
              <button
                onClick={() => {
                  setAudience('Followers');
                  setShowAudienceMenu(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs transition-colors hover:bg-[#101010] cursor-pointer ${
                  audience === 'Followers' ? 'text-[#2166FF] font-semibold' : 'text-white'
                }`}
              >
                Followers Only
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Text Input Area */}
      <div className="relative mb-4 flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          rows={5}
          className="w-full bg-transparent text-white placeholder-[#9298A3] text-base leading-relaxed focus:outline-none resize-none caret-[#2166FF]"
          autoFocus
        />
      </div>

      {/* Purpose Selection Chips (2 rows of 3) */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider">
            Select Purpose (Required)
          </span>
          {selectedPurpose ? (
            <span className="text-[11px] font-semibold text-[#3B82FF] bg-[#2166FF]/15 px-2 py-0.5 rounded-full">
              {selectedPurpose} Selected
            </span>
          ) : (
            <span className="text-[11px] text-[#9298A3]">
              Required to enable Post
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {purposeChips.map((chip) => {
            const isSelected = selectedPurpose === chip.label;
            return (
              <button
                key={chip.label}
                type="button"
                onClick={() => handleTogglePurpose(chip.label)}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#2166FF]/20 border-[#2166FF] text-white shadow-sm font-semibold'
                    : 'bg-[#080B10] hover:bg-[#101010] border-[#20242C] text-[#9298A3] hover:text-white'
                }`}
              >
                {chip.icon}
                <span className="truncate">{chip.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Media Attachments Preview if any */}
      {selectedMedia.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-[#9298A3] uppercase tracking-wider">
              Cropped Attachments ({selectedMedia.length}/4)
            </span>
            <span className="text-[10px] text-[#3B82FF]">
              Tap Crop to change resolution
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {selectedMedia.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-video rounded-xl overflow-hidden border border-[#20242C] group bg-[#080B10]"
              >
                <img
                  src={url}
                  alt={`Attachment ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Top Actions: Crop & Delete */}
                <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartRecrop(idx)}
                    className="w-6 h-6 rounded-full bg-black/80 hover:bg-[#2166FF] text-white flex items-center justify-center cursor-pointer transition-colors shadow-sm"
                    title="Crop photo to resolution"
                  >
                    <Crop size={12} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRemoveMedia(idx)}
                    className="w-6 h-6 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors"
                    title="Remove photo"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attachment Card: Add photos */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="mb-4 p-4 rounded-2xl bg-[#080B10] hover:bg-[#101010] border border-[#20242C] border-dashed transition-all cursor-pointer flex items-center gap-3.5 group"
      >
        <div className="w-10 h-10 rounded-xl bg-[#101010] border border-[#20242C] flex items-center justify-center text-[#3B82FF] group-hover:border-[#2166FF]/60 transition-colors">
          <ImageIcon size={20} />
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold text-white group-hover:text-[#3B82FF] transition-colors">
            Upload & Crop photos
          </p>
          <p className="text-[11px] text-[#9298A3]">
            Crop to required resolution: 1:1 Square, 4:5 Portrait, or 16:9
          </p>
        </div>

        {/* Quick sample chips */}
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => handleAddSampleImage('code')}
            className="text-[10px] px-2 py-1 rounded bg-[#101010] hover:bg-[#20242C] text-[#9298A3] hover:text-white border border-[#20242C] transition-colors cursor-pointer"
          >
            + Code
          </button>
          <button
            type="button"
            onClick={() => handleAddSampleImage('runner')}
            className="text-[10px] px-2 py-1 rounded bg-[#101010] hover:bg-[#20242C] text-[#9298A3] hover:text-white border border-[#20242C] transition-colors cursor-pointer"
          >
            + Run
          </button>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Bottom Attachment Action Icons (Photo only) */}
      <div className="pt-2 flex items-center gap-4 text-[#9298A3] border-t border-[#20242C]/40">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:text-white hover:bg-[#101010] transition-colors cursor-pointer text-xs"
          aria-label="Upload image"
        >
          <ImageIcon size={18} className="text-[#3B82FF]" />
          <span>Upload Image</span>
        </button>
      </div>

      {/* Image Crop Modal */}
      {isCropModalOpen && (
        <ImageCropModal
          isOpen={isCropModalOpen}
          imageUrl={imageToCrop}
          mode="post"
          title="Crop Post Photo to Required Resolution"
          onCropComplete={handleCropComplete}
          onClose={() => {
            setIsCropModalOpen(false);
            setRecropIndex(null);
          }}
        />
      )}
    </div>
  );
};
