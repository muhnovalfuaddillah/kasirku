import React, { useState } from 'react';
import { IconX, IconCheckCircle, IconAlert } from './Icons';

export default function AdminPinModal({ isOpen, onClose, onLoginSuccess, currentPin = '1234' }) {
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (pinInput === currentPin) {
      setErrorMsg('');
      setPinInput('');
      onLoginSuccess();
    } else {
      setErrorMsg('PIN Admin salah! Silakan coba lagi.');
      setPinInput('');
    }
  };

  const handleKeyPress = (num) => {
    if (pinInput.length < 6) {
      setPinInput(prev => prev + num);
      setErrorMsg('');
    }
  };

  const handleDelete = () => {
    setPinInput(prev => prev.slice(0, -1));
    setErrorMsg('');
  };

  return (
    <div className="modal-overlay">
      <div className="pin-modal-card">
        <div className="pin-modal-header">
          <div>
            <h3>🔒 Akses Panel Admin</h3>
            <p className="subtitle-text">Masukkan PIN Admin untuk mengatur produk, laporan, dan Google Sheets.</p>
          </div>
          <button type="button" onClick={onClose} className="btn-close-modal">
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="pin-form-body">
          {/* Display Bullets PIN */}
          <div className="pin-display-wrapper">
            <input 
              type="password" 
              value={pinInput} 
              onChange={(e) => setPinInput(e.target.value)}
              placeholder="••••"
              maxLength={6}
              autoFocus
              className="pin-screen-input"
            />
          </div>

          {errorMsg && (
            <div className="pin-error-box">
              <IconAlert size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Number Pad Touch Friendly */}
          <div className="keypad-grid">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button 
                key={n} 
                type="button" 
                onClick={() => handleKeyPress(n.toString())}
                className="keypad-btn"
              >
                {n}
              </button>
            ))}
            <button 
              type="button" 
              onClick={handleDelete}
              className="keypad-btn keypad-fn"
            >
              ⌫
            </button>
            <button 
              type="button" 
              onClick={() => handleKeyPress('0')}
              className="keypad-btn"
            >
              0
            </button>
            <button 
              type="button" 
              onClick={handleSubmit}
              className="keypad-btn keypad-ok"
            >
              OK
            </button>
          </div>

          <div className="pin-modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary" style={{ width: '100%' }}>
              Batal (Kembali ke Kasir)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

