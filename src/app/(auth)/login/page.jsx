"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Wallet, Loader2, ArrowRight, Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Logo } from "@/components/ui/Logo"

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  
  const { register, handleSubmit, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setIsLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      
      const resData = await res.json()

      if (!res.ok) {
        if (res.status === 403) {
          router.push(`/verify?email=${encodeURIComponent(data.email)}`)
          return
        }
        throw new Error(resData.error || "Failed to login")
      }

      router.push("/dashboard")
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Branding Side (Desktop Only) */}
      <div className="hidden w-1/2 bg-slate-50 lg:block relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/50 via-slate-50 to-slate-50" />
        <div className="absolute inset-0 flex flex-col justify-center p-16 xl:p-24">
          <div className="mb-12">
            <Logo size="lg" />
          </div>
          <div className="space-y-6 max-w-lg">
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 leading-[1.1]">
              Clarity in every transaction.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Join thousands of modern professionals mastering their finances with real-time insights, smart budgets, and beautiful design.
            </p>
          </div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-12 sm:px-6 lg:w-1/2 lg:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center lg:text-left">
            <div className="flex justify-center lg:hidden mb-6">
              <Logo size="lg" asLink={false} />
            </div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Welcome back</h2>
            <p className="mt-2 text-sm text-slate-600">
              Please enter your details to sign in.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50/80 border border-red-100 p-4 text-sm text-red-600 font-medium">
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
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-slate-700">Password</Label>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  className="h-11 bg-slate-50/50 border-slate-200 focus-visible:ring-primary/20 focus-visible:border-primary transition-all pr-10"
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required" })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="h-11 w-full text-base font-medium shadow-sm" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>Sign in to your account <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <Link href="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
