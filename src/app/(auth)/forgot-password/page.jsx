"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Mail, Loader2, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/ui/Logo"

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      const resData = await res.json()

      if (!res.ok) {
        throw new Error(resData.error || "Failed to process request")
      }

      // Store in sessionStorage to avoid showing in URL
      sessionStorage.setItem("reset_email", data.email)
      sessionStorage.setItem("reset_userId", resData.userId)

      router.push(`/verify?isReset=true`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <div className="flex justify-center mb-8">
              <Logo size="lg" asLink={true} />
            </div>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-sm border border-blue-100 mb-6">
              <Mail className="h-8 w-8" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Forgot password?</h2>
            <p className="text-sm text-slate-600">
              No worries, we'll send you reset instructions.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50/80 border border-red-100 p-4 text-sm text-red-600 font-medium text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@company.com" 
                className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary transition-all"
                {...register("email", { required: "Email is required" })}
              />
              {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
            </div>

            <Button type="submit" className="h-11 w-full text-base font-medium shadow-sm" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>Send reset code <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm">
            <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              &larr; Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
