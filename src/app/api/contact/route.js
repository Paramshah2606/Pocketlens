import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Contact from "@/models/Contact"
import { sendContactEmail } from "@/lib/mailer"
import { cleanString, normalizeEmail, clientIp } from "@/lib/validate"

// Public endpoint, so it is rate limited per sender email and per IP
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_EMAIL = 3
const MAX_PER_IP = 5

export async function POST(req) {
  try {
    await connectDB()
    const body = await req.json().catch(() => ({}))

    const name = cleanString(body.name, { max: 80 })
    const email = normalizeEmail(body.email) // exactly one address; rejects comma lists
    const subject = cleanString(body.subject, { max: 120 })
    const message = cleanString(body.message, { max: 5000 })

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Please fill in every field with a valid email address" },
        { status: 400 }
      )
    }

    const ip = clientIp(req)
    const since = new Date(Date.now() - WINDOW_MS)
    const [byEmail, byIp] = await Promise.all([
      Contact.countDocuments({ email, createdAt: { $gte: since } }),
      ip ? Contact.countDocuments({ ip, createdAt: { $gte: since } }) : 0,
    ])
    if (byEmail >= MAX_PER_EMAIL || byIp >= MAX_PER_IP) {
      return NextResponse.json(
        { error: "You've sent several messages recently. Please try again in an hour." },
        { status: 429 }
      )
    }

    await Contact.create({ name, email, subject, message, ip })
    await sendContactEmail({ name, email, subject, message })

    return NextResponse.json(
      { message: "Your inquiry has been sent successfully!" },
      { status: 201 }
    )
  } catch (error) {
    console.error("Contact API error:", error)
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    )
  }
}
