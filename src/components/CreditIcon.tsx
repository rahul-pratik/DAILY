import React from 'react';

interface CreditIconProps {
  size?: number;
  className?: string;
  credited?: boolean;
}

/**
 * CreditIcon - Renders a stylized 'C' credit coin emblem instead of a love/heart button
 * for posts published under communities or challenges.
 */
export const CreditIcon: React.FC<CreditIconProps> = ({
  size = 18,
  className = '',
  credited = false,
}) => {
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
        fill={credited ? '#2166FF' : 'transparent'}
        stroke={credited ? '#3B82FF' : 'currentColor'}
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
 * Checks whether a post belongs to a community or challenge.
 * Community/challenge posts earn Credits (C), whereas normal standalone posts have Likes (Heart).
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
