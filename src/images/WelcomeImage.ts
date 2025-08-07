import { Canvas, createCanvas, Image } from '@napi-rs/canvas';
import { WelcomeImageOptions } from '../types/WelcomeImageOptions';
import fetch from 'node-fetch';
import { Buffer } from 'buffer';

export class WelcomeCard {
  private options: Required<WelcomeImageOptions>;
  private canvas: Canvas;
  private ctx: CanvasRenderingContext2D;

  constructor(options: WelcomeImageOptions) {
    // Set default values
    this.options = {
      username: options.username,
      discriminator: options.discriminator || '#0000',
      avatarUrl: options.avatarUrl,
      serverName: options.serverName,
      memberCount: options.memberCount || 0,
      backgroundColor: options.backgroundColor || '#2C2F33',
      textColor: options.textColor || '#FFFFFF',
      accentColor: options.accentColor || '#7289DA',
      backgroundImage: options.backgroundImage || '',
      fontSize: {
        title: options.fontSize?.title || 60,
        subtitle: options.fontSize?.subtitle || 28,
        memberCount: options.fontSize?.memberCount || 20,
      },
      padding: {
        top: options.padding?.top || 60,
        right: options.padding?.right || 60,
        bottom: options.padding?.bottom || 60,
        left: options.padding?.left || 60,
      },
      borderRadius: options.borderRadius || 15,
    };

    // Create canvas with standard welcome card dimensions
    this.canvas = createCanvas(1024, 500);
    this.ctx = this.canvas.getContext('2d') as unknown as CanvasRenderingContext2D;
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

  private async drawBackground() {
    // Load avatar for background
    const avatar = await this.loadAvatar();

    // Draw avatar as background with blur
    this.ctx.save();

    // Create a temporary canvas for blurring
    const tempCanvas = createCanvas(this.canvas.width, this.canvas.height);
    const tempCtx = tempCanvas.getContext('2d') as unknown as CanvasRenderingContext2D;

    // Draw avatar on temp canvas
    tempCtx.drawImage(avatar as never, 0, 0, this.canvas.width, this.canvas.height);

    // Apply blur effect
    this.ctx.filter = 'blur(8px)';
    this.ctx.drawImage(tempCanvas as unknown as CanvasImageSource, 0, 0);
    this.ctx.filter = 'none';

    this.ctx.restore();

    // Add gradient overlay for better text readability
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private async drawAvatar() {
    // Avatar is now used as background, so we don't draw it here
    // This method is kept for compatibility but does nothing
  }

  private async drawText() {
    const { username, discriminator, serverName, memberCount } = this.options;
    const { top } = this.options.padding;
    const topValue = top || 0;

    // Calculate center positions for better layout
    const centerX = this.canvas.width / 2;
    const startY = topValue + 100;

    // Username - centered
    this.ctx.font = `bold ${this.options.fontSize.title}px Arial`;
    this.ctx.fillStyle = this.options.textColor;
    this.ctx.textAlign = 'center';
    this.ctx.fillText(username, centerX, startY);

    // Discriminator - centered below username
    if (discriminator) {
      this.ctx.font = `${this.options.fontSize.subtitle}px Arial`;
      this.ctx.fillStyle = '#AAAAAA';
      this.ctx.fillText(discriminator, centerX, startY + (this.options.fontSize.subtitle || 0) + 5);
    }

    // Server name - centered below discriminator
    this.ctx.font = `bold ${this.options.fontSize.subtitle}px Arial`;
    this.ctx.fillStyle = this.options.textColor;
    this.ctx.fillText(
      `Welcome to ${serverName}!`,
      centerX,
      startY + (this.options.fontSize.subtitle || 0) + (discriminator ? 40 : 60)
    );

    // Member count - centered below server name
    if (memberCount > 0) {
      this.ctx.font = `${this.options.fontSize.memberCount}px Arial`;
      this.ctx.fillStyle = '#AAAAAA';
      this.ctx.fillText(
        `Member #${memberCount}`,
        centerX,
        startY +
          (this.options.fontSize.subtitle || 0) +
          (discriminator ? 80 : 100) +
          (this.options.fontSize.memberCount || 0) +
          10
      );
    }

    // Reset text alignment
    this.ctx.textAlign = 'left';
  }

  private async drawAccentBar() {
    const barHeight = 5;
    const barWidth = this.canvas.width - (this.options.padding.left! + this.options.padding.right!);
    const x = this.options.padding.left!;
    const y = this.canvas.height - (this.options.padding.bottom! || 0) - barHeight;

    this.ctx.fillStyle = this.options.accentColor;
    this.ctx.fillRect(x, y, barWidth, barHeight);
  }

  async toBuffer(): Promise<Buffer> {
    // Draw all components
    await this.drawBackground();
    await this.drawAvatar();
    await this.drawText();
    await this.drawAccentBar();

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
