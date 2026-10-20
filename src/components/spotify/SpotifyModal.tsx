import React from 'react';
import { X } from 'lucide-react';
import { SpotifyConnectPanel } from './SpotifyConnectPanel.js';

interface SpotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SpotifyModal: React.FC<SpotifyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="card-editorial bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl border-2 border-charcoal-border bg-white hover:bg-yellow shadow-editorial-sm transition-all z-10"
          aria-label="Close modal"
        >
          <X className="w-5 h-5 text-charcoal" />
        </button>

        <SpotifyConnectPanel onClose={onClose} />
      </div>
    </div>
  );
};
