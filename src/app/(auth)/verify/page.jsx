"use client"

import { useState, Suspense, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { KeyRound, Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function VerifyForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState("")
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const isReset = searchParams.get("isReset") === "true"
  
  const [email, setEmail] = useState(searchParams.get("email") || "")
  const [userId, setUserId] = useState(searchParams.get("userId") || "")

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedEmail = sessionStorage.getItem("reset_email")
      const storedUserId = sessionStorage.getItem("reset_userId")
      if (isReset && storedEmail) setEmail(storedEmail)
      if (isReset && storedUserId) setUserId(storedUserId)
    }
  }, [isReset])
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    if (!email) {
      setError("Email not found. Please sign up again.")
      return
    }

    setIsLoading(true)
    setError("")
    
    try {
      const endpoint = isReset ? "/api/auth/verify-reset-otp" : "/api/auth/verify"
      const payload = isReset ? { userId, otp: data.otp } : { email, otp: data.otp }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      
      const resData = await res.json()

      if (!res.ok) {
        throw new Error(resData.error || "Failed to verify")
      }

      if (isReset) {
        // Store token in sessionStorage and clear temporary reset info
        sessionStorage.setItem("reset_token", resData.resetToken)
        router.push(`/reset-password`)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email && !userId) {
      setError("Information missing to resend OTP.")
      return
    }

    setIsResending(true)
    setError("")
    setResendSuccess("")
    
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, email }),
      })
      
      const resData = await res.json()

      if (!res.ok) {
        throw new Error(resData.error || "Failed to resend OTP")
      }

      setResendSuccess("A new code has been sent to your email.")
    } catch (err) {
      setError(err.message)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      {/* Soft background blob */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[30%] -right-[10%] w-[70%] h-[70%] rounded-full bg-blue-50/50 blur-3xl opacity-60" />
        <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-50/50 blur-3xl opacity-60" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100 mb-6">
            <KeyRound className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">Check your email</h2>
          <p className="text-slate-600">
            We've sent a 6-digit verification code to<br/>
            <span className="font-semibold text-slate-900">{email || 'your email address'}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50/80 border border-red-100 p-4 text-sm text-red-600 font-medium text-center">
              {error}
            </div>
          )}
          {resendSuccess && (
            <div className="rounded-lg bg-green-50/80 border border-green-100 p-4 text-sm text-green-600 font-medium text-center">
              {resendSuccess}
            </div>
          )}

          <div className="space-y-2 text-center">
            <Label htmlFor="otp" className="sr-only">Verification Code</Label>
            <Input 
              id="otp" 
              placeholder="000000" 
              className="h-14 text-center text-3xl font-bold tracking-[0.5em] bg-white border-slate-200 shadow-sm focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
              maxLength={6}
              {...register("otp", { 
                required: "Code is required",
                minLength: { value: 6, message: "Code must be exactly 6 digits" },
                maxLength: { value: 6, message: "Code must be exactly 6 digits" }
              })}
            />
            {errors.otp && <p className="text-xs text-red-500 pt-1">{errors.otp.message}</p>}
          </div>
          
          <Button type="submit" className="h-12 w-full text-base font-medium shadow-sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <>Verify and continue <ArrowRight className="ml-2 h-5 w-5" /></>
            )}
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-600">
          Didn't receive the code?{" "}
          <button 
            type="button" 
            onClick={handleResend}
            disabled={isResending}
            className="font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50"
          >
            {isResending ? "Sending..." : "Click to resend"}
          </button>
        </p>
        <p className="mt-4 text-center text-sm">
          <Link href="/signup" className="text-slate-500 hover:text-slate-700 transition-colors">
            &larr; Back to sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <VerifyForm />
    </Suspense>
  )
}
