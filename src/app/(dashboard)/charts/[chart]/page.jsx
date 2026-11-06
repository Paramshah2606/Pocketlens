import { Suspense } from "react"
import { notFound } from "next/navigation"
import { CHARTS } from "@/components/charts/chartList"
import ChartScreen from "./ChartScreen"

// Every chart page is prerendered, so opening one never waits on the server
export const dynamicParams = false
export function generateStaticParams() {
  return CHARTS.map((c) => ({ chart: c.id }))
}

export async function generateMetadata({ params }) {
  const { chart } = await params
  const def = CHARTS.find((c) => c.id === chart)
  return { title: def ? `${def.title} · Charts` : "Charts" }
}

// One chart, full size: /charts/<id>?range=week|month|year (range is read in the browser)
export default async function ChartPage({ params }) {
  const { chart } = await params
  if (!CHARTS.some((c) => c.id === chart)) notFound()
  return (
    <Suspense fallback={null}>
      <ChartScreen chart={chart} />
    </Suspense>
  )
}
