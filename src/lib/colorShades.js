// Distinct shades of one base colour, used so sub-categories stay recognisably part of
// their category while still being told apart in a pie.

function toRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "")
  if (!m) return [59, 130, 246] // fallback: blue-500
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const toHex = (rgb) => `#${rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`

// index-th of `count` shades: the base colour first, then alternately darker and lighter
// steps, never closer than ~15% to black or white so every slice keeps its hue.
export function shade(hex, index, count) {
  if (index === 0 || count <= 1) return toHex(toRgb(hex))
  const rgb = toRgb(hex)
  const steps = Math.ceil((count - 1) / 2)
  const step = Math.ceil(index / 2) / Math.max(steps, 1) // 0..1
  const darker = index % 2 === 1
  const amount = 0.55 * step
  const target = darker ? 0 : 255
  return toHex(rgb.map((v) => v + (target - v) * amount))
}
