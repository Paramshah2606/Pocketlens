"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { User, Palette, LogOut, Loader2, Check } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isSavingPrefs, setIsSavingPrefs] = useState(false)
  
  const [nameInput, setNameInput] = useState("")

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/users/profile")
        if (res.ok) {
          const data = await res.json()
          setUser(data.user)
          setNameInput(data.user.name || "")
        }
      } catch (error) {
        console.error("Failed to load profile", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProfile()
  }, [setTheme])

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setIsSavingProfile(true)
    try {
      const res = await fetch("/api/users/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput })
      })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error("Save profile failed", error)
    } finally {
      setIsSavingProfile(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account preferences and application settings.</p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card className="rounded-3xl border-slate-100 shadow-sm overflow-hidden bg-white text-slate-900">
          <div className="flex flex-col md:flex-row md:items-stretch">
             <div className="bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-6 flex flex-col items-center justify-center text-center md:w-64 shrink-0">
                <div className="h-16 w-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-4 shadow-sm border border-blue-200">
                  <User className="h-8 w-8" />
                </div>
                <h3 className="font-bold text-slate-900">Profile Settings</h3>
                <p className="text-xs text-slate-500 mt-1">Update your personal details</p>
             </div>
             <CardContent className="p-6 md:p-8 flex-1">
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="space-y-2">
                     <Label className="text-slate-900">Full Name</Label>
                     <Input 
                       value={nameInput} 
                       onChange={(e) => setNameInput(e.target.value)} 
                       placeholder="Enter your name"
                       className="bg-white border-slate-200 text-slate-900 focus-visible:ring-primary/20"
                       required
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-slate-900">Email Address</Label>
                     <Input 
                       value={user?.email || ""} 
                       disabled 
                       className="bg-slate-50 text-slate-500 border-slate-200 cursor-not-allowed"
                     />
                     <p className="text-xs text-slate-500">Email address cannot be changed.</p>
                  </div>
                  <Button type="submit" className="rounded-full shadow-sm" disabled={isSavingProfile || nameInput === user?.name}>
                    {isSavingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Save Profile
                  </Button>
                </form>
             </CardContent>
          </div>
        </Card>

        {/* Logout Section */}
        <div className="pt-4 flex justify-center md:justify-start">
          <Button onClick={handleLogout} variant="destructive" className="rounded-full shadow-sm px-8">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
