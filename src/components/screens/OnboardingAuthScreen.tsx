import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowRight, 
  ChevronLeft, 
  Mail, 
  Lock, 
  User, 
  AtSign, 
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  Camera,
  Crop,
  Upload,
  CheckSquare,
  Square,
  FileText,
  Shield,
  Flame,
  Users as UsersIcon,
  UsersRound,
  TrendingUp
} from 'lucide-react';
import { Author } from '../../types';
import { supabase, syncProfileToSupabase, isValidUUID, uploadMediaToSupabase } from '../../lib/supabase';
import { OTHER_USERS } from '../../data/initialData';
import { ImageCropModal } from '../modals/ImageCropModal';
import { PRIVACY_POLICY_CONTENT, TERMS_AND_CONDITIONS_CONTENT } from '../../data/legalText';

interface OnboardingAuthScreenProps {
  onComplete: (user: Author, selectedInterests: string[], authSession?: { provider: 'google' | 'email' | 'guest'; email?: string }) => void;
  initialUser?: Author;
  allCommunities?: any[];
}

export type OnboardingStep = 'welcome' | 'terms' | 'auth' | 'profile';

export const OnboardingAuthScreen: React.FC<OnboardingAuthScreenProps> = ({
  onComplete,
  initialUser,
}) => {
  // 4 onboarding steps: 'welcome' -> 'terms' -> 'auth' -> 'profile'
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [termsTab, setTermsTab] = useState<'privacy' | 'terms'>('privacy');
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState<boolean>(false);

  // Auth state
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [appleAlert, setAppleAlert] = useState(false);
  const [authProvider, setAuthProvider] = useState<'google' | 'email' | 'guest'>('email');
  const [cameFromDirectLogin, setCameFromDirectLogin] = useState(false);

  // Screen 2: Name, username, bio, avatar state
  const [name, setName] = useState(initialUser?.name || '');
  const [username, setUsername] = useState(initialUser?.username || '');
  const [bio, setBio] = useState(initialUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    initialUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  );
  const [userId, setUserId] = useState<string>(initialUser?.id || `user_${Date.now()}`);
  const [googleUserNote, setGoogleUserNote] = useState<string | null>(null);

  // Avatar upload and cropping state
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [rawImageForCrop, setRawImageForCrop] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time unique username validation state
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [usernameMessage, setUsernameMessage] = useState<string | null>(null);
  const checkTimeoutRef = useRef<any>(null);

  // Reserved usernames list (system handles & known creators)
  const reservedUsernames = new Set([
    'admin', 'daily', 'builder', 'official', 'support', 'help', 'system', 'root', 'bot',
    ...Object.keys(OTHER_USERS).map((u) => u.toLowerCase()),
    ...Object.values(OTHER_USERS).map((u) => u.username.toLowerCase())
  ]);

  // Handle returning from Google OAuth or window focus reset if user closed popup without completing
  useEffect(() => {
    let resetTimer: any = null;

    const handleWindowFocusOrVisibility = async () => {
      if (authLoading && authProvider === 'google') {
        resetTimer = setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.user) {
            setAuthLoading(false);
          }
        }, 1200);
      }
    };

    window.addEventListener('focus', handleWindowFocusOrVisibility);
    document.addEventListener('visibilitychange', handleWindowFocusOrVisibility);

    return () => {
      window.removeEventListener('focus', handleWindowFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleWindowFocusOrVisibility);
      if (resetTimer) clearTimeout(resetTimer);
    };
  }, [authLoading, authProvider]);

  // Check if user is already authenticated via Supabase session
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        setUserId(u.id);
        const meta = u.user_metadata || {};
        const provider = (u.app_metadata?.provider as any) || 'google';

        // Check if user already has an existing profile in public.profiles table
        const { data: dbProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .maybeSingle();

        if (dbProfile && (dbProfile.username || meta.onboarding_completed)) {
          // User already has an account! Load that specific account and redirect immediately to the main app!
          const loadedUser: Author = {
            id: u.id,
            name: dbProfile.name || meta.name || 'Daily Builder',
            username: dbProfile.username || 'builder',
            avatar: dbProfile.avatar_url || meta.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            bio: dbProfile.bio || '',
            isCurrentUser: true,
            followersCount: dbProfile.followers_count || 0,
            followingCount: dbProfile.following_count || 0,
            accountabilityHubPrivacy: (dbProfile.accountability_hub_privacy as any) || 'public',
          };

          onComplete(loadedUser, ['Coding & Tech', 'Startups & SaaS', 'Daily Habits'], {
            provider,
            email: u.email,
          });
          return;
        }

        const derivedName = meta.name || meta.full_name || u.email?.split('@')[0] || '';
        const rawHandle = meta.username || u.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_.]/g, '') || '';
        const derivedAvatar = meta.avatar_url || '';

        if (derivedName) setName(derivedName);
        if (derivedAvatar) setAvatarUrl(derivedAvatar);
        setEmail(u.email || '');
        setAuthProvider(provider);

        if (provider === 'google' || u.app_metadata?.provider === 'google') {
          setGoogleUserNote(`Google account verified (${u.email}). Pick your unique handle below to complete setup.`);
        }

        if (rawHandle) {
          setUsername(rawHandle);
          checkUsernameAvailability(rawHandle, u.id);
        }

        // Advance to Step 'profile' to prompt for custom Name, Username, and Bio for new signups
        setStep('profile');
      }
    });
  }, []);

  // Validate unique username against local reserved list and Supabase public.profiles
  const checkUsernameAvailability = async (candidate: string, currentUserId?: string) => {
    const clean = candidate.trim().toLowerCase().replace(/^@/, '');
    if (!clean) {
      setUsernameStatus('idle');
      setUsernameMessage(null);
      return;
    }

    if (clean.length < 3) {
      setUsernameStatus('invalid');
      setUsernameMessage('Username must be at least 3 characters.');
      return;
    }

    if (!/^[a-z0-9_.]+$/.test(clean)) {
      setUsernameStatus('invalid');
      setUsernameMessage('Only lowercase letters, numbers, underscores (_), and dots (.) are allowed.');
      return;
    }

    // Check system reserved handles & known mock creators
    if (reservedUsernames.has(clean)) {
      setUsernameStatus('taken');
      setUsernameMessage(`@${clean} is reserved or already taken. Please choose another.`);
      return;
    }

    setUsernameStatus('checking');
    setUsernameMessage('Checking availability...');

    try {
      const activeId = currentUserId || userId;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username')
        .ilike('username', clean)
        .limit(1);

      if (error) {
        // Table may be empty or not yet seeded; treat as available
        setUsernameStatus('available');
        setUsernameMessage(`@${clean} is available!`);
        return;
      }

      if (data && data.length > 0) {
        if (data[0].id === activeId) {
          setUsernameStatus('available');
          setUsernameMessage(`@${clean} is your current username.`);
        } else {
          setUsernameStatus('taken');
          setUsernameMessage(`@${clean} is already taken by another user. Please choose another.`);
        }
      } else {
        setUsernameStatus('available');
        setUsernameMessage(`@${clean} is available!`);
      }
    } catch (e) {
      setUsernameStatus('available');
      setUsernameMessage(`@${clean} is available!`);
    }
  };

  const handleUsernameChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9_.]/g, '');
    setUsername(clean);

    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current);
    if (!clean) {
      setUsernameStatus('idle');
      setUsernameMessage(null);
      return;
    }

    setUsernameStatus('checking');
    checkTimeoutRef.current = setTimeout(() => {
      checkUsernameAvailability(clean, userId);
    }, 300);
  };

  // Handle Google OAuth via Supabase
  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMessage(null);
    setAuthProvider('google');

    // Safety timeout: if popup closes or user navigates back without completing, reset loading after 6s
    setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setAuthLoading(false);
      }
    }, 6000);

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });

      if (error) {
        if (
          error.message?.toLowerCase().includes('not enabled') || 
          error.message?.toLowerCase().includes('unsupported provider')
        ) {
          setAuthError(
            'Google OAuth is not enabled in your Supabase project dashboard yet. To activate it, go to Supabase Console > Authentication > Providers > Google, enable the toggle, and paste your Google Client ID & Secret. You can also sign up or log in instantly using Email below!'
          );
        } else {
          setAuthError(error.message);
        }
        setAuthLoading(false);
      } else if (data?.url) {
        // Redirect to Google authentication page
        window.location.href = data.url;
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to initiate Google login.');
      setAuthLoading(false);
    }
  };

  const handleAppleLogin = () => {
    setAppleAlert(true);
  };

  const handleContinueAsGuest = () => {
    setAuthProvider('guest');
    const guestId = `guest_${Date.now()}`;
    setUserId(guestId);
    const randomNum = Math.floor(100 + Math.random() * 899);
    setName(`Daily Builder`);
    const guestUsername = `builder_${randomNum}`;
    setUsername(guestUsername);
    checkUsernameAvailability(guestUsername, guestId);
    setStep('profile');
  };

  // Handle Email Login / Signup via Supabase
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMessage(null);
    setAuthProvider('email');

    try {
      if (authMode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          setAuthError(error.message);
          setAuthLoading(false);
          return;
        }

        if (data?.user) {
          const u = data.user;
          // Look up user profile to load that specific account and redirect immediately to the main app!
          const { data: dbProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', u.id)
            .maybeSingle();

          const finalName = dbProfile?.name || u.user_metadata?.name || u.user_metadata?.full_name || email.split('@')[0];
          const finalUsername = dbProfile?.username || u.user_metadata?.username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');
          const finalAvatar = dbProfile?.avatar_url || u.user_metadata?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';
          const finalBio = dbProfile?.bio || u.user_metadata?.bio || 'Building daily consistency and verifiable discipline.';

          const loggedInUser: Author = {
            id: u.id,
            name: finalName,
            username: finalUsername,
            avatar: finalAvatar,
            bio: finalBio,
            isCurrentUser: true,
            isFollowing: false,
            followersCount: dbProfile?.followers_count || 0,
            followingCount: dbProfile?.following_count || 0,
            accountabilityHubPrivacy: (dbProfile?.accountability_hub_privacy as any) || 'public',
          };

          setAuthLoading(false);
          // Redirect immediately to the main app!
          onComplete(loggedInUser, ['Coding & Tech', 'Startups & SaaS', 'Daily Habits'], {
            provider: 'email',
            email: u.email,
          });
          return;
        }
      } else {
        // Sign up mode
        const derivedName = name.trim() || (email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1));
        const derivedUsername = username.trim().replace(/^@/, '') || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              name: derivedName,
              username: derivedUsername,
            },
          },
        });

        if (error) {
          setAuthError(error.message);
          setAuthLoading(false);
          return;
        }

        if (data?.session && data?.user) {
          // Immediately confirmed and logged in
          setUserId(data.user.id);
          setName(derivedName);
          setUsername(derivedUsername);
          checkUsernameAvailability(derivedUsername, data.user.id);
          setStep('profile');
        } else if (data?.user) {
          // Email confirmation is required by Supabase project settings
          setUserId(data.user.id);
          setName(derivedName);
          setUsername(derivedUsername);
          setAuthSuccessMessage(
            `Account created! A confirmation email has been sent to ${email}. Check your inbox to confirm, or click "Log In" if your Supabase project does not require email confirmation.`
          );
        }
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred during authentication.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Screen 2: Finish Onboarding & Save Unique Profile
  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalName = name.trim() || 'Daily Builder';
    const finalUsername = username.trim().toLowerCase().replace(/^@/, '');
    const finalBio = bio.trim() || 'Building daily consistency and verifiable discipline.';
    const finalAvatar = avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80';

    if (!finalUsername) {
      setAuthError('Please choose a valid username handle.');
      return;
    }

    if (usernameStatus === 'taken' || usernameStatus === 'invalid') {
      setAuthError(usernameMessage || 'Please choose an available username.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);

    let resolvedAvatar = finalAvatar;

    try {
      // Re-verify uniqueness against public.profiles right before saving
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || (isValidUUID(userId) ? userId : undefined);

      if (activeUserId) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id, username')
          .ilike('username', finalUsername)
          .limit(1);

        if (existingUser && existingUser.length > 0 && existingUser[0].id !== activeUserId) {
          setUsernameStatus('taken');
          setUsernameMessage(`@${finalUsername} is already taken by someone else.`);
          setAuthError(`Username @${finalUsername} is already taken. Please choose another.`);
          setAuthLoading(false);
          return;
        }
      }

      // Upload cropped avatar to Supabase Storage if it is a Data URL
      if (finalAvatar.startsWith('data:') && activeUserId) {
        try {
          resolvedAvatar = await uploadMediaToSupabase('avatars', finalAvatar, `avatar_${activeUserId}`);
        } catch {
          resolvedAvatar = finalAvatar;
        }
      }

      // Sync profile to Supabase public.profiles table
      if (activeUserId) {
        await syncProfileToSupabase({
          id: activeUserId,
          name: finalName,
          username: finalUsername,
          avatar: resolvedAvatar,
          bio: finalBio,
        });

        // Update user metadata in Supabase Auth (avoid passing huge base64 strings to metadata)
        const metaUpdate: any = {
          name: finalName,
          username: finalUsername,
          bio: finalBio,
          onboarding_completed: true,
        };
        if (resolvedAvatar.startsWith('http')) {
          metaUpdate.avatar_url = resolvedAvatar;
        }
        await supabase.auth.updateUser({
          data: metaUpdate,
        });
      }
    } catch (err: any) {
      console.warn('Profile sync notice:', err);
    }

    const effectiveId = userId && isValidUUID(userId) ? userId : (initialUser?.id || `user_${Date.now()}`);
    const finalUser: Author = {
      id: effectiveId,
      name: finalName,
      username: finalUsername,
      avatar: resolvedAvatar,
      bio: finalBio,
      isCurrentUser: true,
      isFollowing: false,
      followersCount: 0,
      followingCount: 0,
      accountabilityHubPrivacy: 'public',
    };

    setAuthLoading(false);
    onComplete(finalUser, ['Coding & Tech', 'Startups & SaaS', 'Daily Habits'], {
      provider: authProvider,
      email: email || undefined,
    });
  };

  const renderLegalDocument = (content: string) => {
    return content.split('\n\n').map((paragraph, idx) => {
      const trimmed = paragraph.trim();
      if (!trimmed) return null;
      if (trimmed.startsWith('# ')) {
        return (
          <h2 key={idx} className="text-sm font-bold text-white mb-2 pt-1 border-b border-[#202738] pb-1">
            {trimmed.replace('# ', '')}
          </h2>
        );
      }
      if (trimmed.startsWith('## ')) {
        return (
          <h3 key={idx} className="text-xs font-bold text-[#3B82FF] uppercase tracking-wider mt-3 mb-1">
            {trimmed.replace('## ', '')}
          </h3>
        );
      }
      if (trimmed.startsWith('### ')) {
        return (
          <h4 key={idx} className="text-xs font-semibold text-white/95 mt-2 mb-0.5">
            {trimmed.replace('### ', '')}
          </h4>
        );
      }
      if (trimmed.startsWith('- ')) {
        const items = trimmed.split('\n').filter(Boolean);
        return (
          <ul key={idx} className="list-disc list-inside space-y-1 text-[11px] text-[#9298A3] my-1">
            {items.map((item, iIdx) => (
              <li key={iIdx}>{item.replace(/^-\s*/, '')}</li>
            ))}
          </ul>
        );
      }
      return (
        <p key={idx} className="text-[11px] text-[#9298A3] leading-relaxed my-1">
          {trimmed}
        </p>
      );
    });
  };

  // If on the welcome step, render the starting page matching the user's design
  if (step === 'welcome') {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col justify-between px-6 py-10 sm:py-14 max-w-md mx-auto w-full font-sans select-none animate-fade-in relative">
        {/* Top: Daily Logo + Headline + Subtitle */}
        <div className="pt-6 sm:pt-10 text-center flex flex-col items-center">
          {/* Daily Brand Logo matching the uploaded screenshot */}
          <div className="mb-6 flex items-center justify-center">
            <svg
              className="h-12 sm:h-14 w-auto overflow-visible"
              viewBox="0 0 150 46"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Custom 'D' with inner play triangle */}
              <path
                d="M4 4h14.5c10.8 0 17.5 7.2 17.5 19s-6.7 19-17.5 19H4V4zm7.5 6.5v25h7c6.8 0 10.5-4.8 10.5-12.5S25.3 10.5 18.5 10.5h-7z"
                fill="#FFFFFF"
              />
              {/* Vibrant blue play triangle in bowl */}
              <path
                d="M11.5 11.5l14 11.5-14 11.5V11.5z"
                fill="#2166FF"
              />
              {/* 'aily' */}
              <text
                x="39"
                y="37"
                fill="#FFFFFF"
                fontSize="41"
                fontWeight="700"
                fontFamily="'Plus Jakarta Sans', system-ui, -apple-system, sans-serif"
                letterSpacing="-0.03em"
              >
                aily
              </text>
            </svg>
          </div>

          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-white leading-tight">
            Show what you’re doing.
          </h1>
          <p className="text-sm sm:text-[15px] text-[#8A92A6] mt-2 font-normal">
            Your progress. Your people. Your world.
          </p>
        </div>

        {/* Middle: 4 Feature Rows */}
        <div className="my-auto py-8 sm:py-10 max-w-xs mx-auto w-full space-y-7 sm:space-y-8">
          {/* Share / your moments */}
          <div className="flex items-center gap-5 text-left">
            <div className="w-9 h-9 flex items-center justify-center shrink-0 text-[#2166FF]">
              <User size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-[17px] font-semibold text-white leading-tight">
                Share
              </h3>
              <p className="text-xs sm:text-sm text-[#8A92A6] mt-0.5 font-normal">
                your moments
              </p>
            </div>
          </div>

          {/* Discover / like-minded people */}
          <div className="flex items-center gap-5 text-left">
            <div className="w-9 h-9 flex items-center justify-center shrink-0 text-[#2166FF]">
              <UsersIcon size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-[17px] font-semibold text-white leading-tight">
                Discover
              </h3>
              <p className="text-xs sm:text-sm text-[#8A92A6] mt-0.5 font-normal">
                like-minded people
              </p>
            </div>
          </div>

          {/* Join / communities */}
          <div className="flex items-center gap-5 text-left">
            <div className="w-9 h-9 flex items-center justify-center shrink-0 text-[#2166FF]">
              <UsersRound size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-[17px] font-semibold text-white leading-tight">
                Join
              </h3>
              <p className="text-xs sm:text-sm text-[#8A92A6] mt-0.5 font-normal">
                communities
              </p>
            </div>
          </div>

          {/* Track / your progress */}
          <div className="flex items-center gap-5 text-left">
            <div className="w-9 h-9 flex items-center justify-center shrink-0 text-[#2166FF]">
              <TrendingUp size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-[17px] font-semibold text-white leading-tight">
                Track
              </h3>
              <p className="text-xs sm:text-sm text-[#8A92A6] mt-0.5 font-normal">
                your progress
              </p>
            </div>
          </div>
        </div>

        {/* Bottom: Get Started button + Log in link */}
        <div className="pb-4 sm:pb-6 w-full max-w-sm mx-auto">
          <button
            type="button"
            onClick={() => setStep('terms')}
            className="w-full h-14 rounded-full bg-[#2166FF] hover:bg-[#3476FF] active:scale-[0.99] text-base font-semibold text-white flex items-center justify-center gap-2.5 shadow-lg shadow-[#2166FF]/25 transition-all cursor-pointer"
          >
            <span>Get Started</span>
            <ArrowRight size={19} className="stroke-[2.5]" />
          </button>

          <div className="text-center mt-4">
            <span className="text-xs sm:text-sm text-[#8A92A6]">
              Already have an account?{' '}
            </span>
            <button
              type="button"
              onClick={() => {
                setCameFromDirectLogin(true);
                setAuthMode('login');
                setStep('auth');
              }}
              className="text-xs sm:text-sm font-semibold text-[#2166FF] hover:text-[#3B82FF] transition-colors cursor-pointer"
            >
              Log in
            </button>
          </div>

          {/* Mobile indicator bar */}
          <div className="w-32 h-1 bg-white/20 rounded-full mx-auto mt-6 hidden sm:block" />
        </div>
      </div>
    );
  }

  const stepNumber = step === 'terms' ? 2 : step === 'auth' ? 3 : 4;

  return (
    <div className="min-h-screen bg-[#05070B] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Subtle Minimalist Ambient Sheen */}
      <div className="absolute inset-0 bg-[radial-gradient(#141B2D_1px,transparent_1px)] [background-size:28px_28px] opacity-20 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] bg-[#2166FF]/6 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Minimalist Card */}
      <div className="w-full max-w-lg bg-[#090C13] border border-[#1C2230] rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        
        {/* Sleek Minimalist 4-Segment Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tight text-white">
                DAILY<span className="text-[#2166FF]">.</span>
              </span>
              <span className="text-[#3B82FF]/40">/</span>
              <span className="text-[11px] font-mono tracking-wider uppercase text-[#8A92A6]">
                {step === 'terms' && '02 · Legal Terms'}
                {step === 'auth' && '03 · Authentication'}
                {step === 'profile' && '04 · Identity'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (step === 'terms') setStep('welcome');
                if (step === 'auth') {
                  if (cameFromDirectLogin) {
                    setStep('welcome');
                  } else {
                    setStep('terms');
                  }
                }
                if (step === 'profile') setStep('auth');
              }}
              className="text-xs text-[#8A92A6] hover:text-white flex items-center gap-1 cursor-pointer transition-colors font-medium"
            >
              <ChevronLeft size={14} />
              <span>Back</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5 h-1 w-full bg-white/[0.05] rounded-full overflow-hidden">
            <div className={`h-full transition-all duration-300 ${stepNumber >= 1 ? 'bg-[#2166FF]' : 'bg-transparent'}`} />
            <div className={`h-full transition-all duration-300 ${stepNumber >= 2 ? 'bg-[#2166FF]' : 'bg-transparent'}`} />
            <div className={`h-full transition-all duration-300 ${stepNumber >= 3 ? 'bg-[#2166FF]' : 'bg-transparent'}`} />
            <div className={`h-full transition-all duration-300 ${stepNumber >= 4 ? 'bg-[#2166FF]' : 'bg-transparent'}`} />
          </div>
        </div>

        {/* ================= STEP 2: TERMS AND CONDITIONS & PRIVACY POLICY ================= */}
        {step === 'terms' && (
          <div className="space-y-5 animate-fade-in text-left">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#2166FF] font-semibold block">
                Compliance & Trust
              </span>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Terms & Privacy Policy
              </h1>
              <p className="text-xs text-[#8A92A6] leading-relaxed">
                Please review and accept our policies before creating your Daily account.
              </p>
            </div>

            {/* Tab switch between Privacy Policy and Terms & Conditions */}
            <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-[#1C2230] text-xs">
              <button
                type="button"
                onClick={() => setTermsTab('privacy')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  termsTab === 'privacy'
                    ? 'bg-[#2166FF] text-white shadow-sm'
                    : 'text-[#8A92A6] hover:text-white'
                }`}
              >
                <FileText size={13} />
                <span>Privacy Policy</span>
              </button>
              <button
                type="button"
                onClick={() => setTermsTab('terms')}
                className={`flex-1 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                  termsTab === 'terms'
                    ? 'bg-[#2166FF] text-white shadow-sm'
                    : 'text-[#8A92A6] hover:text-white'
                }`}
              >
                <ShieldCheck size={13} />
                <span>Terms & Conditions</span>
              </button>
            </div>

            {/* Scrollable Reader */}
            <div className="max-h-60 overflow-y-auto p-4 bg-[#05070B] border border-[#1C2230] rounded-2xl text-left text-xs leading-relaxed space-y-2 select-text scrollbar-thin scrollbar-thumb-white/10">
              {renderLegalDocument(termsTab === 'privacy' ? PRIVACY_POLICY_CONTENT : TERMS_AND_CONDITIONS_CONTENT)}
            </div>

            {/* Agreement Checkbox */}
            <div
              onClick={() => setHasAcceptedTerms(!hasAcceptedTerms)}
              className="p-3.5 rounded-2xl bg-[#0B0F19] border border-[#1C2230] hover:border-[#2A3348] flex items-start gap-3 cursor-pointer transition-colors"
            >
              <div className="text-[#2166FF] mt-0.5 shrink-0">
                {hasAcceptedTerms ? <CheckSquare size={17} /> : <Square size={17} className="text-[#555E70]" />}
              </div>
              <p className="text-xs text-white/90 select-none leading-snug">
                I have read and agree to the <strong className="text-white">Daily Privacy Policy</strong> and <strong className="text-white">Terms & Conditions</strong>.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="py-2.5 px-4 rounded-xl bg-[#121622] hover:bg-[#181D2B] text-xs font-semibold text-[#8A92A6] hover:text-white border border-[#202738] transition-colors cursor-pointer"
              >
                Back
              </button>

              <button
                type="button"
                disabled={!hasAcceptedTerms}
                onClick={() => setStep('auth')}
                className="flex-1 py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#3476FF] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-[#2166FF]/25 transition-all cursor-pointer"
              >
                <span>Accept & Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ================= STEP 3: LOGIN / SIGNUP ================= */}
        {step === 'auth' && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {authMode === 'signup' ? 'Create Your Account' : 'Welcome Back'}
              </h1>
              <p className="text-xs text-[#8A92A6]">
                Show up daily. Track verified accountability.
              </p>
            </div>

            {/* Error Message Alert */}
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5 animate-shake">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-200 leading-relaxed break-words">
                    {authError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthError(null)}
                  className="text-xs text-red-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Success Message Alert */}
            {authSuccessMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-2.5">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-emerald-200 leading-relaxed">
                    {authSuccessMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthSuccessMessage(null)}
                  className="text-xs text-emerald-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Apple login not available notification */}
            {appleAlert && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-amber-200">
                    Apple login is currently not enabled. Please sign in with Google or Email.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAppleAlert(false)}
                  className="text-xs text-amber-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Social Logins */}
            <div className="space-y-2">
              <button
                type="button"
                disabled={authLoading}
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-[#121620] hover:bg-[#1A2030] disabled:opacity-50 border border-[#202738] text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-colors cursor-pointer shadow-sm"
              >
                {authLoading && authProvider === 'google' ? (
                  <Loader2 size={16} className="animate-spin text-[#3B82FF]" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </button>

              {authLoading && authProvider === 'google' && (
                <button
                  type="button"
                  onClick={() => setAuthLoading(false)}
                  className="w-full py-1 text-[11px] text-[#8A92A6] hover:text-white underline cursor-pointer text-center transition-colors"
                >
                  Cancel Google Sign In
                </button>
              )}

              <button
                type="button"
                onClick={handleAppleLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-[#121620] hover:bg-[#1A2030] border border-[#202738] text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4 fill-white shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.63-.76 1.05-1.82.93-2.87-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.74-.95 2.78 1.02.08 2.06-.52 2.69-1.28z" />
                </svg>
                <span>Continue with Apple</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[#555E70] uppercase tracking-wider font-mono">
              <div className="flex-1 h-px bg-[#1C2230]" />
              <span>or email</span>
              <div className="flex-1 h-px bg-[#1C2230]" />
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="flex bg-[#121620] p-1 rounded-xl border border-[#202738] text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                    setAuthLoading(false);
                  }}
                  className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    authMode === 'signup' ? 'bg-[#2166FF] text-white shadow-sm' : 'text-[#8A92A6] hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                    setAuthLoading(false);
                  }}
                  className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    authMode === 'login' ? 'bg-[#2166FF] text-white shadow-sm' : 'text-[#8A92A6] hover:text-white'
                  }`}
                >
                  Log In
                </button>
              </div>

              {/* Email Input */}
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555E70]" />
                <input
                  type="email"
                  required
                  value={email}
                  onFocus={() => {
                    if (authProvider === 'google') setAuthLoading(false);
                  }}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (authProvider === 'google') setAuthLoading(false);
                  }}
                  placeholder="name@email.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-[#121620] border border-[#202738] focus:border-[#2166FF] rounded-xl text-xs text-white placeholder-[#555E70] outline-none transition-colors"
                />
              </div>

              {/* Password Input with Show/Hide Toggle */}
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555E70]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onFocus={() => {
                    if (authProvider === 'google') setAuthLoading(false);
                  }}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (authProvider === 'google') setAuthLoading(false);
                  }}
                  placeholder="Password (minimum 6 characters)"
                  className="w-full pl-9 pr-10 py-2.5 bg-[#121620] border border-[#202738] focus:border-[#2166FF] rounded-xl text-xs text-white placeholder-[#555E70] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555E70] hover:text-white transition-colors cursor-pointer p-0.5"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#1A52CC] disabled:opacity-50 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-[#2166FF]/20"
              >
                {authLoading && authProvider === 'email' ? (
                  <Loader2 size={15} className="animate-spin text-white" />
                ) : (
                  <>
                    <span>{authMode === 'signup' ? 'Create Account' : 'Log In'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ================= STEP 4: NAME, UNIQUE USERNAME, BIO ================= */}
        {step === 'profile' && (
          <form onSubmit={handleFinish} className="space-y-4 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-1.5">
                <span>Customize Your Profile</span>
                <Sparkles size={16} className="text-[#3B82FF]" />
              </h2>
              <p className="text-xs text-[#8A92A6]">
                Choose your public name, unique handle, and daily bio.
              </p>
            </div>

            {/* Google Verified Banner */}
            {googleUserNote && (
              <div className="p-2.5 rounded-xl bg-[#2166FF]/10 border border-[#2166FF]/25 flex items-center gap-2 text-xs text-[#60A5FA]">
                <ShieldCheck size={16} className="text-[#3B82FF] shrink-0" />
                <span className="truncate">{googleUserNote}</span>
              </div>
            )}

            {/* Error Message Alert */}
            {authError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-red-200 leading-relaxed break-words">
                    {authError}
                  </p>
                </div>
              </div>
            )}

            {/* Avatar Preview & Attachment / Cropping */}
            <div className="p-3.5 rounded-2xl bg-[#121620] border border-[#202738] space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="relative group shrink-0">
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full object-cover border-2 border-[#2166FF] shadow-md"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Change profile picture"
                    className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                  >
                    <Camera size={16} />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{name || 'Your Name'}</p>
                  <p className="text-[11px] font-mono text-[#3B82FF] truncate">
                    @{username || 'handle'}
                  </p>
                  <p className="text-[10px] text-[#717B90]">
                    Upload custom photo or crop to 1:1 circle
                  </p>
                </div>
              </div>

              {/* Upload & Crop Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#1C2230]">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#181D2A] hover:bg-[#202738] border border-[#2A3348] text-[11px] font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Upload size={13} className="text-[#3B82FF]" />
                  <span>Attach Photo</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRawImageForCrop(avatarUrl);
                    setIsCropModalOpen(true);
                  }}
                  className="flex-1 py-1.5 px-2.5 rounded-xl bg-[#181D2A] hover:bg-[#202738] border border-[#2A3348] text-[11px] font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Crop size={13} className="text-[#10B981]" />
                  <span>Crop Photo</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const dataUrl = event.target?.result as string;
                    if (dataUrl) {
                      setRawImageForCrop(dataUrl);
                      setIsCropModalOpen(true);
                    }
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />
            </div>

            <div className="space-y-3">
              {/* Display Name */}
              <div>
                <label className="text-[11px] font-semibold text-[#8A92A6] block mb-1">
                  Display Name
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555E70]" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!username) {
                        handleUsernameChange(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
                      }
                    }}
                    placeholder="e.g. Alex Chen"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#121620] border border-[#202738] focus:border-[#2166FF] rounded-xl text-xs text-white placeholder-[#555E70] outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Unique Username Handle Field */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-[#8A92A6]">
                    Username Handle <span className="text-[#3B82FF]">*Unique</span>
                  </label>
                  {usernameStatus === 'checking' && (
                    <span className="text-[10px] text-[#3B82FF] flex items-center gap-1 font-mono">
                      <Loader2 size={11} className="animate-spin" />
                      Checking...
                    </span>
                  )}
                  {usernameStatus === 'available' && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono font-bold">
                      <Check size={11} />
                      Available
                    </span>
                  )}
                  {usernameStatus === 'taken' && (
                    <span className="text-[10px] text-red-400 flex items-center gap-1 font-mono font-bold">
                      ✕ Taken
                    </span>
                  )}
                </div>

                <div className="relative">
                  <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555E70]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="username"
                    className={`w-full pl-9 pr-8 py-2.5 bg-[#121620] border rounded-xl text-xs text-white font-mono placeholder-[#555E70] outline-none transition-colors ${
                      usernameStatus === 'available'
                        ? 'border-emerald-500/60 focus:border-emerald-500'
                        : usernameStatus === 'taken' || usernameStatus === 'invalid'
                        ? 'border-red-500/60 focus:border-red-500'
                        : 'border-[#202738] focus:border-[#2166FF]'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <Loader2 size={13} className="animate-spin text-[#3B82FF]" />
                    )}
                    {usernameStatus === 'available' && (
                      <CheckCircle2 size={14} className="text-emerald-400" />
                    )}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid') && (
                      <AlertCircle size={14} className="text-red-400" />
                    )}
                  </div>
                </div>

                {/* Validation helper message */}
                {usernameMessage && (
                  <p
                    className={`text-[10px] mt-1 font-mono ${
                      usernameStatus === 'available'
                        ? 'text-emerald-400'
                        : usernameStatus === 'taken' || usernameStatus === 'invalid'
                        ? 'text-red-400'
                        : 'text-[#8A92A6]'
                    }`}
                  >
                    {usernameMessage}
                  </p>
                )}
              </div>

              {/* Bio & Consistency Goal */}
              <div>
                <label className="text-[11px] font-semibold text-[#8A92A6] block mb-1">
                  Bio & Consistency Goal
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 160))}
                  placeholder="What craft or daily practice are you committing to?"
                  className="w-full p-3 bg-[#121620] border border-[#202738] focus:border-[#2166FF] rounded-xl text-xs text-white placeholder-[#555E70] outline-none transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={
                authLoading || 
                !name.trim() || 
                !username.trim() || 
                usernameStatus === 'taken' || 
                usernameStatus === 'invalid' || 
                usernameStatus === 'checking'
              }
              className="w-full py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#1A52CC] disabled:opacity-40 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-[#2166FF]/20"
            >
              {authLoading ? (
                <Loader2 size={15} className="animate-spin text-white" />
              ) : (
                <>
                  <span>Complete Setup & Launch</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        )}

      </div>

      {/* Profile Picture Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageUrl={rawImageForCrop || avatarUrl}
        title="Crop Profile Avatar"
        mode="avatar"
        onCropComplete={(croppedDataUrl) => {
          setAvatarUrl(croppedDataUrl);
          setIsCropModalOpen(false);
        }}
        onClose={() => setIsCropModalOpen(false)}
      />
    </div>
  );
};
