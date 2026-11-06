"use client"

import { useSyncExternalStore } from "react"

// Tracks whether PocketLens can be installed on the current device.
//
// Chrome / Edge / Samsung Internet fire `beforeinstallprompt`, which we hold on to so a
// button can show the native install dialog later. That event can fire before React
// hydrates, so an inline script in the root layout stashes it on
// `window.__pwaInstallPrompt` and we pick it up from there.
// iOS has no install API, so there we show manual "Add to Home Screen" instructions.
//
// Modes: "hidden" (server render / not determined), "installed", "prompt", "ios", "unsupported".

let deferredPrompt = null
let justInstalled = false
let initialized = false
const listeners = new Set()

function emit() {
  listeners.forEach((listener) => listener())
}

function init() {
  if (initialized || typeof window === "undefined") return
  initialized = true

  if (window.__pwaInstallPrompt) deferredPrompt = window.__pwaInstallPrompt

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault()
    deferredPrompt = event
    emit()
  })
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null
    window.__pwaInstallPrompt = null
    justInstalled = true
    emit()
  })
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  )
}

function isIOS() {
  const ua = window.navigator.userAgent
  // iPadOS 13+ reports itself as a Mac, so also check for touch support
  return /iphone|ipad|ipod/i.test(ua) || (/Macintosh/.test(ua) && window.navigator.maxTouchPoints > 1)
}

function getSnapshot() {
  if (justInstalled || isStandalone()) return "installed"
  if (deferredPrompt) return "prompt"
  if (isIOS()) return "ios"
  return "unsupported"
}

function subscribe(listener) {
  init()
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePwaInstall() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, () => "hidden")

  // Shows the browser's native install dialog. Returns true if the user accepted.
  async function promptInstall() {
    if (!deferredPrompt) return false
    const promptEvent = deferredPrompt
    promptEvent.prompt()
    const { outcome } = await promptEvent.userChoice
    // A prompt event can only be used once
    deferredPrompt = null
    window.__pwaInstallPrompt = null
    emit()
    return outcome === "accepted"
  }

  return { mode, promptInstall }
}
