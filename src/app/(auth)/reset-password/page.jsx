"use client"

import { useState, Suspense, useEffect } from "react"
import { useForm } from "react-hook-form"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, Loader2, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/ui/Logo"

function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [userId, setUserId] = useState("")
  const [token, setToken] = useState("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(sessionStorage.getItem("reset_userId") || "")
      setToken(sessionStorage.getItem("reset_token") || "")
    }
  }, [])
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm()
  const password = watch("newPassword")

  const onSubmit = async (data) => {
    if (!userId || !token) {
      setError("Invalid reset link. Please try again.")
      return
    }

    setIsLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId, 
          resetToken: token, 
          newPassword: data.newPassword 
        }),
      })
      
      const resData = await res.json()

      if (!res.ok) {
        throw new Error(resData.error || "Failed to reset password")
      }

      // Clear session storage
      sessionStorage.removeItem("reset_email")
      sessionStorage.removeItem("reset_userId")
      sessionStorage.removeItem("reset_token")

      setIsSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-screen bg-white items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600 mb-8 border border-green-100">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Password reset!</h2>
          <p className="text-slate-600 mb-10 text-lg leading-relaxed">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
          <Button asChild className="h-12 w-full text-base font-medium">
            <Link href="/login">Sign in to your account</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-white items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100 mb-6">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Set new password</h2>
          <p className="text-slate-600">
            Please enter your new password below.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50/80 border border-red-100 p-4 text-sm text-red-600 font-medium text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="newPassword" className="text-slate-700">New Password</Label>
              <div className="relative">
                <Input 
                  id="newPassword" 
                  type={showPassword ? "text" : "password"} 
                  className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary transition-all pr-10"
                  placeholder="••••••••"
                  {...register("newPassword", { 
                    required: "Password is required",
                    minLength: { value: 6, message: "At least 6 characters" }
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-slate-700">Confirm Password</Label>
              <div className="relative">
                <Input 
                  id="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary transition-all pr-10"
                  placeholder="••••••••"
                  {...register("confirmPassword", { 
                    required: "Please confirm your password",
                    validate: value => value === password || "Passwords do not match"
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
            </div>
          </div>
          
          <Button type="submit" className="h-12 w-full text-base font-medium shadow-sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <>Reset password <ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ResetPasswordForm />
    </Suspense>
  )
}
