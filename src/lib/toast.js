"use client"

import { useSyncExternalStore } from "react"

// Tiny global toast store: toast.success("Saved"), toast.error("Failed").
// Rendered by <Toaster /> in the app layout.

let toasts = []
let nextId = 1
const listeners = new Set()
const emit = () => listeners.forEach((l) => l())

function dismiss(id) {
  toasts = toasts.filter((t) => t.id !== id)
  emit()
}

function show(type, message, duration = 3500) {
  const id = nextId++
  toasts = [...toasts.slice(-2), { id, type, message }] // keep at most 3 on screen
  emit()
  if (duration) setTimeout(() => dismiss(id), duration)
  return id
}

export const toast = {
  success: (message) => show("success", message),
  error: (message) => show("error", message, 5000),
  info: (message) => show("info", message),
  dismiss,
}

const EMPTY = []

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => toasts,
    () => EMPTY
  )
}
