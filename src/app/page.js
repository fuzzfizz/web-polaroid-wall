"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import CorkBoard from "@/components/CorkBoard";
import CreateFormModal from "@/components/CreateFormModal";
import { Pin, Plus } from "lucide-react";

export default function Home() {
  const [cards, setCards] = useState([]);
  const [editingCard, setEditingCard] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCards = async () => {
    try {
      const res = await fetch("/api/wall");
      const data = await res.json();
      setCards(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to fetch cards:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  const handleCardCreated = (newCard) => {
    setCards((prev) => [newCard, ...prev]);
  };

  const handleCardUpdated = (updatedCard) => {
    setCards((prev) =>
      prev.map((c) => (c.id === updatedCard.id ? updatedCard : c))
    );
    setEditingCard(null);
  };

  const handleLike = async (id) => {
    // Optimistic UI update
    setCards((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const currentlyLiked = Boolean(c.is_liked_by_me);
          return {
            ...c,
            is_liked_by_me: !currentlyLiked,
            likes: currentlyLiked ? Math.max(0, (c.likes || 1) - 1) : (c.likes || 0) + 1,
          };
        }
        return c;
      })
    );

    try {
      const res = await fetch(`/api/wall/${id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle" }),
      });
      const data = await res.json();
      if (res.ok) {
        setCards((prev) => prev.map((c) => (c.id === id ? data : c)));
      } else {
        fetchCards();
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
      fetchCards();
    }
  };

  const handleEdit = (card) => {
    setEditingCard(card);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this polaroid?")) return;
    try {
      const res = await fetch(`/api/wall/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCards((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete card:", error);
    }
  };

  const handleOpenCreate = () => {
    setEditingCard(null);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      <Header onOpenCreate={handleOpenCreate} totalCards={cards.length} />

      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 md:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3">
            <div className="w-10 h-10 border-4 border-warm-brown/30 border-t-warm-brown rounded-full animate-spin" />
            <p className="font-serif text-lg text-brown-text/60 animate-pulse">
              Loading polaroid wall...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Board Subheader */}
            <div className="flex items-center justify-between px-2 text-xs sm:text-sm text-brown-text/70">
              <span className="font-handwriting text-lg sm:text-xl font-bold text-brown-text">
                📌 Pinned Memories ({cards.length})
              </span>
              <span className="text-[11px] sm:text-xs text-brown-text/50">
                Click any polaroid to flip and see details
              </span>
            </div>

            {/* Full-width Cork Board */}
            <CorkBoard
              cards={cards}
              onLike={handleLike}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </div>
        )}
      </main>

      {/* Floating Action Button (FAB) at Bottom-Right */}
      <button
        type="button"
        onClick={handleOpenCreate}
        className="fixed bottom-5 right-5 sm:bottom-7 sm:right-7 z-30 flex items-center gap-2 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-warm-brown hover:bg-wood-dark text-cream font-serif text-sm sm:text-base font-bold shadow-2xl hover:shadow-3xl hover:scale-105 transition-all active:scale-95 border-2 border-cream/30 group"
        title="Pin a new Polaroid"
      >
        <Pin className="w-4 h-4 sm:w-5 sm:h-5 text-pushpin fill-pushpin group-hover:rotate-12 transition-transform" />
        <span>Pin New Card</span>
      </button>

      {/* Modal Popup for Create / Edit */}
      <CreateFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCard(null);
        }}
        onCardCreated={handleCardCreated}
        editingCard={editingCard}
        onCardUpdated={handleCardUpdated}
      />
    </div>
  );
}
