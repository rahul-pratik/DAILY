import React from 'react';

interface CreditIconProps {
  size?: number;
  className?: string;
  credited?: boolean;
  variant?: 'normal' | 'challenge' | 'community' | 'golden' | 'green' | 'blue';
}

interface DiscreditIconProps {
  size?: number;
  className?: string;
  discredited?: boolean;
  variant?: 'normal' | 'challenge' | 'community' | 'golden' | 'green' | 'blue';
}

/**
 * CreditIcon - Stylized 'C' credit coin emblem
 * Used across the platform to replace likes with Credits (C).
 * Normal: Blue C | Challenge: Golden C | Community: Green C
 */
export const CreditIcon: React.FC<CreditIconProps> = ({
  size = 18,
  className = '',
  credited = false,
  variant = 'normal',
}) => {
  const isGolden = variant === 'challenge' || variant === 'golden';
  const isGreen = variant === 'community' || variant === 'green';

  const fillColor = credited
    ? isGolden
      ? '#EAB308'
      : isGreen
      ? '#10B981'
      : '#2166FF'
    : 'transparent';

  const strokeColor = credited
    ? isGolden
      ? '#FACC15'
      : isGreen
      ? '#34D399'
      : '#3B82FF'
    : 'currentColor';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 transition-all ${
        credited ? 'active:scale-125' : 'group-hover:scale-110 active:scale-125'
      } ${className}`}
      aria-hidden="true"
    >
      {/* Coin outer rim */}
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1.75"
      />
      {/* Stylized, bold uppercase 'C' emblem */}
      <path
        d="M14.75 8.75C14 7.9 13.05 7.5 11.9 7.5C9.5 7.5 7.75 9.45 7.75 12C7.75 14.55 9.5 16.5 11.9 16.5C13.05 16.5 14.05 16.05 14.8 15.2"
        stroke={credited ? '#FFFFFF' : 'currentColor'}
        strokeWidth="2.35"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * DiscreditIcon - Stylized 'DC' discredit coin emblem
 * Used in communities alongside Credit (C) to allow Discredit (DC).
 */
export const DiscreditIcon: React.FC<DiscreditIconProps> = ({
  size = 18,
  className = '',
  discredited = false,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 transition-all ${
        discredited ? 'active:scale-125' : 'group-hover:scale-110 active:scale-125'
      } ${className}`}
      aria-hidden="true"
    >
      {/* Coin outer rim */}
      <circle
        cx="12"
        cy="12"
        r="9.5"
        fill={discredited ? '#EF4444' : 'transparent'}
        stroke={discredited ? '#F87171' : 'currentColor'}
        strokeWidth="1.75"
      />
      {/* 'D' glyph */}
      <path
        d="M6.5 8h2.6c1.6 0 2.9 1.4 2.9 3.5s-1.3 3.5-2.9 3.5H6.5V8zm1.6 5.5h1c.8 0 1.4-.7 1.4-2s-.6-2-1.4-2h-1v4z"
        fill={discredited ? '#FFFFFF' : 'currentColor'}
      />
      {/* 'C' glyph */}
      <path
        d="M17.5 9.2c-.6-.7-1.4-1-2.2-1-1.6 0-2.8 1.4-2.8 3.3s1.2 3.3 2.8 3.3c.8 0 1.6-.3 2.2-1"
        stroke={discredited ? '#FFFFFF' : 'currentColor'}
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
};

/**
 * Checks whether a post belongs to a community or challenge.
 */
export const isCommunityOrChallengePost = (post?: {
  communityId?: string | null;
  communityName?: string | null;
  challengeTitle?: string | null;
  challengeId?: string | null;
  isDailyProof?: boolean;
  proofDay?: number;
} | null): boolean => {
  if (!post) return false;
  return Boolean(
    post.communityId ||
    post.communityName ||
    post.challengeTitle ||
    post.challengeId ||
    post.isDailyProof ||
    (typeof post.proofDay === 'number' && post.proofDay > 0)
  );
};
