import { notFound } from "next/navigation"
import RoadmapDetail from "./RoadmapDetail"

async function getRoadmapById(id: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roadmap/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch roadmap")
    }

    const data = await response.json()
    return data.data
  } catch (error) {
    console.error("Error fetching roadmap:", error)
    return null
  }
}

export default async function RoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const roadmap = await getRoadmapById(id)

  if (!roadmap) {
    notFound()
  }

  return <RoadmapDetail roadmapId={id} initialData={roadmap} />
}

