import React from "react"
import EditRoadmapForm from "./EditRoadmapForm"

async function getRoadmapById(id: string): Promise<Roadmap> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/roadmap/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      // Try to extract any error message from response body
      const errorText = await res.text(); // fallback if json parsing fails
      throw new Error(`Failed to fetch roadmap. Status: ${res.status} ${res.statusText}. Response: ${errorText}`);
    }

    const data = await res.json();

    if (!data?.data) {
      throw new Error(`Invalid response format. Full response: ${JSON.stringify(data)}`);
    }

    return data.data;
  } catch (err) {
    const error = err as Error;
    console.error('getRoadmapById error:', error.message);
    throw err; 
  }
}


export default async function EditRoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const roadmapData = await getRoadmapById(id)

  return (
    <EditRoadmapForm roadmapId={id} initialData={roadmapData} />
  )
}

