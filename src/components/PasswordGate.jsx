import { useState } from 'react';
import { authenticate } from '../utils/auth';

export function ArgusLogoSvg({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Argus Logo"
    >
      {/* Crane mast */}
      <line x1="10" y1="54" x2="10" y2="20" stroke="#f1f5f9" strokeWidth="3.5" strokeLinecap="round" />
      {/* Crane jib */}
      <line x1="10" y1="20" x2="46" y2="20" stroke="#f1f5f9" strokeWidth="3.5" strokeLinecap="round" />
      {/* Counter jib */}
      <line x1="10" y1="20" x2="2" y2="23" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      {/* Trolley line */}
      <line x1="36" y1="20" x2="36" y2="28" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
      {/* Hook */}
      <circle cx="36" cy="30" r="2" fill="#94a3b8" />
      {/* Base */}
      <rect x="4" y="54" width="12" height="5" rx="2" fill="#475569" />
      {/* Eye outer glow */}
      <ellipse cx="44" cy="42" rx="15" ry="11" fill="#1e3a8a" opacity="0.3" />
      {/* Eye white */}
      <ellipse cx="44" cy="42" rx="12" ry="8" fill="#dbeafe" />
      {/* Eye iris */}
      <circle cx="44" cy="42" r="5.5" fill="#2563eb" />
      {/* Eye pupil */}
      <circle cx="44" cy="42" r="3" fill="#0f172a" />
      {/* Catch light */}
      <circle cx="46" cy="40" r="1.3" fill="#fff" opacity="0.85" />
      {/* Upper eyelid arc */}
      <path d="M32 42 Q44 29 56 42" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      {/* Lower eyelid arc */}
      <path d="M32 42 Q44 55 56 42" stroke="#1e293b" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function PasswordGate({ value: password, onUnlock }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    if (input === (password || '0000')) {
      authenticate(password || '0000');
      onUnlock();
    } else {
      setError(true);
      setInput('');
      setTimeout(() => setError(false), 1500);
    }
  }

  return (
    <div className="password-gate">
      <div className="password-gate-card">
        <div className="password-gate-logo">
          <ArgusLogoSvg size={56} />
          <span className="password-gate-title">Argus</span>
        </div>
        <p className="password-gate-sub">Bauprojekt-Verwaltung</p>
        <form onSubmit={handleSubmit} className="password-gate-form">
          <input
            className={`input password-gate-input${error ? ' password-gate-input--error' : ''}`}
            type="password"
            placeholder="Passwort eingeben"
            value={input}
            autoFocus
            onChange={(e) => { setInput(e.target.value); setError(false); }}
          />
          {error && <p className="password-gate-error">Falsches Passwort</p>}
          <button className="btn btn-primary password-gate-btn" type="submit">Einloggen</button>
        </form>
      </div>
    </div>
  );
}
