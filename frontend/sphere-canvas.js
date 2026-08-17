/**
 * TrautsLab OS — 3D Neural Sphere & Particle Constellation Engine
 * Inspired by V.A.U.L.T. (Voice-Activated Unified Logic Terminal)
 */

export class NeuralSphereEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.particles = [];
    this.numParticles = 360;
    this.baseRadius = 180;
    this.currentRadius = 180;
    this.targetRadius = 180;

    this.rotX = 0;
    this.rotY = 0;
    this.rotZ = 0;
    this.rotSpeedX = 0.002;
    this.rotSpeedY = 0.0035;

    this.mouseX = 0;
    this.mouseY = 0;
    this.targetMouseX = 0;
    this.targetMouseY = 0;
    this.isHovered = false;

    // Audio & State energy levels: 'idle', 'listening', 'speaking', 'executing'
    this.state = 'idle';
    this.audioWaveData = new Array(32).fill(0);
    this.energyPulse = 0;

    this.init();
  }

  init() {
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Generate spherical points using Fibonacci Spiral on Sphere
    this.particles = [];
    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < this.numParticles; i++) {
      const theta = 2 * Math.PI * i / goldenRatio;
      const phi = Math.acos(1 - 2 * (i + 0.5) / this.numParticles);

      const x = Math.sin(phi) * Math.cos(theta);
      const y = Math.sin(phi) * Math.sin(theta);
      const z = Math.cos(phi);

      this.particles.push({
        origX: x,
        origY: y,
        origZ: z,
        x: x,
        y: y,
        z: z,
        size: Math.random() * 2 + 1.2,
        speedOffset: Math.random() * 0.001,
        noisePhase: Math.random() * Math.PI * 2,
        brightness: Math.random() * 0.5 + 0.5
      });
    }

    // Mouse Interaction
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.targetMouseX = (e.clientX - rect.left - this.width / 2) * 0.0015;
      this.targetMouseY = (e.clientY - rect.top - this.height / 2) * 0.0015;
      this.isHovered = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.targetMouseX = 0;
      this.targetMouseY = 0;
      this.isHovered = false;
    });

    this.animate();
  }

  resize() {
    const parent = this.canvas.parentElement;
    this.width = parent ? parent.clientWidth : 600;
    this.height = parent ? parent.clientHeight : 500;
    this.canvas.width = this.width * window.devicePixelRatio;
    this.canvas.height = this.height * window.devicePixelRatio;
    this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.baseRadius = Math.min(this.width, this.height) * 0.32;
    this.currentRadius = this.baseRadius;
  }

  setState(state) {
    this.state = state;
    if (state === 'listening') {
      this.targetRadius = this.baseRadius * 1.35;
      this.rotSpeedY = 0.012;
    } else if (state === 'speaking') {
      this.targetRadius = this.baseRadius * 1.2;
      this.rotSpeedY = 0.008;
    } else if (state === 'executing') {
      this.targetRadius = this.baseRadius * 1.15;
      this.rotSpeedY = 0.02;
    } else {
      this.targetRadius = this.baseRadius;
      this.rotSpeedY = 0.0035;
    }
  }

  setAudioPulse(intensity) {
    this.energyPulse = intensity;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Smooth radius & rotation interpolation
    this.currentRadius += (this.targetRadius - this.currentRadius) * 0.08;
    this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
    this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;

    this.rotX += this.rotSpeedX + this.mouseY * 0.5;
    this.rotY += this.rotSpeedY + this.mouseX * 0.5;

    const time = Date.now() * 0.002;
    const isLightMode = document.body.classList.contains('theme-light');

    // Theme color palettes
    const primaryColor = isLightMode ? '79, 70, 229' : '245, 158, 11'; // Indigo in light, Amber gold in dark
    const secondaryColor = isLightMode ? '2, 132, 199' : '251, 191, 36';
    const coreGlow = isLightMode ? 'rgba(79, 70, 229, 0.06)' : 'rgba(245, 158, 11, 0.12)';

    // Center Core Halo
    const centerX = this.width / 2;
    const centerY = this.height / 2;

    const haloGradient = this.ctx.createRadialGradient(
      centerX, centerY, 10,
      centerX, centerY, this.currentRadius * 1.2
    );
    haloGradient.addColorStop(0, coreGlow);
    haloGradient.addColorStop(0.6, 'transparent');
    this.ctx.fillStyle = haloGradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, this.currentRadius * 1.2, 0, Math.PI * 2);
    this.ctx.fill();

    const projectedPoints = [];
    const radiusMod = this.currentRadius + Math.sin(time * 3) * (this.state === 'listening' ? 18 : 4) + (this.energyPulse * 30);

    // Rotate and Project 3D Particles
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // Add slight noise displacement for organic breathing
      const noise = Math.sin(time + p.noisePhase) * 0.04;
      const r = radiusMod * (1 + noise);

      let x = p.origX * r;
      let y = p.origY * r;
      let z = p.origZ * r;

      // Rotate around X
      let y1 = y * Math.cos(this.rotX) - z * Math.sin(this.rotX);
      let z1 = y * Math.sin(this.rotX) + z * Math.cos(this.rotX);

      // Rotate around Y
      let x2 = x * Math.cos(this.rotY) + z1 * Math.sin(this.rotY);
      let z2 = -x * Math.sin(this.rotY) + z1 * Math.cos(this.rotY);

      // Perspective Projection
      const fov = 420;
      const scale = fov / (fov + z2);
      const projX = centerX + x2 * scale;
      const projY = centerY + y1 * scale;
      const alpha = Math.max(0.12, (z2 + r) / (2 * r));

      projectedPoints.push({
        x: projX,
        y: projY,
        z: z2,
        scale: scale,
        alpha: alpha,
        size: p.size * scale,
        brightness: p.brightness
      });
    }

    // Sort by Z for proper depth rendering
    projectedPoints.sort((a, b) => a.z - b.z);

    // Draw Constellation Connection Lines
    this.ctx.lineWidth = isLightMode ? 0.7 : 0.65;
    const maxDist = isLightMode ? 42 : 46;

    for (let i = 0; i < projectedPoints.length; i += 2) {
      const p1 = projectedPoints[i];
      for (let j = i + 1; j < projectedPoints.length; j += 3) {
        const p2 = projectedPoints[j];
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const lineAlpha = (1 - dist / maxDist) * Math.min(p1.alpha, p2.alpha) * (isLightMode ? 0.35 : 0.45);
          this.ctx.strokeStyle = `rgba(${primaryColor}, ${lineAlpha})`;
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    // Draw Glowing Particle Nodes
    for (let i = 0; i < projectedPoints.length; i++) {
      const p = projectedPoints[i];
      const particleAlpha = p.alpha * (isLightMode ? 0.85 : 0.95);

      this.ctx.fillStyle = `rgba(${p.brightness > 0.8 ? secondaryColor : primaryColor}, ${particleAlpha})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, Math.max(0.8, p.size), 0, Math.PI * 2);
      this.ctx.fill();

      // Subtle bloom on foreground nodes
      if (p.z > 40) {
        this.ctx.fillStyle = `rgba(${secondaryColor}, ${particleAlpha * 0.4})`;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
}
