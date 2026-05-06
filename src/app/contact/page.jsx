"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MessageSquare, Send, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: ""
    }
  })

  const onSubmit = async (data) => {
    setIsSubmitting(true)
    setSubmitError("")

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        setIsSubmitted(true)
        reset()
      } else {
        const result = await res.json()
        setSubmitError(result.error || "Failed to send message")
      }
    } catch (err) {
      setSubmitError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      
      <main className="flex-1">
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto max-w-6xl px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
              <div>
                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6 leading-tight">
                  Get in <span className="text-blue-600">touch</span>.
                </h1>
                <p className="text-lg text-slate-600 mb-10 leading-relaxed">
                  Have a question, feedback, or need help? Our team is here to support you. 
                  Fill out the form and we'll get back to you within 24 hours.
                </p>

                <div className="space-y-8">
                  <div className="flex items-start gap-5">
                    <div className="h-14 w-14 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
                      <Mail className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1 text-lg">Email Us</h4>
                      <p className="text-slate-500 font-medium">support@pocketlens.app</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-5">
                    <div className="h-14 w-14 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                      <MessageSquare className="h-7 w-7" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 mb-1 text-lg">Feedback</h4>
                      <p className="text-slate-500 font-medium">We love hearing from our community.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 sm:p-12 rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/60 relative overflow-hidden">
                {isSubmitted ? (
                  <div className="text-center py-16 animate-in fade-in zoom-in duration-500">
                    <div className="mx-auto h-24 w-24 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-8 shadow-inner">
                      <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Message Sent!</h2>
                    <p className="text-slate-600 mb-10 text-lg">
                      Thank you for reaching out. We've received your inquiry and will get back to you shortly.
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSubmitted(false)} 
                      className="rounded-full px-10 h-14 text-base font-bold border-slate-200 hover:bg-slate-50 transition-all"
                    >
                      Send another message
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-7" noValidate>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <Label htmlFor="name" className="text-slate-900 font-bold ml-1">Name</Label>
                        <Input 
                          id="name" 
                          placeholder="John Doe" 
                          {...register("name", { required: "Name is required" })}
                          className={`rounded-2xl h-13 bg-slate-50 border-2 transition-all ${errors.name ? 'border-rose-100 bg-rose-50/30' : 'border-transparent focus:bg-white focus:border-blue-500'}`} 
                        />
                        {errors.name && (
                          <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1 ml-1 animate-in slide-in-from-top-1">
                            <AlertCircle className="h-3 w-3" /> {errors.name.message}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2.5">
                        <Label htmlFor="email" className="text-slate-900 font-bold ml-1">Email</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="john@example.com" 
                          {...register("email", { 
                            required: "Email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Invalid email address"
                            }
                          })}
                          className={`rounded-2xl h-13 bg-slate-50 border-2 transition-all ${errors.email ? 'border-rose-100 bg-rose-50/30' : 'border-transparent focus:bg-white focus:border-blue-500'}`} 
                        />
                        {errors.email && (
                          <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1 ml-1 animate-in slide-in-from-top-1">
                            <AlertCircle className="h-3 w-3" /> {errors.email.message}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="subject" className="text-slate-900 font-bold ml-1">Subject</Label>
                      <Input 
                        id="subject" 
                        placeholder="How can we help?" 
                        {...register("subject", { required: "Subject is required" })}
                        className={`rounded-2xl h-13 bg-slate-50 border-2 transition-all ${errors.subject ? 'border-rose-100 bg-rose-50/30' : 'border-transparent focus:bg-white focus:border-blue-500'}`} 
                      />
                      {errors.subject && (
                        <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1 ml-1 animate-in slide-in-from-top-1">
                          <AlertCircle className="h-3 w-3" /> {errors.subject.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      <Label htmlFor="message" className="text-slate-900 font-bold ml-1">Message</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Tell us more about your query..." 
                        {...register("message", { 
                          required: "Message is required",
                          minLength: { value: 10, message: "Message must be at least 10 characters" }
                        })}
                        className={`rounded-2xl min-h-[160px] bg-slate-50 border-2 transition-all p-4 ${errors.message ? 'border-rose-100 bg-rose-50/30' : 'border-transparent focus:bg-white focus:border-blue-500'}`} 
                      />
                      {errors.message && (
                        <p className="text-xs font-bold text-rose-500 flex items-center gap-1 mt-1 ml-1 animate-in slide-in-from-top-1">
                          <AlertCircle className="h-3 w-3" /> {errors.message.message}
                        </p>
                      )}
                    </div>
                    
                    {submitError && (
                      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3">
                        <AlertCircle className="h-5 w-5 shrink-0" />
                        {submitError}
                      </div>
                    )}

                    <Button type="submit" className="w-full h-15 rounded-[1.25rem] text-lg font-bold shadow-xl shadow-blue-200 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                          Sending Inquiry...
                        </>
                      ) : (
                        <>
                          <Send className="mr-3 h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
