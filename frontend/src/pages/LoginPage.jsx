import { useState, useEffect, useRef } from 'react';
import { Shield, Lock, User, Eye, EyeOff, Zap, AlertTriangle, ChevronRight, Fingerprint, Cpu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Animated background particles
function CyberParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.8;
        this.speedY = (Math.random() - 0.5) * 0.8;
        this.opacity = Math.random() * 0.5 + 0.1;
        this.color = ['#00d4ff', '#8b5cf6', '#3b82f6', '#10b981'][Math.floor(Math.random() * 4)];
      }
      update() {
        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
          this.reset();
        }
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }

    for (let i = 0; i < 80; i++) {
      particles.push(new Particle());
    }

    function connectParticles() {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.strokeStyle = '#00d4ff';
            ctx.globalAlpha = 0.05 * (1 - dist / 150);
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => { p.update(); p.draw(); });
      connectParticles();
      animationId = requestAnimationFrame(animate);
    }
    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="login-particles" />;
}

// Hex grid background overlay
function HexGrid() {
  return (
    <svg className="login-hex-grid" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <pattern id="hexGrid" width="60" height="52" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
          <path
            d="M30 0 L60 15 L60 37 L30 52 L0 37 L0 15 Z"
            fill="none"
            stroke="rgba(0,212,255,0.04)"
            strokeWidth="0.5"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hexGrid)" />
    </svg>
  );
}

export default function LoginPage({ onLogin }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [scanLine, setScanLine] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

  // Scan line animation
  useEffect(() => {
    const interval = setInterval(() => {
      setScanLine(prev => (prev + 1) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  // Lock timer
  useEffect(() => {
    if (lockTimer > 0) {
      const timer = setTimeout(() => setLockTimer(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (isLocked && lockTimer === 0) {
      setIsLocked(false);
      setAttempts(0);
    }
  }, [lockTimer, isLocked]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const result = login(username, password);

    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => {
        onLogin();
      }, 2000);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= 5) {
        setIsLocked(true);
        setLockTimer(30);
        setError('Account locked due to too many failed attempts. Try again in 30 seconds.');
      } else {
        setError(`Invalid credentials. ${5 - newAttempts} attempts remaining.`);
      }
    }
    setIsLoading(false);
  };

  if (showSuccess) {
    return (
      <div className="login-page">
        <CyberParticles />
        <HexGrid />
        <div className="login-success-overlay">
          <div className="login-success-content">
            <div className="success-shield-icon">
              <Shield size={48} />
              <div className="success-ring" />
              <div className="success-ring ring-2" />
            </div>
            <h2>Access Granted</h2>
            <p>Initializing CyberShield Engine...</p>
            <div className="success-progress-bar">
              <div className="success-progress-fill" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <CyberParticles />
      <HexGrid />

      {/* Scan line effect */}
      <div className="login-scanline" style={{ top: `${scanLine}%` }} />

      <div className="login-container">
        {/* Left side - Branding */}
        <div className="login-branding">
          <div className="login-brand-content">
            <div className="login-logo-large">
              <div className="login-logo-shield">
                <Shield size={40} strokeWidth={2} />
                <div className="shield-pulse-ring" />
                <div className="shield-pulse-ring ring-2" />
                <div className="shield-pulse-ring ring-3" />
              </div>
            </div>
            <h1 className="login-brand-title">
              <span className="gradient-text">CYBER</span>SHIELD
            </h1>
            <p className="login-brand-subtitle">AI-Driven Threat Detection & Simulation Engine</p>

            <div className="login-features">
              <div className="login-feature">
                <div className="feature-icon">
                  <Zap size={18} />
                </div>
                <div>
                  <h4>Real-Time Monitoring</h4>
                  <p>24/7 threat surveillance with AI-powered detection</p>
                </div>
              </div>
              <div className="login-feature">
                <div className="feature-icon purple">
                  <Cpu size={18} />
                </div>
                <div>
                  <h4>ML-Based Analysis</h4>
                  <p>Deep learning models with 94.3% detection accuracy</p>
                </div>
              </div>
              <div className="login-feature">
                <div className="feature-icon red">
                  <Fingerprint size={18} />
                </div>
                <div>
                  <h4>Attack Simulation</h4>
                  <p>Red team operations & penetration testing</p>
                </div>
              </div>
            </div>

            <div className="login-stats-row">
              <div className="login-stat">
                <span className="stat-value">1.2M+</span>
                <span className="stat-label">Events/Day</span>
              </div>
              <div className="login-stat">
                <span className="stat-value">99.9%</span>
                <span className="stat-label">Uptime</span>
              </div>
              <div className="login-stat">
                <span className="stat-value">&lt;50ms</span>
                <span className="stat-label">Response</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="login-form-side">
          <form className="login-form" onSubmit={handleSubmit} id="login-form">
            <div className="login-form-header">
              <div className="login-form-icon">
                <Lock size={20} />
              </div>
              <h2>Secure Access</h2>
              <p>Enter your credentials to access the SOC dashboard</p>
            </div>

            {error && (
              <div className={`login-error ${isLocked ? 'locked' : ''}`}>
                <AlertTriangle size={16} />
                <span>{error}</span>
              </div>
            )}

            {isLocked && (
              <div className="login-lockout-timer">
                <Lock size={14} />
                <span>Locked for <strong>{lockTimer}s</strong></span>
                <div className="lockout-bar">
                  <div className="lockout-fill" style={{ width: `${(lockTimer / 30) * 100}%` }} />
                </div>
              </div>
            )}

            <div className="login-field">
              <label htmlFor="login-username">
                <User size={14} />
                Username
              </label>
              <div className="login-input-wrap">
                <input
                  type="text"
                  id="login-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  disabled={isLocked || isLoading}
                  autoComplete="username"
                  autoFocus
                />
                <div className="input-glow" />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">
                <Lock size={14} />
                Password
              </label>
              <div className="login-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  disabled={isLocked || isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <div className="input-glow" />
              </div>
            </div>

            <div className="login-options">
              <label className="login-checkbox">
                <input type="checkbox" id="remember-me" />
                <span className="checkmark" />
                Remember session
              </label>
              <a href="#" className="forgot-link">Forgot access?</a>
            </div>

            <button
              type="submit"
              className={`login-submit-btn ${isLoading ? 'loading' : ''}`}
              disabled={isLocked || isLoading}
              id="login-submit"
            >
              {isLoading ? (
                <>
                  <div className="login-spinner" />
                  Authenticating...
                </>
              ) : (
                <>
                  <Shield size={18} />
                  Access Dashboard
                  <ChevronRight size={16} className="btn-arrow" />
                </>
              )}
            </button>

            <div className="login-footer">
              <div className="login-security-badge">
                <Lock size={10} />
                <span>256-bit AES Encrypted</span>
              </div>
              <div className="login-attempts-info">
                {attempts > 0 && (
                  <span className="attempt-counter">
                    Failed: {attempts}/5
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
