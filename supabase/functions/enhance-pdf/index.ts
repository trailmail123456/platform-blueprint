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
    const { pdfUrl } = await req.json();
    
    if (!pdfUrl) {
      return new Response(
        JSON.stringify({ error: "PDF URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing PDF:", pdfUrl);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch the PDF from storage
    const response = await fetch(pdfUrl);
    if (!response.ok) {
      throw new Error("Failed to fetch PDF");
    }

    const pdfBuffer = await response.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

    console.log("PDF fetched, size:", pdfBuffer.byteLength, "bytes");

    // Use Lovable AI to analyze and enhance the PDF
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a PDF enhancement assistant. Analyze the PDF and provide instructions for cleaning shadows, straightening pages, enhancing contrast, and extracting text via OCR. Return structured JSON with enhancement suggestions.",
          },
          {
            role: "user",
            content: `Analyze this PDF and suggest enhancements for: shadow removal, page straightening, contrast enhancement, and provide OCR text extraction. PDF size: ${pdfBuffer.byteLength} bytes`,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, please try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add credits to your workspace" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const enhancements = aiData.choices?.[0]?.message?.content;

    console.log("AI Analysis complete:", enhancements?.substring(0, 200));

    // For now, return the original URL with enhancement metadata
    // In a full implementation, you would apply actual image processing here
    return new Response(
      JSON.stringify({
        enhancedUrl: pdfUrl,
        enhancements,
        processed: true,
        message: "PDF analyzed with AI. Image processing implementation pending.",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in enhance-pdf:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to enhance PDF" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
