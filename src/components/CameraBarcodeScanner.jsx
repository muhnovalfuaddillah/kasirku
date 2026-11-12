import React, { useState, useEffect, useRef } from 'react';
import { IconCamera, IconX, IconBarcode, IconCheck } from './Icons';

export default function CameraBarcodeScanner({ isOpen, onClose, onScan }) {
  const [error, setError] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    setError('');

    let activeStream = null;

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('Browser Anda tidak mendukung akses kamera.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
        });

        activeStream = stream;
        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Cek dukungan BarcodeDetector bawaan browser
        if ('BarcodeDetector' in window) {
          const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code']
          });

          intervalRef.current = setInterval(async () => {
            if (videoRef.current && videoRef.current.readyState === 4) {
              try {
                const barcodes = await detector.detect(videoRef.current);
                if (barcodes.length > 0) {
                  const detectedCode = barcodes[0].rawValue;
                  if (detectedCode) {
                    clearInterval(intervalRef.current);
                    onScan(detectedCode);
                    onClose();
                  }
                }
              } catch (e) {
                // Ignore detection frame error
              }
            }
          }, 250);
        } else {
          setIsSupported(false);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Gagal mengakses kamera. Pastikan izin kamera telah diberikan di browser Anda.');
      }
    };

    startCamera();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (activeStream) {
        activeStream.getTracks().forEach(track => track.stop());
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
      onClose();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="camera-scanner-modal-card">
        <div className="camera-scanner-header">
          <div className="camera-header-title">
            <IconCamera size={20} className="text-primary" />
            <h3>Scan Barcode Produk via Kamera</h3>
          </div>
          <button type="button" onClick={onClose} className="btn-close-modal" title="Tutup">
            <IconX size={20} />
          </button>
        </div>

        <div className="camera-scanner-body">
          {error ? (
            <div className="camera-error-box">
              <p>{error}</p>
              <span className="text-xs text-muted">Anda tetap dapat menggunakan alat scan barcode fisik (USB/Wireless) atau input manual di bawah.</span>
            </div>
          ) : (
            <div className="camera-viewfinder-container">
              <video 
                ref={videoRef} 
                className="camera-video-preview" 
                playsInline 
                muted 
              />
              <div className="camera-laser-line"></div>
              <div className="camera-scan-frame">
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>
              <div className="camera-instruction-pill">
                Arahkan barcode produk ke dalam kotak
              </div>
            </div>
          )}

          {!isSupported && !error && (
            <div className="camera-notice-warning">
              💡 Browser ini tidak memiliki BarcodeDetector bawaan. Anda dapat menggunakan alat scan barcode USB / ketik manual di bawah.
            </div>
          )}

          {/* Fallback Input Manual Barcode */}
          <form onSubmit={handleManualSubmit} className="camera-manual-input-row">
            <div className="input-with-icon-wrapper">
              <IconBarcode size={18} className="search-icon" />
              <input 
                type="text" 
                placeholder="Atau ketik angka barcode..." 
                value={manualCode}
                onChange={e => setManualCode(e.target.value)}
                className="admin-input"
                autoFocus
              />
            </div>
            <button type="submit" className="admin-btn-primary">
              <IconCheck size={16} /> Tambah
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

