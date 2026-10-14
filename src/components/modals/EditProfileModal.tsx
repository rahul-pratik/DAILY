import React, { useState, useRef } from 'react';
import { 
  X, 
  Check, 
  Globe, 
  Lock, 
  Camera, 
  Crop, 
  Upload, 
  Sparkles, 
  Image as ImageIcon 
} from 'lucide-react';
import { Author } from '../../types';
import { ImageCropModal } from './ImageCropModal';

interface EditProfileModalProps {
  user: Author;
  onClose: () => void;
  onSave: (updated: { 
    name: string; 
    username: string; 
    bio: string; 
    avatar?: string; 
    bannerUrl?: string; 
    accountabilityHubPrivacy?: 'public' | 'private' 
  }) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  user,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [avatar, setAvatar] = useState(user.avatar);
  const [bannerUrl, setBannerUrl] = useState(
    user.bannerUrl || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&auto=format&fit=crop&q=80'
  );
  const [hubPrivacy, setHubPrivacy] = useState<'public' | 'private'>(
    user.accountabilityHubPrivacy || 'public'
  );

  // Cropper states
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperTarget, setCropperTarget] = useState<'avatar' | 'banner'>('avatar');
  const [rawImageForCrop, setRawImageForCrop] = useState<string>('');

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleSelectFile = (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'avatar' | 'banner'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setRawImageForCrop(uploadEvent.target.result as string);
        setCropperTarget(target);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be selected again
    e.target.value = '';
  };

  const handleOpenCropperCurrent = (target: 'avatar' | 'banner') => {
    setRawImageForCrop(target === 'avatar' ? avatar : bannerUrl);
    setCropperTarget(target);
    setCropperOpen(true);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (cropperTarget === 'avatar') {
      setAvatar(croppedDataUrl);
    } else {
      setBannerUrl(croppedDataUrl);
    }
    setCropperOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ 
      name, 
      username, 
      bio, 
      avatar, 
      bannerUrl, 
      accountabilityHubPrivacy: hubPrivacy 
    });
    onClose();
  };

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-[#080B10] border border-[#20242C] rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 overflow-hidden max-h-[92dvh] flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#20242C] mb-4 shrink-0">
            <div>
              <h3 className="text-base font-bold text-white">Edit Profile</h3>
              <p className="text-[11px] text-[#9298A3]">
                Customize your bio, handle, avatar (1:1), and banner (3:1)
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#9298A3] hover:text-white hover:bg-[#101010] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* BANNER SECTION (Recommended 1200x400 / 3:1) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#9298A3] uppercase tracking-wider">
                  Profile Banner
                </label>
                <span className="text-[10px] text-[#3B82FF] font-mono bg-[#2166FF]/10 px-2 py-0.5 rounded-full border border-[#2166FF]/20">
                  Recommended: 1200×400 (3:1)
                </span>
              </div>

              <div className="relative w-full h-24 sm:h-28 rounded-2xl overflow-hidden border border-[#20242C] group bg-black">
                <img
                  src={bannerUrl}
                  alt="Profile Banner Preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg cursor-pointer"
                  >
                    <Upload size={13} />
                    <span>Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenCropperCurrent('banner')}
                    className="px-3 py-1.5 rounded-xl bg-black/80 hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 cursor-pointer"
                  >
                    <Crop size={13} />
                    <span>Crop</span>
                  </button>
                </div>
              </div>

              {/* Mobile button row for Banner */}
              <div className="flex items-center gap-2 mt-2 sm:hidden">
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-[#101010] border border-[#20242C] text-xs font-medium text-white flex items-center justify-center gap-1.5 hover:bg-[#1a1f29] cursor-pointer"
                >
                  <Camera size={13} className="text-[#3B82FF]" />
                  <span>Change Banner</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenCropperCurrent('banner')}
                  className="py-1.5 px-3 rounded-xl bg-[#101010] border border-[#20242C] text-xs font-medium text-[#9298A3] hover:text-white flex items-center gap-1.5 hover:bg-[#1a1f29] cursor-pointer"
                >
                  <Crop size={13} />
                  <span>Crop</span>
                </button>
              </div>

              <input
                type="file"
                ref={bannerInputRef}
                onChange={(e) => handleSelectFile(e, 'banner')}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* AVATAR (PFP) SECTION (Required 400x400 / 1:1) */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#9298A3] uppercase tracking-wider">
                  Profile Picture (PFP)
                </label>
                <span className="text-[10px] text-[#3B82FF] font-mono bg-[#2166FF]/10 px-2 py-0.5 rounded-full border border-[#2166FF]/20">
                  Required: 400×400 (1:1 Square)
                </span>
              </div>

              <div className="flex items-center gap-4 p-3 rounded-2xl bg-[#080B10] border border-[#20242C]">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#2166FF] shrink-0 bg-black shadow-md shadow-[#2166FF]/20 group">
                  <img
                    src={avatar}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                  >
                    <Camera size={18} />
                  </div>
                </div>

                <div className="flex-1">
                  <p className="text-xs font-bold text-white mb-0.5">{name}</p>
                  <p className="text-[11px] text-[#9298A3] mb-2 font-mono">@{username}</p>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Upload size={12} />
                      <span>Upload Photo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCropperCurrent('avatar')}
                      className="px-3 py-1.5 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-[#9298A3] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Crop size={12} />
                      <span>Crop (1:1)</span>
                    </button>
                  </div>
                </div>
              </div>

              <input
                type="file"
                ref={avatarInputRef}
                onChange={(e) => handleSelectFile(e, 'avatar')}
                accept="image/*"
                className="hidden"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-[#9298A3] mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#101010] border border-[#20242C] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#2166FF]"
                required
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-medium text-[#9298A3] mb-1">
                Username Handle
              </label>
              <div className="flex items-center bg-[#101010] border border-[#20242C] rounded-xl px-3.5 py-2">
                <span className="text-xs text-[#9298A3] mr-1">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-medium text-[#9298A3] mb-1">
                Bio & Focus
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full bg-[#101010] border border-[#20242C] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#2166FF] resize-none"
                placeholder="What are you building or working towards?"
              />
            </div>

            {/* Accountability Hub Visibility */}
            <div>
              <label className="block text-xs font-medium text-[#9298A3] mb-1.5">
                Accountability Hub Visibility
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#101010] border border-[#20242C] rounded-xl">
                <button
                  type="button"
                  onClick={() => setHubPrivacy('public')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    hubPrivacy === 'public'
                      ? 'bg-[#2166FF] text-white shadow-sm'
                      : 'text-[#9298A3] hover:text-white'
                  }`}
                >
                  <Globe size={13} />
                  <span>Public Hub</span>
                </button>
                <button
                  type="button"
                  onClick={() => setHubPrivacy('private')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    hubPrivacy === 'private'
                      ? 'bg-[#2166FF] text-white shadow-sm'
                      : 'text-[#9298A3] hover:text-white'
                  }`}
                >
                  <Lock size={13} />
                  <span>Private Hub</span>
                </button>
              </div>
              <p className="text-[10px] text-[#9298A3] mt-1">
                {hubPrivacy === 'public' 
                  ? 'Public: Anyone can view your daily sprints & verified proof gallery.' 
                  : 'Private: Only you can view your accountability hub.'}
              </p>
            </div>

            {/* Sticky Actions */}
            <div className="pt-3 border-t border-[#20242C]/60 flex items-center gap-2 shrink-0">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#2166FF]/25"
              >
                <Check size={16} />
                <span>Save Profile Changes</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-[#101010] hover:bg-[#20242C] text-xs font-medium text-[#9298A3] hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Cropper Modal */}
      {cropperOpen && (
        <ImageCropModal
          isOpen={cropperOpen}
          imageUrl={rawImageForCrop}
          mode={cropperTarget}
          title={
            cropperTarget === 'avatar'
              ? 'Crop Profile Picture (400×400 Square)'
              : 'Crop Profile Banner (1200×400 Panoramic)'
          }
          onCropComplete={handleCropComplete}
          onClose={() => setCropperOpen(false)}
        />
      )}
    </>
  );
};
