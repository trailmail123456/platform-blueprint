import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeSync, SyncStatus } from "./useRealtimeSync";

export interface Deck {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  is_public: boolean;
  card_count: number;
  study_count: number;
  created_at: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  hint: string | null;
  position: number;
}

export const useDecks = (): { decks: Deck[]; loading: boolean; status: SyncStatus; refetch: () => Promise<void> } => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const { data } = await supabase
      .from("flashcard_decks")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    setDecks((data || []) as Deck[]);
    setLoading(false);
  }, []);

  const status = useRealtimeSync({
    channelName: "flashcard-decks",
    filters: [{ table: "flashcard_decks" }],
    onChange: fetchAll,
  });

  return { decks, loading, status, refetch: fetchAll };
};

export const fetchCards = async (deckId: string): Promise<Flashcard[]> => {
  const { data } = await supabase
    .from("flashcards")
    .select("*")
    .eq("deck_id", deckId)
    .order("position", { ascending: true });
  return (data || []) as Flashcard[];
};

export const createDeck = async (input: {
  title: string;
  description?: string;
  category: string;
  cards: { front: string; back: string; hint?: string }[];
}) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");
  const { data: deck, error } = await supabase
    .from("flashcard_decks")
    .insert({
      user_id: user.user.id,
      title: input.title,
      description: input.description,
      category: input.category,
    })
    .select()
    .single();
  if (error) throw error;
  if (input.cards.length) {
    await supabase.from("flashcards").insert(
      input.cards.map((c, i) => ({ deck_id: deck.id, front: c.front, back: c.back, hint: c.hint, position: i }))
    );
  }
  return deck;
};

export const reviewCard = async (cardId: string, ease: number) => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error("Not authenticated");
  // Simple SM-2-ish: ease 1-5, days = ease^2
  const days = Math.max(1, ease * ease);
  const next = new Date(Date.now() + days * 86400000).toISOString();
  await supabase.from("flashcard_reviews").upsert(
    { card_id: cardId, user_id: user.user.id, ease, next_review_at: next, reviewed_at: new Date().toISOString() },
    { onConflict: "card_id,user_id" }
  );
};
