import React, { useState } from 'react';
import { 
  ArrowRight, 
  ChevronLeft, 
  Mail, 
  Lock, 
  User, 
  AtSign, 
  AlertCircle 
} from 'lucide-react';
import { Author } from '../../types';

interface OnboardingAuthScreenProps {
  onComplete: (user: Author, selectedInterests: string[], authSession?: { provider: 'google' | 'email' | 'guest'; email?: string }) => void;
  initialUser?: Author;
  allCommunities?: any[];
}

export const OnboardingAuthScreen: React.FC<OnboardingAuthScreenProps> = ({
  onComplete,
  initialUser,
}) => {
  // Two minimal screens: 1: login/signup, 2: name, username, bio
  const [screen, setScreen] = useState<1 | 2>(1);

  // Screen 1: Auth state
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [appleAlert, setAppleAlert] = useState(false);
  const [authProvider, setAuthProvider] = useState<'google' | 'email' | 'guest'>('google');

  // Screen 2: Name, username, bio state
  const [name, setName] = useState(initialUser?.name || '');
  const [username, setUsername] = useState(initialUser?.username || '');
  const [bio, setBio] = useState(initialUser?.bio || '');

  // Screen 1: Handlers
  const handleGoogleLogin = () => {
    setAuthProvider('google');
    if (!name) setName('Alex Chen');
    if (!username) setUsername('alexchen');
    if (!email) setEmail('alex@gmail.com');
    setScreen(2);
  };

  const handleAppleLogin = () => {
    setAppleAlert(true);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;
    setAuthProvider('email');
    if (!name && email) {
      const derived = email.split('@')[0];
      setName(derived.charAt(0).toUpperCase() + derived.slice(1));
      setUsername(derived.toLowerCase().replace(/[^a-z0-9]/g, ''));
    }
    setScreen(2);
  };

  // Screen 2: Finish Onboarding
  const handleFinish = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUser: Author = {
      id: initialUser?.id || `user_${Date.now()}`,
      name: name.trim() || 'Daily Builder',
      username: username.trim().replace(/^@/, '') || 'builder',
      avatar: initialUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
      bio: bio.trim() || 'Building daily consistency and verifiable discipline.',
      isCurrentUser: true,
      isFollowing: false,
      followersCount: 1,
      followingCount: 2,
      accountabilityHubPrivacy: 'public',
    };

    onComplete(finalUser, ['Coding & Tech', 'Startups & SaaS', 'Daily Habits'], {
      provider: authProvider,
      email: email || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-white flex flex-col justify-center items-center px-4 py-8 font-sans">
      <div className="w-full max-w-sm flex flex-col space-y-6">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between pb-2">
          {screen > 1 ? (
            <button
              type="button"
              onClick={() => setScreen(1)}
              className="text-xs text-[#8A92A6] hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          ) : (
            <div className="w-8" />
          )}

          <div className="flex items-center gap-2">
            {[1, 2].map((stepNum) => (
              <div
                key={stepNum}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  stepNum === screen
                    ? 'w-7 bg-[#2166FF]'
                    : 'w-2 bg-[#1C2230]'
                }`}
              />
            ))}
          </div>

          <span className="text-[11px] font-mono text-[#8A92A6]">
            {screen}/2
          </span>
        </div>

        {/* ================= SCREEN 1: LOGIN / SIGNUP ================= */}
        {screen === 1 && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Daily
              </h1>
              <p className="text-xs text-[#8A92A6]">
                Show up daily. Track verified accountability.
              </p>
            </div>

            {/* Apple login not available notification */}
            {appleAlert && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-amber-200">
                    Apple login is not available right now. Please continue with Google or Email.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAppleAlert(false)}
                  className="text-xs text-amber-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Social Logins */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-2.5 px-4 rounded-xl bg-[#121620] hover:bg-[#1A2030] border border-[#202738] text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
              >
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
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    authMode === 'signup' ? 'bg-[#2166FF] text-white' : 'text-[#8A92A6] hover:text-white'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('login')}
                  className={`flex-1 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    authMode === 'login' ? 'bg-[#2166FF] text-white' : 'text-[#8A92A6] hover:text-white'
                  }`}
                >
                  Log In
                </button>
              </div>

              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555E70]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="w-full pl-9 pr-3 py-2 bg-[#121620] border border-[#202738] focus:border-[#2166FF] rounded-xl text-xs text-white placeholder-[#555E70] outline-none transition-colors"
                />
              </div>

              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555E70]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full pl-9 pr-3 py-2 bg-[#121620] border border-[#202738] focus:border-[#2166FF] rounded-xl text-xs text-white placeholder-[#555E70] outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#1A52CC] text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>{authMode === 'signup' ? 'Continue with Email' : 'Log In'}</span>
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setAuthProvider('guest');
                  setScreen(2);
                }}
                className="text-[11px] text-[#8A92A6] hover:text-white underline cursor-pointer"
              >
                Continue as Guest
              </button>
            </div>
          </div>
        )}

        {/* ================= SCREEN 2: NAME, USERNAME, BIO ================= */}
        {screen === 2 && (
          <form onSubmit={handleFinish} className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-bold tracking-tight text-white">
                Profile Details
              </h2>
              <p className="text-xs text-[#8A92A6]">
                Enter your name, handle, and a short bio.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-[#8A92A6] block mb-1">
                  Name
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
                        setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
                      }
                    }}
                    placeholder="e.g. Alex Chen"
                    className="w-full pl-9 pr-3 py-2 bg-[#121620] border border-[#202738] focus:border-[#2166FF] rounded-xl text-xs text-white placeholder-[#555E70] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8A92A6] block mb-1">
                  Username
                </label>
                <div className="relative">
                  <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#555E70]" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ''))}
                    placeholder="username"
                    className="w-full pl-9 pr-3 py-2 bg-[#121620] border border-[#202738] focus:border-[#2166FF] rounded-xl text-xs text-white font-mono placeholder-[#555E70] outline-none transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#8A92A6] block mb-1">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 160))}
                  placeholder="What are you building or practicing daily?"
                  className="w-full p-3 bg-[#121620] border border-[#202738] focus:border-[#2166FF] rounded-xl text-xs text-white placeholder-[#555E70] outline-none transition-colors resize-none leading-relaxed"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!name.trim() || !username.trim()}
              className="w-full py-2.5 rounded-xl bg-[#2166FF] hover:bg-[#1A52CC] disabled:opacity-40 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
