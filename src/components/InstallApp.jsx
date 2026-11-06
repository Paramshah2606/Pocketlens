"use client"

import { useState } from "react"
import { createPortal } from "react-dom"
import { CircleCheck, Download, Share, Smartphone, SquarePlus, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { usePwaInstall } from "@/lib/pwaInstall"

// Steps shown on iPhone/iPad, where browsers have no install button we can trigger.
function IOSInstructions({ onClose }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-900/50 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
    >
      <div
        className="w-full max-w-sm rounded-3xl bg-white p-6 text-left text-slate-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icons/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
            <div>
              <h2 id="ios-install-title" className="font-bold">Install PocketLens</h2>
              <p className="text-xs text-slate-500">Add it to your Home Screen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <ol className="mt-6 space-y-4 text-sm">
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Share className="h-4 w-4" />
            </span>
            <span>Tap the <strong>Share</strong> button in your browser&apos;s toolbar.</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <SquarePlus className="h-4 w-4" />
            </span>
            <span>Scroll down and choose <strong>Add to Home Screen</strong>.</span>
          </li>
          <li className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <Smartphone className="h-4 w-4" />
            </span>
            <span>Tap <strong>Add</strong>. PocketLens will open like a normal app.</span>
          </li>
        </ol>

        <Button onClick={onClose} className="mt-6 h-11 w-full rounded-full">Got it</Button>
      </div>
    </div>,
    document.body
  )
}

function useInstallAction() {
  const { mode, promptInstall } = usePwaInstall()
  const [showIOSHelp, setShowIOSHelp] = useState(false)

  const install = () => {
    if (mode === "prompt") promptInstall()
    else if (mode === "ios") setShowIOSHelp(true)
  }

  const helpModal = showIOSHelp ? <IOSInstructions onClose={() => setShowIOSHelp(false)} /> : null
  return { mode, install, helpModal }
}

// Button that installs the app. Renders nothing when installing isn't possible
// (already installed, or an unsupported browser).
export function InstallAppButton({ label = "Install app", className, iconClassName, ...props }) {
  const { mode, install, helpModal } = useInstallAction()
  if (mode !== "prompt" && mode !== "ios") return null

  return (
    <>
      <Button onClick={install} className={className} {...props}>
        <Download className={cn("mr-2 h-4 w-4", iconClassName)} />
        {label}
      </Button>
      {helpModal}
    </>
  )
}

// Settings card: always visible, and explains the current install state.
export function InstallAppCard() {
  const { mode, install, helpModal } = useInstallAction()
  if (mode === "hidden") return null

  const content = {
    installed: {
      text: "You're using the installed PocketLens app on this device.",
    },
    prompt: {
      text: "Install PocketLens on this device for faster access, a full-screen view and a home screen icon.",
    },
    ios: {
      text: "Add PocketLens to your Home Screen to open it full-screen, just like a native app.",
    },
    unsupported: {
      text: "To install PocketLens, open this site in Chrome or Edge (Android and desktop) or Safari (iPhone and iPad).",
    },
  }[mode]

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-slate-100 bg-white p-6 text-slate-900 shadow-sm sm:flex-row sm:items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" className="h-14 w-14 shrink-0 rounded-2xl" />
      <div className="flex-1">
        <h3 className="font-bold">PocketLens App</h3>
        <p className="mt-1 text-sm text-slate-500">{content.text}</p>
      </div>
      {mode === "installed" ? (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
          <CircleCheck className="h-4 w-4" /> Installed
        </span>
      ) : mode !== "unsupported" ? (
        <Button onClick={install} className="h-11 rounded-full px-6 shadow-sm">
          <Download className="mr-2 h-4 w-4" /> Install app
        </Button>
      ) : null}
      {helpModal}
    </div>
  )
}
