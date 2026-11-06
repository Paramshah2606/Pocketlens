"use client"

import { useEffect, useState } from "react"

// Stale-while-revalidate JSON fetch. Responses are kept in memory (per tab, never on
// disk) keyed by URL, so returning to a page shows the last data instantly while a fresh
// copy loads in the background. Pass a changing `refreshKey` (e.g. the Redux
// refreshTrigger) to refetch after the user adds, edits or deletes something.
const cache = new Map() // url -> json

export function useCachedFetch(url, refreshKey) {
  const key = `${url}|${refreshKey}`
  const [result, setResult] = useState({ key: null, url: null, data: null, error: "" })

  useEffect(() => {
    if (!url) return
    let cancelled = false
    fetch(url)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json.error || "Something went wrong")
        cache.set(url, json)
        if (!cancelled) setResult({ key, url, data: json, error: "" })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key, url, data: cache.get(url) ?? null, error: err.message || "Network error" })
      })
    return () => { cancelled = true }
  }, [key, url])

  const sameUrl = result.url === url
  return {
    // Latest result for this URL, else whatever was cached for it earlier
    data: (sameUrl ? result.data : null) ?? cache.get(url) ?? null,
    error: result.key === key ? result.error : "",
    loading: result.key !== key,
  }
}

// Drop everything cached, e.g. on logout so the next account never sees old numbers
export function clearFetchCache() {
  cache.clear()
}
