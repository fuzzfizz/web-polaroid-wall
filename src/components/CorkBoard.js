"use client";

import PolaroidCard from "./PolaroidCard";

function getRotation(index) {
  const rotations = [-3, 1, -1, 2, -2, 3, 0, -1.5, 2.5, -0.5];
  return rotations[index % rotations.length];
}

export default function CorkBoard({ cards, onLike, onEdit, onDelete }) {
  return (
    <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 sm:border-8 border-wood">
      <div
        className="min-h-[450px] sm:min-h-[600px] p-4 sm:p-6"
        style={{
          backgroundColor: "#C4956A",
          backgroundImage: `
            radial-gradient(ellipse at 20% 50%, rgba(139, 105, 20, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(166, 123, 91, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(139, 105, 20, 0.1) 0%, transparent 50%)
          `,
        }}
      >
        {cards.length === 0 ? (
          <div className="flex items-center justify-center h-64 sm:h-96">
            <div className="text-center text-white/70 px-4">
              <p className="font-serif text-xl sm:text-2xl mb-2">No polaroids yet!</p>
              <p className="text-xs sm:text-sm">Create your first polaroid and pin it to the board</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 sm:gap-6 justify-center items-start">
            {cards.map((card, index) => (
              <PolaroidCard
                key={card.id}
                card={card}
                isLiked={Boolean(card.is_liked_by_me)}
                rotation={getRotation(index)}
                onLike={onLike}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
