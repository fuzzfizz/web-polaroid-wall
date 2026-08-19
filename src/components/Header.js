"use client";

import { Camera, Pin } from "lucide-react";

export default function Header({ onOpenCreate, totalCards = 0 }) {
  return (
    <header className="bg-gradient-to-r from-warm-brown to-wood py-3 sm:py-4 px-4 sm:px-8 shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-cream/15 flex items-center justify-center border border-cream/20 shadow-inner">
            <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-cream" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-cream tracking-wide font-bold">
                Polaroid Wall
              </h1>
              {totalCards > 0 && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-cream/20 text-cream text-xs font-sans font-medium">
                  {totalCards} {totalCards === 1 ? "card" : "cards"}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-cream/70 font-sans hidden sm:block">
              Pin & share your team memories on the board
            </p>
          </div>
        </div>

        {/* Action Button: Pin Polaroid */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-full bg-cream text-warm-brown hover:bg-white font-serif text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 border border-amber-900/20"
          >
            <Pin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pushpin fill-pushpin" />
            <span>Pin Polaroid</span>
          </button>
        </div>
      </div>
    </header>
  );
}
