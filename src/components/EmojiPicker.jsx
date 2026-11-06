"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"

// Curated emoji for expense categories, grouped so the right one is quick to find.
// The categories API only accepts a single emoji, so this picker is the only way to set one.
export const EMOJI_GROUPS = [
  { name: "Food", items: [["🍔", "Burger"], ["🍕", "Pizza"], ["🍜", "Noodles"], ["🍱", "Bento"], ["🥗", "Salad"], ["🍳", "Cooking"], ["🥐", "Bakery"], ["☕", "Coffee"], ["🧋", "Bubble tea"], ["🍺", "Beer"], ["🍷", "Wine"], ["🍰", "Cake"], ["🍦", "Ice cream"], ["🍎", "Fruit"], ["🥦", "Vegetables"], ["🛒", "Groceries"]] },
  { name: "Transport", items: [["🚗", "Car"], ["🚕", "Taxi"], ["🛺", "Auto rickshaw"], ["🚌", "Bus"], ["🚇", "Metro"], ["🚆", "Train"], ["✈️", "Flight"], ["🚲", "Bicycle"], ["🛵", "Scooter"], ["🏍️", "Motorbike"], ["⛽", "Fuel"], ["🅿️", "Parking"], ["🚢", "Ship"], ["🔧", "Repairs"]] },
  { name: "Home & bills", items: [["🏠", "Home"], ["🏢", "Office"], ["💡", "Electricity"], ["💧", "Water"], ["🔥", "Gas"], ["📶", "Internet"], ["📱", "Phone"], ["📺", "TV"], ["🧾", "Bills"], ["🛠️", "Maintenance"], ["🧹", "Cleaning"], ["🛋️", "Furniture"], ["🧺", "Laundry"], ["🔑", "Rent"]] },
  { name: "Shopping", items: [["🛍️", "Shopping"], ["👕", "Clothes"], ["👟", "Shoes"], ["👗", "Dress"], ["💄", "Beauty"], ["💇", "Haircut"], ["🎁", "Gifts"], ["💍", "Jewellery"], ["🕶️", "Accessories"], ["🧸", "Toys"], ["📦", "Online orders"], ["💻", "Electronics"]] },
  { name: "Health", items: [["💊", "Medicine"], ["🏥", "Hospital"], ["🩺", "Doctor"], ["🦷", "Dentist"], ["👓", "Eye care"], ["🧘", "Yoga"], ["🏋️", "Gym"], ["💪", "Fitness"], ["🛡️", "Insurance"], ["🧴", "Personal care"]] },
  { name: "Fun", items: [["🎬", "Movies"], ["🎮", "Games"], ["🎵", "Music"], ["🎟️", "Events"], ["📚", "Books"], ["🎨", "Hobbies"], ["⚽", "Football"], ["🏏", "Cricket"], ["🎉", "Party"], ["🍿", "Snacks"], ["📸", "Photography"], ["🎤", "Concerts"]] },
  { name: "Travel", items: [["🏖️", "Beach"], ["🏨", "Hotel"], ["🗺️", "Trips"], ["🧳", "Luggage"], ["🏕️", "Camping"], ["⛰️", "Mountains"], ["🎒", "Backpacking"], ["🌍", "World"], ["🛂", "Visa"], ["🚠", "Sightseeing"]] },
  { name: "Money & work", items: [["💰", "Money"], ["💵", "Cash"], ["💳", "Card"], ["🏦", "Bank"], ["📈", "Investments"], ["💼", "Work"], ["🧑‍💻", "Freelance"], ["🧮", "Taxes"], ["🪙", "Coins"], ["🏷️", "Tag"], ["📊", "Finance"], ["🤝", "Loans"]] },
  { name: "Family & life", items: [["👶", "Baby"], ["🧒", "Kids"], ["🎓", "Education"], ["✏️", "Stationery"], ["🐶", "Dog"], ["🐱", "Cat"], ["🐾", "Pets"], ["💐", "Flowers"], ["🙏", "Donations"], ["💒", "Wedding"], ["👪", "Family"], ["🎂", "Birthday"]] },
  { name: "Other", items: [["✨", "Sparkles"], ["⭐", "Star"], ["❤️", "Heart"], ["📌", "Pin"], ["🎯", "Goal"], ["⚡", "Energy"], ["🌱", "Plants"], ["☂️", "Umbrella"], ["🔔", "Subscriptions"], ["🧩", "Misc"], ["❓", "Unknown"], ["📝", "Notes"]] },
]

// A button showing the chosen emoji; tapping it opens an inline grid to pick another.
//   value, onChange(emoji), size: "md" | "sm", id (for a <label htmlFor>)
export default function EmojiPicker({ value, onChange, size = "md", id }) {
  const [open, setOpen] = useState(false)
  const [group, setGroup] = useState(0)
  const panelId = id ? `${id}-panel` : undefined

  const pick = (emoji) => {
    onChange(emoji)
    setOpen(false)
  }

  const buttonSize = size === "sm" ? "h-9 w-14 text-lg rounded-lg" : "h-11 w-16 text-2xl rounded-xl"

  return (
    <div className="w-full">
      <button
        id={id}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Icon: ${value || "none"}. Choose an emoji`}
        className={`flex items-center justify-center gap-0.5 border border-slate-200 bg-white hover:bg-slate-50 transition-colors ${buttonSize} ${open ? "ring-2 ring-blue-500/30 border-blue-300" : ""}`}
      >
        <span>{value || "🏷️"}</span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div id={panelId} className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-lg animate-in fade-in slide-in-from-top-1">
          <div className="flex gap-1 overflow-x-auto pb-2 [scrollbar-width:none]" role="tablist" aria-label="Emoji groups">
            {EMOJI_GROUPS.map((g, i) => (
              <button
                key={g.name}
                type="button"
                role="tab"
                aria-selected={i === group}
                onClick={() => setGroup(i)}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${i === group ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {g.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-6 gap-1 sm:grid-cols-8" role="tabpanel" aria-label={EMOJI_GROUPS[group].name}>
            {EMOJI_GROUPS[group].items.map(([emoji, label]) => (
              <button
                key={emoji}
                type="button"
                onClick={() => pick(emoji)}
                aria-label={label}
                title={label}
                aria-pressed={value === emoji}
                className={`flex aspect-square items-center justify-center rounded-xl text-2xl transition-colors ${value === emoji ? "bg-blue-50 ring-2 ring-blue-500/40" : "hover:bg-slate-100"}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
