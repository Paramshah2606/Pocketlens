import { Wallet } from "lucide-react"
import Link from "next/link"

export function Logo({ className = "", size = "md", asLink = true }) {
  const sizeClasses = {
    sm: "h-6 w-6 rounded-md",
    md: "h-8 w-8 rounded-lg",
    lg: "h-10 w-10 rounded-xl"
  }
  
  const iconSizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  }
  
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  }

  const content = (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`flex ${sizeClasses[size]} items-center justify-center bg-primary text-white shadow-sm shadow-blue-500/20`}>
        <Wallet className={iconSizeClasses[size]} />
      </div>
      <span className={`${textSizeClasses[size]} font-bold tracking-tight text-slate-900`}>PocketLens</span>
    </div>
  )

  if (asLink) {
    return <Link href="/" className="hover:opacity-90 transition-opacity w-fit">{content}</Link>
  }
  
  return content
}
