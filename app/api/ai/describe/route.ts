import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { hasProAccess } from "@/lib/billing"
import OpenAI from "openai"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
  })

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

    const systemPrompt = `You are a housing copywriter for 
HousePlug, a student housing platform in Nigeria. Write 
short, honest, punchy property descriptions that appeal 
to Nigerian university students. No fluff, no hype.`

    const userPrompt = `Write a property description in 
exactly 2-3 short paragraphs, max 120 words total.

Property details:
- Type: ${room_type}
- Location: ${area}, ${distance_from_gate} from ${university} gate
- Amenities: ${amenities?.join(', ')}
${title ? `- Extra context: ${title}` : ''}

Rules:
- Lead with the strongest selling point
- Mention campus distance in paragraph 1
- List 2-3 standout amenities naturally in the text
- Sound like a trusted friend recommending a place
- Nigerian English is fine (e.g. "constant light", "no agent fee")
- Never start with "Welcome" or "Introducing"
- Output ONLY the description, nothing else`

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.65,
      max_tokens: 200,
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
