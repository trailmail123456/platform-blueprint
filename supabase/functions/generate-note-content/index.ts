import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { noteId, type } = await req.json();
    
    if (!noteId || !type) {
      return new Response(
        JSON.stringify({ error: "Note ID and type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the note
    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .single();

    if (noteError) throw noteError;

    console.log("Generating", type, "for note:", note.title);

    let prompt = "";
    let systemPrompt = "";

    switch (type) {
      case "summary":
        systemPrompt = "You are an expert at creating concise, informative summaries of educational content. Create a clear summary with key points.";
        prompt = `Create a comprehensive summary of these notes titled "${note.title}" on ${note.subject}. Include:
- Main topics covered
- Key concepts (3-5 bullet points)
- Important definitions
- Practical applications
Keep it under 200 words but informative.`;
        break;

      case "quiz":
        systemPrompt = "You are an expert at creating educational quizzes. Generate questions that test understanding, not just memorization.";
        prompt = `Create 5 multiple-choice quiz questions for notes titled "${note.title}" on ${note.subject}. For each question provide:
- Question text
- 4 answer options (A, B, C, D)
- Correct answer
- Brief explanation why
Format as JSON array: [{"question": "...", "options": ["A: ...", "B: ...", "C: ...", "D: ..."], "correct": "A", "explanation": "..."}]`;
        break;

      case "flashcards":
        systemPrompt = "You are an expert at creating effective study flashcards that help students learn efficiently.";
        prompt = `Create 8 flashcards for notes titled "${note.title}" on ${note.subject}. Each flashcard should have:
- Front: A question or term
- Back: Clear, concise answer or definition
Format as JSON array: [{"front": "...", "back": "..."}]`;
        break;

      case "related":
        systemPrompt = "You are an expert at finding connections between educational topics.";
        prompt = `Based on the note titled "${note.title}" on ${note.subject}, suggest related topics or keywords that students should explore. List 5 related topics.`;
        break;
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    console.log("AI content generated:", content?.substring(0, 100));

    // Store or update AI content
    const updateData: any = {};
    
    if (type === "summary") {
      updateData.summary = content;
    } else if (type === "quiz") {
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const quizData = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        updateData.quiz_data = quizData;
      } catch {
        updateData.quiz_data = [{ question: "Error parsing quiz", options: [], correct: "", explanation: content }];
      }
    } else if (type === "flashcards") {
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        const flashcards = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        updateData.flashcards = flashcards;
      } catch {
        updateData.flashcards = [{ front: "Error parsing flashcards", back: content }];
      }
    } else if (type === "related") {
      // For now, just store as part of summary
      updateData.summary = (updateData.summary || "") + "\n\nRelated Topics:\n" + content;
    }

    const { error: upsertError } = await supabase
      .from("note_ai_content")
      .upsert(
        {
          note_id: noteId,
          ...updateData,
        },
        { onConflict: "note_id" }
      );

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ success: true, content, type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in generate-note-content:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to generate content" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
