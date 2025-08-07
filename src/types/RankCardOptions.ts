export interface RankCardOptions {
  username: string;
  discriminator?: string;
  avatarUrl: string;
  rank: number;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  progress?: number; // 0-100
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  rankColor?: string;
  levelColor?: string;
  progressBarColor?: string;
  progressBarBackgroundColor?: string;
  backgroundImage?: string;
  fontSize?: {
    username?: number;
    rank?: number;
    level?: number;
    xp?: number;
  };
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  borderRadius?: number;
  showProgress?: boolean;
}
