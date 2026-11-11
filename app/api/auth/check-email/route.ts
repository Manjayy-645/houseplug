import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json({ error: "Account lookup is unavailable. Sign in with your email and password." }, { status: 410 })
}
