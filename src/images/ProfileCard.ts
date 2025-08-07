import { Canvas, createCanvas, Image } from '@napi-rs/canvas';
import { ProfileCardOptions } from '../types/ProfileCardOptions';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

export class ProfileCard {
  private options: Required<ProfileCardOptions>;
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;

  constructor(options: ProfileCardOptions) {
    // Set default values
    this.options = {
      username: options.username,
      discriminator: options.discriminator || '#0000',
      avatarUrl: options.avatarUrl,
      status: options.status || 'online',
      statusColor: options.statusColor || this.getStatusColor(options.status || 'online'),
      bio: options.bio || '',
      badges: options.badges || [],
      backgroundColor: options.backgroundColor || '#2C2F33',
      textColor: options.textColor || '#FFFFFF',
      accentColor: options.accentColor || '#7289DA',
      backgroundImage: options.backgroundImage || '',
      fontSize: {
        username: options.fontSize?.username || 32,
        bio: options.fontSize?.bio || 16,
        badges: options.fontSize?.badges || 14,
      },
      padding: {
        top: options.padding?.top || 30,
        right: options.padding?.right || 30,
        bottom: options.padding?.bottom || 30,
        left: options.padding?.left || 30,
      },
      borderRadius: options.borderRadius || 10,
      layout: options.layout || 'vertical',
    };

    // Create canvas with standard profile card dimensions
    this.canvas = createCanvas(800, 400);
    this.ctx = this.canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'online':
        return '#43B581';
      case 'idle':
        return '#FAA61A';
      case 'dnd':
        return '#F04747';
      case 'offline':
        return '#747F8D';
      default:
        return '#747F8D';
    }
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
        this.ctx.globalAlpha = 0.2; // Make background image semi-transparent
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
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private async drawAvatar() {
    const avatarSize = this.options.layout === 'horizontal' ? 100 : 120;
    const x = this.options.padding.left!;
    const y =
      this.options.layout === 'horizontal'
        ? this.options.padding.top!
        : this.options.padding.top! +
          (this.canvas.height -
            this.options.padding.top! -
            this.options.padding.bottom! -
            avatarSize) /
            2;

    // Draw avatar background circle
    this.ctx.beginPath();
    this.ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2);
    this.ctx.fillStyle = this.options.accentColor;
    this.ctx.fill();

    // Draw avatar
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    this.ctx.closePath();
    this.ctx.clip();

    const avatar = await this.loadAvatar();
    this.ctx.drawImage(avatar as unknown as CanvasImageSource, x, y, avatarSize, avatarSize);
    this.ctx.restore();

    // Draw status indicator
    const statusSize = 16;
    const statusX = x + avatarSize - statusSize / 2 - 2;
    const statusY = y + avatarSize - statusSize / 2 - 2;

    this.ctx.beginPath();
    this.ctx.arc(
      statusX + statusSize / 2,
      statusY + statusSize / 2,
      statusSize / 2,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = this.options.statusColor;
    this.ctx.fill();
  }

  private async drawText() {
    const { username, discriminator, bio, badges } = this.options;
    const { left, top } = this.options.padding;
    const avatarSize = this.options.layout === 'horizontal' ? 100 : 120;

    let currentY = top!;

    if (this.options.layout === 'vertical') {
      // Username
      this.ctx.font = `bold ${this.options.fontSize.username}px Arial`;
      this.ctx.fillStyle = this.options.textColor;
      this.ctx.fillText(
        username,
        left! + avatarSize + 30,
        (currentY || 0) + (this.options.fontSize.username || 0)
      );
      currentY = (currentY || 0) + (this.options.fontSize.username || 0) + 10;

      // Discriminator
      this.ctx.font = `${(this.options.fontSize.username || 0) - 8}px Arial`;
      this.ctx.fillStyle = '#AAAAAA';
      this.ctx.fillText(
        discriminator,
        left! + avatarSize + 30,
        (currentY || 0) + ((this.options.fontSize.username || 0) - 8)
      );
      currentY = (currentY || 0) + (this.options.fontSize.username || 0) + 20;
    }

    // Bio
    if (bio) {
      this.ctx.font = `${this.options.fontSize.bio}px Arial`;
      this.ctx.fillStyle = this.options.textColor;

      // Word wrap for bio text
      const words = bio.split(' ');
      let line = '';
      const maxWidth = this.canvas.width - (left! + avatarSize + 60);

      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = this.ctx.measureText(testLine);
        const testWidth = metrics.width;

        if (testWidth > maxWidth && i > 0) {
          this.ctx.fillText(
            line,
            left! + avatarSize + 30,
            (currentY || 0) + (this.options.fontSize.bio || 0)
          );
          line = words[i] + ' ';
          currentY = (currentY || 0) + (this.options.fontSize.bio || 0) + 5;
        } else {
          line = testLine;
        }
      }
      this.ctx.fillText(
        line,
        left! + avatarSize + 30,
        (currentY || 0) + (this.options.fontSize.bio || 0)
      );
      currentY = (currentY || 0) + (this.options.fontSize.bio || 0) + 20;
    }

    // Badges
    if (badges.length > 0) {
      this.ctx.font = `${this.options.fontSize.badges}px Arial`;
      this.ctx.fillStyle = this.options.accentColor;

      let badgeX = left! + avatarSize + 30;
      const badgeY = (currentY || 0) + (this.options.fontSize.badges || 0);

      for (const badge of badges) {
        const badgeText = `• ${badge}`;
        const metrics = this.ctx.measureText(badgeText);

        if (badgeX + metrics.width > this.canvas.width - this.options.padding.right!) {
          badgeX = left! + avatarSize + 30;
          currentY = (currentY || 0) + (this.options.fontSize.badges || 0) + 5;
        }

        this.ctx.fillText(badgeText, badgeX, badgeY);
        badgeX += metrics.width + 10;
      }
    }
  }

  async toBuffer(): Promise<Buffer> {
    // Draw all components
    await this.drawBackground();
    await this.drawAvatar();
    await this.drawText();

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
