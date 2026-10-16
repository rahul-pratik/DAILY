import React, { useState } from 'react';
import { 
  Flame, 
  Trophy, 
  TrendingUp, 
  CheckCircle2, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  BarChart2, 
  Check, 
  Clock, 
  AlertCircle,
  Zap
} from 'lucide-react';
import { Author, Challenge, CohortProof } from '../types';

interface StreakAnalyticsProps {
  challenges: Challenge[];
  currentUser: Author;
  onSelectChallenge?: (challenge: Challenge) => void;
  onOpenCohortDiscussion?: (challenge: Challenge) => void;
  onQuickCheckIn?: (challengeId: string) => void;
}

export const StreakAnalytics: React.FC<StreakAnalyticsProps> = ({
  challenges,
  currentUser,
  onSelectChallenge,
  onOpenCohortDiscussion,
  onQuickCheckIn,
}) => {
  // Filter to active or joined challenges, fallback to first challenge
  const activeChallenges = challenges.filter(
    (c) => c.status === 'active' || c.joined || (c.current > 0 && c.current < c.target)
  );

  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(
    activeChallenges[0]?.id || challenges[0]?.id || ''
  );

  const [timeframe, setTimeframe] = useState<'7days' | '30days'>('7days');
  const [hoveredDay, setHoveredDay] = useState<{
    dayNumber: number;
    label: string;
    completed: boolean;
    date: string;
    note?: string;
  } | null>(null);

  // Active challenge reference
  const selectedChallenge = 
    challenges.find((c) => c.id === selectedChallengeId) || 
    activeChallenges[0] || 
    challenges[0] || 
    null;

  // Calculate streak numbers for selected challenge
  const currentProgress = selectedChallenge?.current || 0;
  const targetDays = selectedChallenge?.target || 30;
  const durationDays = selectedChallenge?.durationDays || 30;

  // Current streak (e.g. current progress or consecutive verified days)
  const currentStreak = Math.min(currentProgress, targetDays);
  const bestStreak = Math.max(currentStreak, Math.min(targetDays, Math.round(currentProgress * 1.4)));
  const completionPercentage = Math.min(100, Math.round((currentStreak / targetDays) * 100));

  // Determine if checked in today
  const todayCheckedIn = currentProgress > 0 && currentProgress >= 1;

  // Generate 7-day data (Current week: Mon to Sun or last 7 days)
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const todayIndex = 4; // e.g. Friday for illustration or dynamic
  const today = new Date();

  const last7DaysData = Array.from({ length: 7 }, (_, i) => {
    const diff = i - todayIndex;
    const dateObj = new Date();
    dateObj.setDate(today.getDate() + diff);
    const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const isToday = i === todayIndex;
    const isPast = i <= todayIndex;
    
    // Check-in status: completed if past and within current streak progress
    const completed = isPast && (i >= todayIndex - currentStreak + 1 || (isToday && todayCheckedIn));
    const completionRate = completed ? 100 : (isToday ? 0 : (isPast ? 0 : 0));

    return {
      dayIndex: i,
      dayName: dayNames[i],
      date: dateStr,
      isToday,
      isPast,
      completed,
      percentage: completionRate,
      note: completed 
        ? `Day ${Math.max(1, currentProgress - (todayIndex - i))} proof verified` 
        : (isToday ? 'Check-in pending for today' : 'No check-in logged'),
    };
  });

  // Generate 30-day sprint bar chart data
  const sprint30DaysData = Array.from({ length: 30 }, (_, index) => {
    const dayNum = index + 1;
    const completed = dayNum <= currentProgress;
    const isCurrent = dayNum === currentProgress + 1;
    const isMilestone = dayNum === 7 || dayNum === 14 || dayNum === 21 || dayNum === 30;

    return {
      dayNumber: dayNum,
      completed,
      isCurrent,
      isMilestone,
      label: `Day ${dayNum}`,
      percentage: completed ? 100 : (isCurrent ? 20 : 0),
      note: completed 
        ? `Day ${dayNum} check-in verified` 
        : (isCurrent ? 'Next daily check-in' : 'Upcoming sprint milestone'),
    };
  });

  if (!selectedChallenge) {
    return (
      <div className="p-5 rounded-3xl bg-[#080B10] border border-[#1E232F] mb-6 text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-[#2166FF]/10 text-[#3B82FF] flex items-center justify-center mx-auto">
          <BarChart2 size={24} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">No Active Challenges Found</h3>
          <p className="text-xs text-[#9298A3] max-w-xs mx-auto mt-0.5">
            Join or start an accountability challenge to activate daily check-in streak tracking.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-3xl bg-[#080B10] border border-[#1E232F] p-4 sm:p-5 shadow-xl relative overflow-hidden">
      {/* Background ambient decorative glow */}
      <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#2166FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Title & Active Challenge Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-sm shadow-amber-500/10">
            <Flame size={18} className="animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight truncate">
                Streak Analytics
              </h3>
              <span className="text-[10px] font-mono font-bold bg-[#2166FF]/15 text-[#3B82FF] px-2 py-0.5 rounded-full border border-[#2166FF]/25">
                Active Sprint
              </span>
            </div>
            <p className="text-[11px] text-[#9298A3] truncate">
              Visualizing daily check-in momentum & consistency
            </p>
          </div>
        </div>

        {/* Challenge selector dropdown / buttons */}
        {activeChallenges.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {activeChallenges.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChallengeId(ch.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedChallenge.id === ch.id
                    ? 'bg-[#2166FF] text-white shadow-sm shadow-[#2166FF]/30'
                    : 'bg-[#10141D] text-[#9298A3] hover:text-white border border-[#202738]'
                }`}
              >
                {ch.title.split(' ')[0]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected Challenge Context Card */}
      <div className="mb-4 p-3 rounded-2xl bg-[#0D111A] border border-[#1A202E] flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-[#9298A3]">
            Tracking Challenge
          </p>
          <h4 className="text-xs sm:text-sm font-bold text-white truncate">
            {selectedChallenge.title}
          </h4>
        </div>

        {onOpenCohortDiscussion && (
          <button
            type="button"
            onClick={() => onOpenCohortDiscussion(selectedChallenge)}
            className="text-[11px] font-semibold text-[#3B82FF] hover:text-[#60A5FA] flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
          >
            <span>View Cohort Proofs</span>
            <ChevronRight size={13} />
          </button>
        )}
      </div>

      {/* 4 Metric Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
        {/* Metric 1: Current Streak */}
        <div className="p-3 rounded-2xl bg-[#0C1018] border border-[#1A2130] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9298A3] mb-1">
            <span className="text-[10px] font-medium uppercase font-mono">Current Streak</span>
            <Flame size={14} className="text-amber-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-white">{currentStreak}</span>
            <span className="text-xs text-[#9298A3]">days</span>
          </div>
          <p className="text-[10px] text-amber-400 font-medium mt-1">
            {currentStreak > 0 ? '🔥 Streak on fire!' : 'Start your streak today'}
          </p>
        </div>

        {/* Metric 2: Longest Streak */}
        <div className="p-3 rounded-2xl bg-[#0C1018] border border-[#1A2130] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9298A3] mb-1">
            <span className="text-[10px] font-medium uppercase font-mono">Best Streak</span>
            <Trophy size={14} className="text-yellow-400" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-white">{bestStreak}</span>
            <span className="text-xs text-[#9298A3]">days</span>
          </div>
          <p className="text-[10px] text-emerald-400 font-medium mt-1">
            Personal Record
          </p>
        </div>

        {/* Metric 3: Consistency Rate */}
        <div className="p-3 rounded-2xl bg-[#0C1018] border border-[#1A2130] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9298A3] mb-1">
            <span className="text-[10px] font-medium uppercase font-mono">Consistency</span>
            <TrendingUp size={14} className="text-[#3B82FF]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-white">{completionPercentage}%</span>
            <span className="text-xs text-[#9298A3]">rate</span>
          </div>
          <p className="text-[10px] text-[#3B82FF] font-medium mt-1">
            {currentProgress}/{targetDays} Days Complete
          </p>
        </div>

        {/* Metric 4: Today Status */}
        <div className="p-3 rounded-2xl bg-[#0C1018] border border-[#1A2130] flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#9298A3] mb-1">
            <span className="text-[10px] font-medium uppercase font-mono">Today's Check-in</span>
            <Calendar size={14} className="text-purple-400" />
          </div>
          <div className="flex items-center gap-1.5">
            {todayCheckedIn ? (
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={15} />
                <span>Verified</span>
              </span>
            ) : (
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Clock size={14} />
                <span>Pending</span>
              </span>
            )}
          </div>
          <p className="text-[10px] text-[#9298A3] mt-1">
            {todayCheckedIn ? 'Logged for today' : 'Check-in required'}
          </p>
        </div>
      </div>

      {/* Bar Chart Header with View Toggle (7-Day vs 30-Day Sprint) */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-bold text-white flex items-center gap-1.5">
          <BarChart2 size={14} className="text-[#3B82FF]" />
          <span>{timeframe === '7days' ? 'Weekly Daily Check-Ins' : '30-Day Sprint Progress'}</span>
        </span>

        <div className="flex bg-[#0D111A] p-0.5 rounded-xl border border-[#1A202E] text-[11px]">
          <button
            type="button"
            onClick={() => setTimeframe('7days')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              timeframe === '7days'
                ? 'bg-[#2166FF] text-white shadow-sm'
                : 'text-[#9298A3] hover:text-white'
            }`}
          >
            7 Days
          </button>
          <button
            type="button"
            onClick={() => setTimeframe('30days')}
            className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
              timeframe === '30days'
                ? 'bg-[#2166FF] text-white shadow-sm'
                : 'text-[#9298A3] hover:text-white'
            }`}
          >
            30 Days
          </button>
        </div>
      </div>

      {/* BAR CHART VISUALIZATION */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#0B0F17] border border-[#19202E]">
        {/* TIMEFRAME 1: 7-DAY WEEKLY BAR CHART */}
        {timeframe === '7days' && (
          <div className="space-y-3">
            {/* 7 Vertical Bars */}
            <div className="grid grid-cols-7 gap-2 sm:gap-4 items-end h-40 pt-4 pb-2 px-1">
              {last7DaysData.map((d) => {
                const isHovered = hoveredDay?.dayNumber === d.dayIndex;
                return (
                  <div
                    key={d.dayIndex}
                    onMouseEnter={() =>
                      setHoveredDay({
                        dayNumber: d.dayIndex,
                        label: d.dayName,
                        completed: d.completed,
                        date: d.date,
                        note: d.note,
                      })
                    }
                    onMouseLeave={() => setHoveredDay(null)}
                    className="flex flex-col items-center h-full justify-end cursor-pointer group"
                  >
                    {/* Top indicator tag */}
                    <div className="mb-1.5 min-h-[16px] flex items-center justify-center">
                      {d.completed ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      ) : d.isToday ? (
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      ) : (
                        <span className="text-[10px] text-[#4A5263]">-</span>
                      )}
                    </div>

                    {/* The Visual Bar */}
                    <div className="w-full max-w-[28px] h-28 bg-[#121722] rounded-xl overflow-hidden p-0.5 border border-[#1E2536] flex flex-col justify-end transition-all group-hover:border-[#3B82FF]">
                      <div
                        style={{
                          height: d.completed ? '100%' : d.isToday ? '25%' : '8%',
                        }}
                        className={`w-full rounded-lg transition-all duration-500 ${
                          d.completed
                            ? 'bg-gradient-to-t from-[#1E50CC] to-[#3B82FF] shadow-sm shadow-[#2166FF]/50'
                            : d.isToday
                            ? 'bg-amber-500/30 border border-amber-500/50'
                            : 'bg-[#181F2E]'
                        }`}
                      />
                    </div>

                    {/* Bottom Label (Day Name & Date) */}
                    <div className="mt-2 text-center">
                      <p
                        className={`text-[11px] font-bold ${
                          d.isToday ? 'text-[#3B82FF]' : 'text-white'
                        }`}
                      >
                        {d.dayName}
                      </p>
                      <p className="text-[9px] text-[#788294] font-mono">{d.date}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hovered or Active Day Tooltip Display */}
            <div className="p-2.5 rounded-xl bg-[#10141D] border border-[#1F2738] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-[#9298A3]">
                  {hoveredDay ? hoveredDay.label : 'Daily Check-in Rate'}:
                </span>
                <span className="font-semibold text-white">
                  {hoveredDay ? hoveredDay.note : `${currentStreak} of 7 days completed this week`}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#3B82FF] bg-[#2166FF]/10 px-2 py-0.5 rounded">
                7-Day Window
              </span>
            </div>
          </div>
        )}

        {/* TIMEFRAME 2: 30-DAY SPRINT HIGH-RESOLUTION PROGRESS */}
        {timeframe === '30days' && (
          <div className="space-y-3">
            {/* 30 Density Bars Grid */}
            <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5 items-end h-36 pt-4 pb-2 px-1">
              {sprint30DaysData.map((d) => (
                <div
                  key={d.dayNumber}
                  onMouseEnter={() =>
                    setHoveredDay({
                      dayNumber: d.dayNumber,
                      label: d.label,
                      completed: d.completed,
                      date: `Day ${d.dayNumber}`,
                      note: d.note,
                    })
                  }
                  onMouseLeave={() => setHoveredDay(null)}
                  className="flex flex-col items-center h-full justify-end cursor-pointer group"
                >
                  {/* Visual Bar */}
                  <div className="w-full h-24 bg-[#121722] rounded-md overflow-hidden p-0.5 border border-[#1E2536] flex flex-col justify-end transition-all group-hover:border-[#3B82FF]">
                    <div
                      style={{
                        height: d.completed ? '100%' : d.isCurrent ? '30%' : '10%',
                      }}
                      className={`w-full rounded-sm transition-all duration-300 ${
                        d.completed
                          ? d.isMilestone
                            ? 'bg-gradient-to-t from-emerald-600 to-emerald-400'
                            : 'bg-gradient-to-t from-[#1E50CC] to-[#3B82FF]'
                          : d.isCurrent
                          ? 'bg-amber-400/50'
                          : 'bg-[#181F2E]'
                      }`}
                    />
                  </div>

                  {/* Day Number Label */}
                  <span
                    className={`mt-1 text-[9px] font-mono ${
                      d.isMilestone
                        ? 'text-emerald-400 font-bold'
                        : d.completed
                        ? 'text-white'
                        : 'text-[#555E70]'
                    }`}
                  >
                    {d.dayNumber}
                  </span>
                </div>
              ))}
            </div>

            {/* Milestones Legend */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#19202E] text-[11px]">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-[#9298A3]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82FF]" />
                  <span>Verified Check-in</span>
                </span>
                <span className="flex items-center gap-1 text-[#9298A3]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                  <span>Sprint Milestone (7/14/21/30)</span>
                </span>
                <span className="flex items-center gap-1 text-[#9298A3]">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#1E2536]" />
                  <span>Upcoming</span>
                </span>
              </div>

              <div className="text-[#3B82FF] font-semibold text-[11px]">
                {targetDays - currentProgress} days to complete
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action footer */}
      {!todayCheckedIn && onQuickCheckIn && (
        <div className="mt-3 flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#2166FF]/15 to-transparent border border-[#2166FF]/30">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-[#3B82FF]" />
            <span className="text-xs font-semibold text-white">
              Keep your streak alive! Check in for Day {currentProgress + 1}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onQuickCheckIn(selectedChallenge.id)}
            className="px-3 py-1.5 rounded-xl bg-[#2166FF] hover:bg-[#3B82FF] text-white text-xs font-bold transition-colors cursor-pointer shadow-sm shadow-[#2166FF]/30"
          >
            Check In Now
          </button>
        </div>
      )}
    </div>
  );
};
