"use client";

import { Heart } from "lucide-react";
import { useSyncExternalStore } from "react";
import { emptyFavorites, readFavorites, subscribeStore, toggleFavorite } from "@/lib/browser-store";

export function FavoriteButton({ id }: { id: string }) {
  const favorites = useSyncExternalStore(subscribeStore, readFavorites, emptyFavorites);
  const saved = favorites.includes(id);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved spaces" : "Save this space in this browser"}
      onClick={() => toggleFavorite(id)}
      className="grid h-10 w-10 place-items-center rounded-full bg-paper/95 text-forest shadow-sm transition hover:bg-white"
    >
      <Heart size={18} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
