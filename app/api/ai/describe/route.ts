import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasProAccess } from "@/lib/billing"
import OpenAI from "openai"

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
})

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  // Pro gate — AI descriptions are a Pro (or trial) feature.
  const isPro = await hasProAccess(user.id)
  if (!isPro) {
    return NextResponse.json(
      { error: "pro_required", message: "AI descriptions are a Pro feature. Upgrade to unlock." },
      { status: 403 }
    )
  }

  if (!process.env.GROQ_API_KEY) {
    return NextResponse.json(
      { error: "not_configured", message: "AI service is not configured. Please contact support." },
      { status: 500 }
    )
  }

  try {
    const payload = await request.json()
    const { title, room_type, area, university, amenities, distance_from_gate } = payload

    const prompt = `
      You are an expert real estate copywriter for HousePlug, a student housing platform in Nigeria.
      Write a compelling, student-friendly listing description based on the following details:
      
      - Title: ${title || "N/A"}
      - Room Type: ${room_type || "N/A"}
      - Area: ${area || "N/A"}
      - University: ${university || "N/A"}
      - Distance from Gate: ${distance_from_gate || "N/A"}
      - Amenities: ${Array.isArray(amenities) ? amenities.join(", ") : "N/A"}

      Guidelines:
      - Use a professional yet friendly and inviting tone.
      - Highlight the proximity to the university if it's close.
      - Mention the specific amenities and why they matter to a student (e.g., constant light for reading, secure environment).
      - Keep it concise (under 150 words).
      - Do not use generic filler phrases like "Welcome to your new home".
      - Focus on value and comfort for a student.
      - Ensure the currency mentioned is always Naira (₦).
      
      Output ONLY the description text. No intro, no outro.
    `

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that writes student housing descriptions for the Nigerian market.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 500,
    })

    const description = completion.choices[0]?.message?.content?.trim()

    if (!description) {
      throw new Error("No description generated")
    }

    return NextResponse.json({ description })
  } catch (error: any) {
    console.error("AI Generation Error:", error)
    return NextResponse.json(
      { error: "generation_failed", message: "Failed to generate description. Please try again later." },
      { status: 500 }
    )
  }
}
