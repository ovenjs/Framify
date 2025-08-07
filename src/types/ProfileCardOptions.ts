export interface ProfileCardOptions {
  username: string;
  discriminator?: string;
  avatarUrl: string;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  statusColor?: string;
  bio?: string;
  badges?: string[];
  backgroundColor?: string;
  textColor?: string;
  accentColor?: string;
  backgroundImage?: string;
  fontSize?: {
    username?: number;
    bio?: number;
    badges?: number;
  };
  padding?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
  borderRadius?: number;
  layout?: 'horizontal' | 'vertical';
}
