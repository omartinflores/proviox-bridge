import React, { useEffect, useRef, useState, useCallback } from 'react';
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
}

const QUICK_NAMES = ['Salón', 'Cocina', 'Habitación', 'Terraza', 'Oficina', 'Jardín'];

const ListeningScreen: React.FC<ListeningScreenProps> = ({
  clientName,
  isPlaying,
  onStart,
  onStop,
  onChangeName,
}) => {
  const statusDot = isPlaying ? 'online' : 'offline';
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameInput, setNameInput] = useState(clientName);
  const [nameError, setNameError] = useState('');
  const nameInputRef = useRef<HTMLInputElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const discRef = useRef<HTMLDivElement>(null);

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

  // Handle animation and state effects
  useEffect(() => {
    if (isPlaying) {
      if (ringRef.current) {
        ringRef.current.style.animationPlayState = 'running';
      }
      return () => {
        if (ringRef.current) ringRef.current.style.animationPlayState = 'paused';
      };
    } else {
      if (ringRef.current) ringRef.current.style.animationPlayState = 'paused';
    }
  }, [isPlaying]);

  return (
    <div className="screen active">
      <div className="bg-orbs">
        <div className={`orb orb-1 ${isPlaying ? 'orb-pulse' : ''}`}></div>
        <div className={`orb orb-2 ${isPlaying ? 'orb-pulse' : ''}`} style={{animationDelay: '-.8s'}}></div>
        <div className={`orb orb-3 ${isPlaying ? 'orb-pulse' : ''}`} style={{animationDelay: '-1.6s'}}></div>
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
          <div className={`album-ring ${isPlaying ? 'album-ring--active' : 'album-ring--stopped'}`} ref={discRef}>
            <div className="album-inner">
              <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#f97316', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#7c3aed', stopOpacity: 1}} />
                  </linearGradient>
                  <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" style={{stopColor: 'rgba(255,255,255,0.1)', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: 'rgba(0,0,0,0.4)', stopOpacity: 1}} />
                  </radialGradient>
                </defs>
                <circle cx="100" cy="100" r="95" fill="#0c1222" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
                <circle cx="100" cy="100" r="90" fill="url(#grad1)"/>
                
                {/* Grooves and texture */}
                {[...Array(12)].map((_, i) => (
                  <circle key={i} cx="100" cy="100" r={85 - i * 6} fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5"/>
                ))}
                
                <circle cx="100" cy="100" r="60" fill="#080c18" stroke="rgba(255,255,255,0.1)" strokeWidth="2"/>
                <circle cx="100" cy="100" r="58" fill="url(#ringGrad)" opacity="0.5"/>
                
                <circle cx="100" cy="100" r="30" fill="#f97316"/>
                <circle cx="100" cy="100" r="28" fill="rgba(255,255,255,0.1)"/>
                <circle cx="100" cy="100" r="8" fill="#080c18"/>
                
                {/* Visual highlights */}
                <path d="M40 100 A 60 60 0 0 1 100 40" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div className="album-spin-ring" ref={ringRef}></div>
            <div className="album-glow"></div>
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
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <span className="client-name">{clientName}</span>
              <span className="btn-edit-icon" aria-label="Cambiar nombre">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z"/>
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
                  <path d="M18.36 5.64a9 9 0 11-12.73 0"/>
                  <line x1="12" y1="2" x2="12" y2="12"/>
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/>
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
