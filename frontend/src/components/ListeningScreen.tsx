import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { meta } from '../config';

interface ListeningScreenProps {
  clientName: string;
  isPlaying: boolean;
  onStart: () => void;
  onStop: () => void;
  onChangeName: (name: string) => void;
  metadata?: {
    title?: string;
    artist?: string | string[];
    album?: string;
    artUrl?: string;
  };
  analyser?: AnalyserNode | null;
}

const QUICK_NAMES = ['Salón', 'Cocina', 'Habitación', 'Terraza', 'Oficina', 'Jardín'];

const ListeningScreen: React.FC<ListeningScreenProps> = ({
  clientName,
  isPlaying,
  onStart,
  onStop,
  onChangeName,
  analyser,
}) => {
  const statusDot = isPlaying ? 'online' : 'offline';
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState(clientName);
  const [nameError, setNameError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);

  const handlePlayStop = () => {
    if (isPlaying) {
      onStop();
      return;
    }
    onStart();
  };

  const openNameModal = useCallback(() => {
    setNameInput(clientName);
    setNameError('');
    setShowNameModal(true);
  }, [clientName]);

  const closeNameModal = useCallback(() => {
    setShowNameModal(false);
    setNameError('');
  }, []);

  const confirmNameChange = useCallback(() => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('El nombre no puede estar vacío');
      nameInputRef.current?.classList.add('shake');
      setTimeout(() => nameInputRef.current?.classList.remove('shake'), 500);
      return;
    }
    if (trimmed.length > 30) {
      setNameError('Máximo 30 caracteres');
      return;
    }
    onChangeName(trimmed);
    setShowNameModal(false);
  }, [nameInput, onChangeName]);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') confirmNameChange();
    if (e.key === 'Escape') closeNameModal();
  }, [confirmNameChange, closeNameModal]);

  // Focus input when modal opens
  useEffect(() => {
    if (showNameModal) {
      setTimeout(() => nameInputRef.current?.focus(), 80);
    }
  }, [showNameModal]);

  // Handle state effects
  useEffect(() => {
    // We could add state-based logic here if needed, 
    // currently the points and disco pulse via CSS and Visualizer Logic.
  }, [isPlaying]);

  // Spectacular Modern Visualizer Logic
  const [bassIntensity, setBassIntensity] = useState(0);
  const [trebleIntensity, setTrebleIntensity] = useState(0);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    if (!analyser || !isPlaying) {
      setBassIntensity(0);
      setTrebleIntensity(0);
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // Bass intensity (low frequencies)
      let bass = 0;
      for (let i = 0; i < 8; i++) bass += dataArray[i];
      setBassIntensity((bass / 8) / 255);

      // Treble intensity (high frequencies)
      let treble = 0;
      const mid = Math.floor(bufferLength / 2);
      for (let i = mid; i < mid + 30; i++) treble += dataArray[i];
      setTrebleIntensity((treble / 30) / 255);

      animationRef.current = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationRef.current);
  }, [analyser, isPlaying]);

  // Stable Constellation Data (prevent jitter)
  const particles = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      speed: `${4 + Math.random() * 8}s`,
      dist: `${130 + Math.random() * 60}px`,
      size: `${2 + Math.random() * 4}px`,
      opacity: 0.3 + Math.random() * 0.5,
      color: i % 3 === 0 ? 'white' : 'var(--orange)',
      delay: `${Math.random() * -10}s`
    }));
  }, []); // Only generate ONCE per mount

  return (
    <div className="screen active">
      <div className="bg-orbs">
        <div className={`orb orb-1 ${isPlaying ? 'orb-pulse' : ''}`}></div>
        <div className={`orb orb-2 ${isPlaying ? 'orb-pulse' : ''}`} style={{ animationDelay: '-.8s' }}></div>
        <div className={`orb orb-3 ${isPlaying ? 'orb-pulse' : ''}`} style={{ animationDelay: '-1.6s' }}></div>
      </div>

      <div className="playing-content">
        <div className="brand-stack">
          <img src="/logo.png" alt="Logo" className="track-logo" />
          <h2 className="track-brand-title">
            {meta.company}
            <span className="track-brand-accent">Bridge</span>
          </h2>
        </div>

        <div className="middle-visualization">
          <div className="album-visualizer">
            {/* Orbiting Points (Stable Constellation - Fixed Visibility) */}
            {isPlaying && particles.map((p, i) => (
              <div 
                key={i} 
                className="hub-particle-orbit"
                style={{ 
                  '--index': i,
                  '--speed': p.speed,
                  '--dist': p.dist,
                  '--delay': p.delay
                } as any}
              >
                <div 
                  className="hub-particle-dot"
                  style={{ 
                    '--size': p.size,
                    '--opacity': p.opacity,
                    '--color': p.color
                  } as any}
                />
              </div>
            ))}

            <div 
              className={`album-ring ${isPlaying ? 'album-ring--active' : 'album-ring--stopped'}`}
              style={{ transform: isPlaying ? `scale(${1.05 + bassIntensity * 0.05}) rotateX(4deg)` : 'scale(0.95)' }}
            >
              <div className="album-inner">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#f97316', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
                    </linearGradient>
                    <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" style={{ stopColor: 'rgba(255,255,255,0.1)', stopOpacity: 1 }} />
                      <stop offset="100%" style={{ stopColor: 'rgba(0,0,0,0.4)', stopOpacity: 1 }} />
                    </radialGradient>
                  </defs>
                  
                  {/* Disco / Vinyl Circle */}
                  <circle cx="100" cy="100" r="95" fill="#0c1222" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <circle cx="100" cy="100" r="90" fill="url(#grad1)" />

                  {/* Grooves */}
                  {[...Array(12)].map((_, i) => (
                    <circle key={i} cx="100" cy="100" r={85 - i * 6} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
                  ))}

                  <circle cx="100" cy="100" r="60" fill="#080c18" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  <circle cx="100" cy="100" r="58" fill="url(#ringGrad)" opacity="0.5" />

                  <circle cx="100" cy="100" r="30" fill="#f97316" />
                  <circle cx="100" cy="100" r="28" fill="rgba(255,255,255,0.1)" />
                  <circle cx="100" cy="100" r="8" fill="#080c18" />

                  {/* Visual highlights */}
                  <path 
                    d="M40 100 A 60 60 0 0 1 100 40" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.15)" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    style={{ opacity: 0.5 + trebleIntensity * 0.5 }}
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className={`playing-header ${isPlaying ? 'playing-header--active' : ''}`}>
          <div className="header-user-info">
            <div className="status-section">
              <div className={`status-dot ${statusDot}`}></div>
              <span className="status-state">{isPlaying ? 'Escuchando' : 'En espera'}</span>
            </div>
            <button className="user-section" onClick={openNameModal} title="Cambiar nombre">
              <span className="client-icon-header">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </span>
              <span className="client-name">{clientName}</span>
              <span className="btn-edit-icon" aria-label="Cambiar nombre">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z" />
                </svg>
              </span>
            </button>
          </div>

          <div className="switch-wrapper">
            <span className={`switch-label ${!isPlaying ? 'switch-label--active' : ''}`}>Off</span>
            <button
              className={`toggle-switch ${isPlaying ? 'toggle-switch--on' : ''}`}
              onClick={handlePlayStop}
              role="switch"
              aria-checked={isPlaying}
              aria-label={isPlaying ? 'Desconectar' : 'Conectar'}
            >
              <span className="toggle-switch__track">
                <span className="toggle-switch__glow"></span>
              </span>
              <span className="toggle-switch__thumb">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18.36 5.64a9 9 0 11-12.73 0" />
                  <line x1="12" y1="2" x2="12" y2="12" />
                </svg>
              </span>
            </button>
            <span className={`switch-label ${isPlaying ? 'switch-label--active' : ''}`}>On</span>
          </div>
        </div>
      </div>

      {/* ── Name Change Modal ── */}
      <div className={`modal-overlay ${showNameModal ? 'modal-overlay--visible' : ''}`} onClick={closeNameModal}>
        <div className={`modal-card glass-card ${showNameModal ? 'modal-card--visible' : ''}`} onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <div className="name-icon-ring name-icon-ring--small">
              <svg viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
            </div>
            <h3 className="modal-title">Cambiar nombre</h3>
            <p className="modal-sub">Identifica este dispositivo en el servidor</p>
          </div>

          <div className="input-wrapper">
            <input
              ref={nameInputRef}
              className="name-input"
              type="text"
              placeholder="Tu nombre…"
              maxLength={30}
              value={nameInput}
              onChange={(e) => { setNameInput(e.target.value); setNameError(''); }}
              onKeyDown={handleNameKeyDown}
            />
            <div className="input-line"></div>
          </div>

          {nameError && <p className="error-msg">{nameError}</p>}

          <div className="name-tags">
            {QUICK_NAMES.map(tag => (
              <span
                key={tag}
                className={`tag ${nameInput === tag ? 'tag--selected' : ''}`}
                onClick={() => { setNameInput(tag); setNameError(''); }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={closeNameModal}>Cancelar</button>
            <button className="btn-primary btn-small" onClick={confirmNameChange} disabled={!nameInput.trim()}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListeningScreen;
