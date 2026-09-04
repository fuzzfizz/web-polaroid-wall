"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Pencil, Trash2, Clock, Users, User, Camera, ImageOff } from "lucide-react";

export default function PolaroidCard({
  card,
  isLiked = false,
  rotation = 0,
  onLike,
  onEdit,
  onDelete,
}) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formattedDate = new Date(card.created_at).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const hasValidPhoto = Boolean(card.photo_url && card.photo_url.trim() && !imageError);
  const hasMember2 = Boolean(card.member2_name && card.member2_name.trim());

  return (
    <div
      className="w-56 h-80 cursor-pointer select-none group"
      style={{ transform: `rotate(${rotation}deg)`, perspective: "1000px" }}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <motion.div
        className="relative w-full h-full"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Pushpin at top */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
          <div className="w-4 h-4 rounded-full bg-pushpin shadow-md border border-red-950 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>
          <div className="w-0.5 h-2 bg-gray-400 -mt-0.5 shadow-sm" />
        </div>

        {/* Front */}
        <div
          className="absolute inset-0 bg-white rounded-sm shadow-xl p-3 pb-8 flex flex-col border border-stone-200 hover:shadow-2xl transition-shadow"
          style={{ backfaceVisibility: "hidden" }}
        >
          {/* Photo frame */}
          <div className="flex-1 min-h-0 w-full bg-stone-100 rounded-sm overflow-hidden relative shadow-inner border border-stone-200/60">
            {hasValidPhoto ? (
              <img
                src={card.photo_url}
                alt={card.team_name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-50/80 to-orange-100/60 text-stone-400 gap-1.5">
                {imageError ? (
                  <>
                    <ImageOff className="w-8 h-8 text-stone-400" />
                    <span className="text-[10px] text-stone-400 font-sans">Image not found</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-10 h-10 text-stone-400/80" />
                    <span className="text-[11px] font-handwriting text-stone-500 font-bold">{card.team_name}</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="mt-2.5 text-center px-1">
            <p className="font-handwriting text-xl text-brown-text font-bold leading-tight truncate">
              {card.team_name}
            </p>
            {card.message && (
              <p className="text-xs text-brown-text/70 truncate mt-0.5 font-sans">
                {card.message}
              </p>
            )}
          </div>

          <div className="mt-auto text-center flex items-center justify-between px-1">
            <div className="flex items-center gap-1 text-[11px] text-stone-500">
              <Heart className={`w-3.5 h-3.5 ${isLiked ? "fill-heart text-heart" : "text-stone-400"}`} />
              <span className="font-medium">{card.likes || 0}</span>
            </div>
            <span className="text-[10px] text-brown-text/40 tracking-wider">CLICK TO FLIP ↻</span>
          </div>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 bg-amber-50 rounded-sm shadow-xl p-4 flex flex-col justify-between border-2 border-dashed border-cork/40"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="space-y-3">
            <div className="border-b border-cork/30 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-brown-text">
                {hasMember2 ? <Users className="w-4 h-4 text-warm-brown" /> : <User className="w-4 h-4 text-warm-brown" />}
                <span className="text-xs font-bold uppercase tracking-wider">
                  {hasMember2 ? "Team Members" : "Member"}
                </span>
              </div>
              <span className="text-[10px] text-brown-text/50 font-handwriting font-bold">#{card.id}</span>
            </div>

            <div className="space-y-2 text-xs text-brown-text bg-white/60 p-2.5 rounded border border-cork/20">
              <div className="flex flex-col">
                <span className="font-semibold text-brown-text flex items-center gap-1">
                  👤 {card.member1_name}
                </span>
                <span className="text-[11px] text-brown-text/60 font-mono pl-4">
                  ID: {card.member1_student_id}
                </span>
              </div>
              {hasMember2 && (
                <div className="border-t border-cork/10 pt-1 flex flex-col">
                  <span className="font-semibold text-brown-text flex items-center gap-1">
                    👤 {card.member2_name}
                  </span>
                  <span className="text-[11px] text-brown-text/60 font-mono pl-4">
                    ID: {card.member2_student_id}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-brown-text/50 text-[11px]">
              <Clock className="w-3.5 h-3.5 text-warm-brown/70" />
              <span>Deployed: {formattedDate}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-cork/20">
            {/* Toggle Like Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onLike(card.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm transition-all active:scale-95 ${
                isLiked
                  ? "bg-pink-100 text-heart border-pink-300 shadow-pink-100"
                  : "bg-white/80 hover:bg-pink-50 text-stone-600 hover:text-heart border-cork/30 hover:border-pink-300"
              }`}
              title={isLiked ? "Unlike this card" : "Like this card"}
            >
              <Heart
                className={`w-4 h-4 transition-transform duration-200 ${
                  isLiked ? "fill-heart text-heart scale-110" : "text-stone-400"
                }`}
              />
              <span className={`text-xs font-bold ${isLiked ? "text-heart" : "text-stone-600"}`}>
                {card.likes || 0}
              </span>
            </button>

            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(card);
                }}
                className="p-1.5 rounded-lg bg-white/80 hover:bg-cork/20 text-warm-brown transition-colors border border-cork/30"
                title="Edit card"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(card.id);
                }}
                className="p-1.5 rounded-lg bg-white/80 hover:bg-red-100 text-pushpin transition-colors border border-red-200"
                title="Delete card"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
