import { NextResponse } from "next/server"
import connectDB from "@/lib/db"
import Contact from "@/models/Contact"
import { sendContactEmail } from "@/lib/mailer"

export async function POST(req) {
  try {
    await connectDB()
    const { name, email, subject, message } = await req.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Save to DB
    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
    })

    // Send emails
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
