import { Canvas, createCanvas, Image } from '@napi-rs/canvas';
import { RankCardOptions } from '../types/RankCardOptions';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

export class RankCard {
  private options: Required<RankCardOptions>;
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;

  constructor(options: RankCardOptions) {
    // Set default values
    this.options = {
      username: options.username,
      discriminator: options.discriminator || '#0000',
      avatarUrl: options.avatarUrl,
      rank: options.rank,
      level: options.level,
      currentXP: options.currentXP,
      nextLevelXP: options.nextLevelXP,
      progress: options.progress || this.calculateProgress(options.currentXP, options.nextLevelXP),
      backgroundColor: options.backgroundColor || '#2C2F33',
      textColor: options.textColor || '#FFFFFF',
      accentColor: options.accentColor || '#7289DA',
      rankColor: options.rankColor || '#FFD700',
      levelColor: options.levelColor || '#7289DA',
      progressBarColor: options.progressBarColor || '#43B581',
      progressBarBackgroundColor: options.progressBarBackgroundColor || '#23272A',
      backgroundImage: options.backgroundImage || '',
      fontSize: {
        username: options.fontSize?.username || 32,
        rank: options.fontSize?.rank || 24,
        level: options.fontSize?.level || 20,
        xp: options.fontSize?.xp || 16,
      },
      padding: {
        top: options.padding?.top || 30,
        right: options.padding?.right || 30,
        bottom: options.padding?.bottom || 30,
        left: options.padding?.left || 30,
      },
      borderRadius: options.borderRadius || 10,
      showProgress: options.showProgress !== undefined ? options.showProgress : true,
    };

    // Create canvas with standard rank card dimensions
    this.canvas = createCanvas(900, 300);
    this.ctx = this.canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  }

  private calculateProgress(currentXP: number, nextLevelXP: number): number {
    return Math.min(100, Math.max(0, (currentXP / nextLevelXP) * 100));
  }

  private async loadAvatar(): Promise<Image> {
    const avatarUrl = this.options.avatarUrl;

    // Check if it's a local file path
    if (avatarUrl.startsWith('./') || avatarUrl.startsWith('/') || !avatarUrl.includes('://')) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = avatarUrl;
      });
    }

    // For external URLs, download the image first
    try {
      const response = await fetch(avatarUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = buffer;
      });
    } catch (error) {
      throw new Error(
        `Failed to load external avatar: ${avatarUrl}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async loadBackground(): Promise<Image | null> {
    if (!this.options.backgroundImage) return null;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = this.options.backgroundImage!;
    });
  }

  private async drawBackground() {
    // Fill background color
    this.ctx.fillStyle = this.options.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw background image if provided
    if (this.options.backgroundImage) {
      const backgroundImage = await this.loadBackground();
      if (backgroundImage) {
        this.ctx.globalAlpha = 0.15; // Make background image semi-transparent
        this.ctx.drawImage(
          backgroundImage as unknown as CanvasImageSource,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
        this.ctx.globalAlpha = 1.0; // Reset alpha
      }
    }

    // Add gradient overlay
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private async drawAvatar() {
    const avatarSize = 80;
    const x = this.options.padding.left!;
    const y =
      this.options.padding.top! +
      (this.canvas.height - this.options.padding.top! - this.options.padding.bottom! - avatarSize) /
        2;

    // Draw avatar background circle
    this.ctx.beginPath();
    this.ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2 + 4, 0, Math.PI * 2);
    this.ctx.fillStyle = this.options.accentColor;
    this.ctx.fill();

    // Draw avatar
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.clip();

    const avatar = await this.loadAvatar();
    this.ctx.drawImage(avatar as never, x, y, avatarSize, avatarSize);
    this.ctx.restore();
  }

  private async drawRankInfo() {
    const { rank, level, username, discriminator } = this.options;
    const { left, top } = this.options.padding;
    const avatarSize = 80;

    let currentY = top!;

    // Username
    this.ctx.font = `bold ${this.options.fontSize.username}px Arial`;
    this.ctx.fillStyle = this.options.textColor;
    this.ctx.fillText(
      username,
      left! + avatarSize + 30,
      (currentY || 0) + (this.options.fontSize.username || 0)
    );
    currentY = (currentY || 0) + (this.options.fontSize.username || 0) + 15;

    // Discriminator
    this.ctx.font = `${(this.options.fontSize.username || 0) - 8}px Arial`;
    this.ctx.fillStyle = '#AAAAAA';
    this.ctx.fillText(
      discriminator,
      left! + avatarSize + 30,
      (currentY || 0) + ((this.options.fontSize.username || 0) - 8)
    );
    currentY = (currentY || 0) + (this.options.fontSize.username || 0) + 25;

    // Rank
    this.ctx.font = `bold ${this.options.fontSize.rank}px Arial`;
    this.ctx.fillStyle = this.options.rankColor;
    this.ctx.fillText(
      `Rank #${rank}`,
      left! + avatarSize + 30,
      (currentY || 0) + (this.options.fontSize.rank || 0)
    );
    currentY = (currentY || 0) + (this.options.fontSize.rank || 0) + 15;

    // Level
    this.ctx.font = `${this.options.fontSize.level}px Arial`;
    this.ctx.fillStyle = this.options.levelColor;
    this.ctx.fillText(
      `Level ${level}`,
      left! + avatarSize + 30,
      (currentY || 0) + (this.options.fontSize.level || 0)
    );
  }

  private async drawXPInfo() {
    const { currentXP, nextLevelXP } = this.options;
    const { left } = this.options.padding;
    const avatarSize = 80;

    // XP Text
    this.ctx.font = `${this.options.fontSize.xp}px Arial`;
    this.ctx.fillStyle = this.options.textColor;
    this.ctx.fillText(
      `${currentXP.toLocaleString()} / ${nextLevelXP.toLocaleString()} XP`,
      left! + avatarSize + 30,
      this.canvas.height - this.options.padding.bottom! - 20
    );

    // Draw progress bar background
    const progressBarHeight = 12;
    const progressBarY = this.canvas.height - this.options.padding.bottom! - 40;
    const progressBarWidth =
      this.canvas.width - (left! + avatarSize + 60) - this.options.padding.right!;
    const progressBarX = left! + avatarSize + 30;

    this.ctx.fillStyle = this.options.progressBarBackgroundColor;
    this.ctx.fillRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);

    // Draw progress bar
    if (this.options.showProgress) {
      const progressWidth = (progressBarWidth * this.options.progress!) / 100;
      this.ctx.fillStyle = this.options.progressBarColor;
      this.ctx.fillRect(progressBarX, progressBarY, progressWidth, progressBarHeight);
    }

    // Add progress bar border
    this.ctx.strokeStyle = this.options.accentColor;
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight);
  }

  async toBuffer(): Promise<Buffer> {
    // Draw all components
    await this.drawBackground();
    await this.drawAvatar();
    await this.drawRankInfo();
    await this.drawXPInfo();

    // Add rounded corners
    const radius = this.options.borderRadius;
    this.ctx.beginPath();
    this.ctx.moveTo(radius, 0);
    this.ctx.lineTo(this.canvas.width - radius, 0);
    this.ctx.quadraticCurveTo(this.canvas.width, 0, this.canvas.width, radius);
    this.ctx.lineTo(this.canvas.width, this.canvas.height - radius);
    this.ctx.quadraticCurveTo(
      this.canvas.width,
      this.canvas.height,
      this.canvas.width - radius,
      this.canvas.height
    );
    this.ctx.lineTo(radius, this.canvas.height);
    this.ctx.quadraticCurveTo(0, this.canvas.height, 0, this.canvas.height - radius);
    this.ctx.lineTo(0, radius);
    this.ctx.quadraticCurveTo(0, 0, radius, 0);
    this.ctx.closePath();
    this.ctx.clip();

    // Return buffer
    return this.canvas.encode('png');
  }
}
