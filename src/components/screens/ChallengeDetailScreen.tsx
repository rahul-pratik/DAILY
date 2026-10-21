import React, { useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Flame, 
  Target, 
  Clock, 
  Users, 
  Calendar, 
  Check, 
  Image as ImageIcon, 
  Camera,
  X, 
  MessageSquare, 
  CheckCircle, 
  Plus, 
  ChevronRight,
  Trophy,
  RefreshCw,
  Video,
  Trash2,
  CheckSquare,
  Square,
  Share2
} from 'lucide-react';
import { Author, Challenge } from '../../types';

interface ChallengeDetailScreenProps {
  challenge: Challenge;
  currentUser: Author;
  onBack: () => void;
  onCheckInWithProof: (challengeId: string, note: string, photoUrl?: string, isDailyProof?: boolean) => void;
  onAddToTodoList: (challenge: Challenge) => void;
  onOpenCohortChat: () => void;
  onToggleJoin?: (challengeId: string) => void;
  onRestartChallenge?: (challengeId: string) => void;
  onDeleteChallenge?: (challengeId: string) => void;
  onPostAsDailyProof?: (content: string, photoUrl?: string, challengeTitle?: string) => void;
  isInTodoList: boolean;
}

export const ChallengeDetailScreen: React.FC<ChallengeDetailScreenProps> = ({
  challenge,
  currentUser,
  onBack,
  onCheckInWithProof,
  onAddToTodoList,
  onOpenCohortChat,
  onToggleJoin,
  onRestartChallenge,
  onDeleteChallenge,
  onPostAsDailyProof,
  isInTodoList,
}) => {
  const [proofNote, setProofNote] = useState('');
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [showProofForm, setShowProofForm] = useState(false);
  const [addAsDailyProof, setAddAsDailyProof] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Camera states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const isCompleted = challenge.current >= challenge.target || challenge.status === 'completed';
  const progressPercent = Math.min(100, Math.round((challenge.current / challenge.target) * 100));

  // Determine if current user is creator
  const isCreator = Boolean(
    challenge.creator?.username &&
    currentUser?.username &&
    challenge.creator.username.toLowerCase() === currentUser.username.toLowerCase()
  );

  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback to native capture input
        cameraInputRef.current?.click();
        return;
      }
      stopCameraStream();
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('Live camera stream error, falling back to native capture:', err);
      setCameraError('Direct camera preview not permitted. Opening device camera...');
      stopCameraStream();
      // Directly trigger native camera file input
      cameraInputRef.current?.click();
    }
  };

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setProofPhoto(dataUrl);
      stopCameraStream();
    }
  };

  const handleToggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProofPhoto(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUseSamplePhoto = (type: 'code' | 'runner') => {
    const url = type === 'code' 
      ? 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80' 
      : 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&auto=format&fit=crop&q=80';
    setProofPhoto(url);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    stopCameraStream();
    onCheckInWithProof(challenge.id, proofNote.trim(), proofPhoto || undefined, addAsDailyProof);
    setProofNote('');
    setProofPhoto(null);
    setShowProofForm(false);
  };

  // Cleanup camera when unmounting
  React.useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  return (
    <div className="pb-24 pt-2 px-4 animate-fade-in bg-black min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 pt-1 border-b border-[#20242C]/70 mb-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => {
              stopCameraStream();
              onBack();
            }}
            className="w-9 h-9 rounded-full bg-[#101010] hover:bg-[#1f242e] border border-[#20242C] flex items-center justify-center text-[#9298A3] hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-white truncate">
              {challenge.title}
            </h1>
            <p className="text-xs text-[#9298A3]">
              {challenge.type === 'squad' ? 'Team Squad Sprint' : 'Solo Focus'} • {challenge.durationDays} Days
              {isCreator && <span className="ml-2 text-[#3B82FF] font-semibold">(Created by you)</span>}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Creator-only Delete Challenge button */}
          {isCreator && onDeleteChallenge && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-all cursor-pointer"
              title="Delete Challenge (Creator only)"
              aria-label="Delete Challenge"
            >
              <Trash2 size={15} />
            </button>
          )}

          <button
            onClick={() => onAddToTodoList(challenge)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              isInTodoList
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-[#101010] hover:bg-[#1a1f29] text-white border border-[#20242C]'
            }`}
          >
            {isInTodoList ? <Check size={13} /> : <Calendar size={13} className="text-[#3B82FF]" />}
            <span>{isInTodoList ? 'In To-Do' : 'Add to To-Do'}</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal for Creator */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-[#090C13] border border-red-500/30 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Delete Challenge?</h3>
                <p className="text-xs text-[#8A92A6]">This cannot be undone. Only you as the creator can delete it.</p>
              </div>
            </div>
            <p className="text-xs text-white/80 bg-[#121622] p-3 rounded-xl border border-[#202738]">
              Are you sure you want to delete <strong className="text-white">"{challenge.title}"</strong>?
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl bg-[#141926] hover:bg-[#1E2433] text-xs font-semibold text-[#8A92A6] hover:text-white border border-[#202738] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDeleteChallenge?.(challenge.id);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-95 text-xs font-semibold text-white transition-all cursor-pointer shadow-md shadow-red-600/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Challenge Card */}
      <div className="p-4 rounded-2xl bg-[#090C13] border border-[#1C2230] mb-4 space-y-4">
        {/* Badges Row */}
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-[#2166FF]/15 text-[#3B82FF] font-semibold border border-[#2166FF]/20 flex items-center gap-1">
              <Target size={11} />
              <span>{challenge.type === 'squad' ? 'Squad Sprint' : 'Solo Focus'}</span>
            </span>

            {challenge.tags && challenge.tags[0] && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#121622] text-[#8A92A6] font-medium border border-[#202738]">
                {challenge.tags[0]}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[#8A92A6] font-mono">
            <Users size={12} />
            <span>{challenge.participantsCount || 3} joined</span>
          </div>
        </div>

        {/* WHAT YOU PERFORM Container */}
        <div className="p-3.5 rounded-xl bg-[#0E121B] border border-[#1C2230]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#3B82FF] uppercase tracking-wider mb-1.5">
            <Target size={13} />
            <span>WHAT YOU PERFORM</span>
          </div>
          <p className="text-xs text-white/95 leading-relaxed">
            {challenge.whatYouPerform || challenge.description}
          </p>
        </div>

        {/* Progress Tracker */}
        <div>
          <div className="flex items-center justify-between text-xs text-[#9298A3] font-mono mb-2">
            <span className="text-white font-medium">
              {challenge.joined ? `Day ${challenge.current} of ${challenge.target} completed` : `Not Started (0 of ${challenge.target} days)`}
            </span>
            <span className="text-[#3B82FF] font-bold">{progressPercent}%</span>
          </div>

          <div className="w-full h-2 bg-[#101010] rounded-full overflow-hidden border border-[#20242C]">
            <div
              className="h-full bg-[#2166FF] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Complete Challenge Screen View vs In-Progress Actions */}
        {isCompleted ? (
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2166FF]/20 via-[#080B10] to-[#101010] border border-[#2166FF]/40 text-center space-y-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-[#2166FF]/25 border border-[#2166FF]/50 mx-auto flex items-center justify-center text-[#3B82FF] shadow-lg shadow-[#2166FF]/30">
              <Trophy size={28} className="animate-bounce" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-1">
                🎉 CHALLENGE COMPLETED
              </span>
              <h2 className="text-base font-extrabold text-white">
                Sprint Milestone Achieved!
              </h2>
              <p className="text-xs text-[#9298A3] mt-1 max-w-xs mx-auto">
                You've successfully completed all {challenge.target} days of "{challenge.title}". All daily photo proofs and squad check-ins are verified.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 py-2 border-y border-[#20242C] text-left text-xs font-mono">
              <div className="bg-[#101010]/80 p-2.5 rounded-xl border border-[#20242C]">
                <span className="text-[10px] text-[#9298A3] block">TOTAL DAYS</span>
                <span className="text-sm font-bold text-white">{challenge.target} Days Logged</span>
              </div>
              <div className="bg-[#101010]/80 p-2.5 rounded-xl border border-[#20242C]">
                <span className="text-[10px] text-[#9298A3] block">SQUAD STATUS</span>
                <span className="text-sm font-bold text-emerald-400">100% Finished</span>
              </div>
            </div>

            {/* Restart Challenge Again Button per Requirement */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => onRestartChallenge?.(challenge.id)}
                className="w-full py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#2166FF]/30 transition-all cursor-pointer"
              >
                <Flame size={15} />
                <span>Restart Challenge Again (Day 1)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenCohortChat}
                  className="flex-1 py-2 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <MessageSquare size={13} className="text-[#3B82FF]" />
                  <span>Squad Proofs & Chat</span>
                </button>
                <button
                  type="button"
                  onClick={onBack}
                  className="px-3.5 py-2 rounded-xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-xs font-medium text-[#9298A3] hover:text-white transition-colors cursor-pointer"
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        ) : !challenge.joined ? (
          /* Not Joined Yet - Join Challenge & Cohort Chat */
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onToggleJoin?.(challenge.id)}
                className="py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#2166FF]/25 transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Join Challenge</span>
              </button>
              <button
                type="button"
                onClick={onOpenCohortChat}
                className="py-2.5 rounded-xl bg-[#10141E] hover:bg-[#1A2234] border border-[#202738] active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageSquare size={14} className="text-[#3B82FF]" />
                <span>Cohort Chat</span>
              </button>
            </div>
            <p className="text-[11px] text-[#9298A3] text-center">
              Join this challenge to participate in the cohort sprint and submit daily photo proofs.
            </p>
          </div>
        ) : (
          /* In Progress - Check-in Actions & Cohort Chat */
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowProofForm(true);
                  startCamera();
                }}
                className="py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg shadow-[#2166FF]/25 transition-all cursor-pointer"
              >
                <Camera size={14} />
                <span>Camera Check-In</span>
              </button>

              <button
                type="button"
                onClick={() => setShowProofForm(true)}
                className="py-2.5 rounded-xl bg-[#10141E] hover:bg-[#1A2234] border border-[#202738] active:scale-95 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <CheckCircle size={14} className="text-emerald-400" />
                <span>Check In / Proof</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenCohortChat}
              className="w-full py-2 rounded-xl bg-[#101010] hover:bg-[#161B26] border border-[#20242C] text-xs font-medium text-[#9298A3] hover:text-white flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageSquare size={13} className="text-[#3B82FF]" />
              <span>Cohort Discussions & Squad Proofs</span>
            </button>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle size={12} /> Active sprint in progress
              </span>

              {/* Leave Challenge button */}
              <button
                type="button"
                onClick={() => onToggleJoin?.(challenge.id)}
                className="text-[11px] text-red-400/80 hover:text-red-400 hover:underline cursor-pointer transition-colors"
                title="Leaves challenge and resets progress to Day 0"
              >
                Leave Challenge (Reset to Day 0)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Photo Proof Form Drawer */}
      {showProofForm && (
        <form onSubmit={handleSubmitProof} className="p-4 rounded-3xl bg-[#080B10] border border-[#2166FF]/40 mb-5 animate-fade-in space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#20242C]">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Camera size={14} className="text-[#3B82FF]" />
              Upload Photo Proof for Day {(challenge.current || 0) + 1}
            </h3>
            <button
              type="button"
              onClick={() => setShowProofForm(false)}
              className="text-[#9298A3] hover:text-white"
            >
              <X size={15} />
            </button>
          </div>

          <textarea
            value={proofNote}
            onChange={(e) => setProofNote(e.target.value)}
            placeholder="Add a caption or notes for today's proof (e.g. Read 28 pages, 5.2 km logged, shipped login flow)..."
            rows={2}
            className="w-full bg-[#101010] border border-[#20242C] rounded-xl p-2.5 text-xs text-white placeholder-[#9298A3] focus:outline-none focus:border-[#2166FF] resize-none"
          />

          {/* Photo attachment preview or Camera Viewfinder */}
          {isCameraActive ? (
            <div className="relative rounded-2xl overflow-hidden border-2 border-[#2166FF] bg-black aspect-video flex flex-col items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              {/* Camera Overlays */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-600/80 text-white text-[10px] font-semibold flex items-center gap-1 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                <span>LIVE CAMERA</span>
              </div>

              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleCameraFacing}
                  className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors border border-white/20"
                  title="Switch Camera (Front/Rear)"
                >
                  <RefreshCw size={13} />
                </button>
                <button
                  type="button"
                  onClick={stopCameraStream}
                  className="w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center cursor-pointer transition-colors border border-white/20"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Snap Button */}
              <div className="absolute bottom-3 inset-x-0 flex justify-center">
                <button
                  type="button"
                  onClick={handleCapturePhoto}
                  className="px-5 py-2 rounded-full bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-[#2166FF]/50 border-2 border-white cursor-pointer"
                >
                  <Camera size={16} />
                  <span>Take Progress Photo</span>
                </button>
              </div>
            </div>
          ) : proofPhoto ? (
            <div className="relative rounded-2xl overflow-hidden border border-[#20242C] aspect-video bg-[#101010]">
              <img src={proofPhoto} alt="Proof" className="w-full h-full object-cover" />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full bg-black/75 backdrop-blur-md text-[11px] font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <Check size={12} />
                <span>Photo Proof Attached</span>
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => startCamera()}
                  className="px-2.5 py-1 rounded-full bg-black/80 hover:bg-black text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer border border-white/20"
                  title="Retake photo"
                >
                  <Camera size={12} className="text-[#3B82FF]" />
                  <span>Retake</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProofPhoto(null)}
                  className="w-7 h-7 rounded-full bg-black/80 text-white flex items-center justify-center cursor-pointer hover:bg-black"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {/* Button 1: Open Device Camera directly */}
              <div
                onClick={() => startCamera()}
                className="p-3.5 rounded-2xl bg-[#121622] hover:bg-[#1C2336] border border-[#2166FF]/40 text-center cursor-pointer transition-all group flex flex-col items-center justify-center shadow-sm"
              >
                <div className="w-9 h-9 rounded-full bg-[#2166FF]/20 group-hover:bg-[#2166FF] flex items-center justify-center text-[#3B82FF] group-hover:text-white transition-colors mb-1.5">
                  <Camera size={18} />
                </div>
                <p className="text-xs font-bold text-white">Open Camera</p>
                <p className="text-[10px] text-[#8A92A6]">Take instant progress photo</p>
              </div>

              {/* Button 2: Choose from files / gallery */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-3.5 rounded-2xl bg-[#101010] hover:bg-[#1a1f29] border border-[#20242C] text-center cursor-pointer transition-all group flex flex-col items-center justify-center"
              >
                <div className="w-9 h-9 rounded-full bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-[#8A92A6] group-hover:text-white transition-colors mb-1.5">
                  <ImageIcon size={18} />
                </div>
                <p className="text-xs font-semibold text-white">From Gallery</p>
                <p className="text-[10px] text-[#8A92A6]">Upload file / screenshot</p>
              </div>
            </div>
          )}

          {cameraError && (
            <p className="text-[11px] text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
              {cameraError}
            </p>
          )}

          {/* Quick presets */}
          <div className="flex items-center gap-2 text-[11px] pt-0.5">
            <span className="text-[#9298A3]">Or sample proof:</span>
            <button
              type="button"
              onClick={() => handleUseSamplePhoto('code')}
              className="px-2 py-0.5 rounded bg-[#101010] hover:bg-[#20242C] text-[#9298A3] hover:text-white border border-[#20242C] cursor-pointer"
            >
              + Code Screenshot
            </button>
            <button
              type="button"
              onClick={() => handleUseSamplePhoto('runner')}
              className="px-2 py-0.5 rounded bg-[#101010] hover:bg-[#20242C] text-[#9298A3] hover:text-white border border-[#20242C] cursor-pointer"
            >
              + Run GPS
            </button>
          </div>

          {/* Feature 3: Option "Add as daily proof" */}
          <div 
            onClick={() => setAddAsDailyProof(!addAsDailyProof)}
            className="flex items-center justify-between p-3 rounded-2xl bg-[#10141E] border border-[#202738] cursor-pointer hover:border-[#2166FF]/50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="text-[#2166FF]">
                {addAsDailyProof ? <CheckSquare size={17} /> : <Square size={17} className="text-[#8A92A6]" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Add as daily proof</p>
                <p className="text-[10px] text-[#8A92A6]">Publishes this check-in to your public feed as proof of work</p>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#2166FF]/20 text-[#3B82FF]">
              {addAsDailyProof ? 'Active' : 'Off'}
            </span>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {/* Native device camera input with capture attribute */}
          <input
            type="file"
            ref={cameraInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            capture="environment"
            className="hidden"
          />

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] active:scale-95 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#2166FF]/25 transition-all cursor-pointer"
          >
            <CheckCircle size={15} />
            <span>Confirm & Check In {addAsDailyProof ? '(+ Post as Daily Proof)' : ''}</span>
          </button>
        </form>
      )}

      {/* Cohort Proofs Feed (if any exists for this challenge) */}
      {challenge.squadProofs && challenge.squadProofs.length > 0 && (
        <div className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C] mb-4 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Camera size={13} className="text-[#3B82FF]" />
              <span>Recent Cohort Proofs</span>
            </h3>
            <span className="text-[11px] text-[#8A92A6] font-mono">{challenge.squadProofs.length} proofs</span>
          </div>

          <div className="space-y-2.5">
            {challenge.squadProofs.slice(0, 4).map((proof) => (
              <div key={proof.id} className="p-3 rounded-2xl bg-[#10141E] border border-[#202738] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={proof.author.avatar}
                      alt={proof.author.name}
                      className="w-6 h-6 rounded-full object-cover border border-[#202738]"
                    />
                    <span className="text-xs font-semibold text-white">{proof.author.name}</span>
                    <span className="text-[10px] text-[#8A92A6] font-mono">Day {proof.dayNumber}</span>
                  </div>

                  {/* Feature 3: Option beside challenge post - add as daily proof */}
                  {onPostAsDailyProof && (
                    <button
                      type="button"
                      onClick={() => onPostAsDailyProof(
                        `🎯 [Day ${proof.dayNumber} Proof for ${challenge.title}]\n\n${proof.note}`,
                        proof.photoUrl,
                        challenge.title
                      )}
                      className="px-2.5 py-1 rounded-full bg-[#2166FF]/15 hover:bg-[#2166FF] text-[#3B82FF] hover:text-white border border-[#2166FF]/30 text-[10px] font-semibold transition-all cursor-pointer flex items-center gap-1"
                      title="Post as verified daily proof"
                    >
                      <Share2 size={11} />
                      <span>Add as daily proof</span>
                    </button>
                  )}
                </div>

                <p className="text-xs text-white/90 leading-relaxed">{proof.note}</p>

                {proof.photoUrl && (
                  <div className="rounded-xl overflow-hidden aspect-video border border-[#202738] bg-black">
                    <img src={proof.photoUrl} alt="Cohort proof" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Challenge Rules & Cohort Overview */}
      <div className="p-4 rounded-3xl bg-[#080B10] border border-[#20242C] space-y-2.5">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
          Accountability Sprint Guidelines
        </h3>
        <ul className="text-xs text-[#9298A3] space-y-1.5 list-disc list-inside">
          <li>Check in daily before 11:59 PM to maintain your accountability streak.</li>
          <li>Photograph authentic proof: book annotations, git logs, or workout data.</li>
          <li>Support cohort members in the discussion channel to unlock squad momentum.</li>
        </ul>
      </div>
    </div>
  );
};
