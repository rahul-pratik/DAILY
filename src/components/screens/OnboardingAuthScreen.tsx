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
  KeyRound,
  Eye,
  EyeOff,
  Check,
  ShieldCheck
} from 'lucide-react';
import { Author } from '../../types';
import { supabase, syncProfileToSupabase, isValidUUID } from '../../lib/supabase';
import { OTHER_USERS } from '../../data/initialData';

interface OnboardingAuthScreenProps {
  onComplete: (user: Author, selectedInterests: string[], authSession?: { provider: 'google' | 'email' | 'guest'; email?: string }) => void;
  initialUser?: Author;
  allCommunities?: any[];
}

export const OnboardingAuthScreen: React.FC<OnboardingAuthScreenProps> = ({
  onComplete,
  initialUser,
}) => {
  // Two screens: 1: login/signup, 2: name, username, bio
  const [screen, setScreen] = useState<1 | 2>(1);

  // Screen 1: Auth state
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccessMessage, setAuthSuccessMessage] = useState<string | null>(null);
  const [appleAlert, setAppleAlert] = useState(false);
  const [authProvider, setAuthProvider] = useState<'google' | 'email' | 'guest'>('email');

  // Screen 2: Name, username, bio, avatar state
  const [name, setName] = useState(initialUser?.name || '');
  const [username, setUsername] = useState(initialUser?.username || '');
  const [bio, setBio] = useState(initialUser?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(
    initialUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
  );
  const [userId, setUserId] = useState<string>(initialUser?.id || `user_${Date.now()}`);
  const [googleUserNote, setGoogleUserNote] = useState<string | null>(null);

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

  // Check if user is already authenticated via Supabase session (e.g. redirected from Google OAuth)
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        setUserId(u.id);
        const meta = u.user_metadata || {};
        const derivedName = meta.name || meta.full_name || u.email?.split('@')[0] || '';
        const rawHandle = meta.username || u.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9_.]/g, '') || '';
        const derivedAvatar = meta.avatar_url || '';
        const provider = (u.app_metadata?.provider as any) || 'google';

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

        // Advance to Screen 2 to prompt for custom Name, Username, and Bio
        setScreen(2);
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
          const derivedName = u.user_metadata?.name || u.user_metadata?.full_name || email.split('@')[0];
          const derivedUsername = u.user_metadata?.username || email.split('@')[0].toLowerCase().replace(/[^a-z0-9_.]/g, '');

          setUserId(u.id);
          setName(derivedName);
          setUsername(derivedUsername);
          checkUsernameAvailability(derivedUsername, u.id);
          // Advance to Screen 2 to let the user review and confirm handle
          setScreen(2);
          setAuthLoading(false);
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
          setScreen(2);
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

  // Passwordless Magic Link fallback
  const handleSendMagicLink = async () => {
    if (!email.trim()) {
      setAuthError('Please enter your email address to receive a magic login link.');
      return;
    }

    setAuthLoading(true);
    setAuthError(null);
    setAuthSuccessMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setAuthSuccessMessage(`Magic login link sent to ${email}! Check your inbox to sign in.`);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Failed to send magic link.');
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

      // Sync profile to Supabase public.profiles table
      if (activeUserId) {
        await syncProfileToSupabase({
          id: activeUserId,
          name: finalName,
          username: finalUsername,
          avatar: finalAvatar,
          bio: finalBio,
        });

        // Update user metadata in Supabase Auth (avoid passing huge base64 strings to metadata)
        const metaUpdate: any = {
          name: finalName,
          username: finalUsername,
          bio: finalBio,
          onboarding_completed: true,
        };
        if (finalAvatar.startsWith('http')) {
          metaUpdate.avatar_url = finalAvatar;
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
      avatar: finalAvatar,
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#2166FF]/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-md bg-[#080B10] border border-[#20242C] rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-xl">
        
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-wider text-white">
              DAILY<span className="text-[#2166FF]">.</span>
            </span>
            <span className="text-[10px] font-mono text-[#9298A3] bg-[#121620] px-2 py-0.5 rounded-full border border-[#20242C]">
              Step {screen} of 2
            </span>
          </div>

          {screen === 2 && (
            <button
              type="button"
              onClick={() => setScreen(1)}
              className="text-xs text-[#9298A3] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
              <span>Back to Login</span>
            </button>
          )}
        </div>

        {/* ================= SCREEN 1: LOGIN / SIGNUP ================= */}
        {screen === 1 && (
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
                  onChange={(e) => setEmail(e.target.value)}
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
                  onChange={(e) => setPassword(e.target.value)}
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
                    <span>{authMode === 'signup' ? 'Create Account with Supabase' : 'Log In with Supabase'}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <button
                  type="button"
                  onClick={handleSendMagicLink}
                  disabled={authLoading}
                  className="text-[#3B82FF] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound size={12} />
                  <span>Send Magic Login Link</span>
                </button>

                <span className="text-[#555E70] font-mono text-[10px]">
                  Supabase Auth Active
                </span>
              </div>
            </form>

            <div className="text-center pt-1 border-t border-[#1C2230]/60">
              <button
                type="button"
                onClick={() => {
                  setAuthProvider('guest');
                  setScreen(2);
                }}
                className="text-[11px] text-[#8A92A6] hover:text-white underline cursor-pointer"
              >
                Continue as Guest / Demo Mode
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 2: NAME, UNIQUE USERNAME, BIO ================= */}
        {screen === 2 && (
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

            {/* Avatar Preview */}
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#121620] border border-[#202738]">
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover border-2 border-[#2166FF]"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{name || 'Your Name'}</p>
                <p className="text-[11px] font-mono text-[#3B82FF] truncate">
                  @{username || 'handle'}
                </p>
                <p className="text-[10px] text-[#717B90]">
                  {authProvider === 'google' ? 'Google Account Avatar' : 'Default Builder Avatar'}
                </p>
              </div>
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
    </div>
  );
};
