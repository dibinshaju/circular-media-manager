import React from 'react';
import { Disc3, Github, Heart, RefreshCw, ShieldCheck } from 'lucide-react';

export const AppFooter: React.FC = () => {
  return (
    <footer className="mt-16 border-t-2 border-charcoal-border bg-white py-12 px-4 sm:px-8 pb-28">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand & Subtitle */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-yellow border-2 border-charcoal-border flex items-center justify-center shadow-editorial-sm">
            <Disc3 className="w-6 h-6 text-charcoal animate-[spin_10s_linear_infinite]" />
          </div>
          <div>
            <div className="font-display text-xl text-charcoal tracking-wide flex items-center gap-1.5">
              Loopify
              <span className="w-2 h-2 rounded-full bg-purple"></span>
            </div>
            <p className="text-xs font-semibold text-charcoal-muted">
              Continuous Circular Doubly Linked List Media System
            </p>
          </div>
        </div>

        {/* Badges / Tech Highlights */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <span className="pill-mint text-[11px]">
            <RefreshCw className="w-3 h-3" />
            O(1) Pointer Wraparound
          </span>
          <span className="pill-yellow text-[11px]">
            HTML5 Audio & Video
          </span>
          <span className="pill-purple text-[11px]">
            Spotify PKCE Web API
          </span>
        </div>

        {/* Copyright & Disclaimer */}
        <div className="text-center md:text-right text-xs font-medium text-charcoal-muted">
          <p>© {new Date().getFullYear()} Loopify. Built for data structure demonstrations.</p>
          <p className="text-[10px] mt-0.5">Spotify content is retrieved via official API and linked directly to Spotify.</p>
        </div>

      </div>
    </footer>
  );
};
