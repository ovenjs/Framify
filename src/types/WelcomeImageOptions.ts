export interface WelcomeImageOptions {
  username: string;
  discriminator?: string;
  avatarUrl: string;
  serverName: string;
  memberCount?: number;
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  backgroundImage?: string;
  fontSize?: {
    title?: number;
    subtitle?: number;
    memberCount?: number;
  };
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  borderRadius?: number;
}
