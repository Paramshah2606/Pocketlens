import { redirect } from "next/navigation"

// /charts opens the first chart
export default function ChartsIndex() {
  redirect("/charts/balance")
}
