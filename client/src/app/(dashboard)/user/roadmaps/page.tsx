"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useGetRoadmapsQuery } from "@/state/api/roadmapApi"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Roadmap {
  _id: string
  title: string
  description: string
  sections: {
    id: string
    title: string
    topics: {
      id: string
      title: string
      description: string
      isCompleted: boolean
      resources: any[]
    }[]
  }[]
}

export default function RoadmapsPage() {
  const { data, isLoading } = useGetRoadmapsQuery()
  const roadmaps = data?.data || []
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")

  const filteredRoadmaps = roadmaps.filter(
    (roadmap: Roadmap) =>
      roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      roadmap.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getRoadmapStats = (roadmap: Roadmap) => {
    let totalTopics = 0
    let completedTopics = 0

    roadmap.sections.forEach((section) => {
      section.topics.forEach((topic) => {
        totalTopics++
        if (topic.isCompleted) {
          completedTopics++
        }
      })
    })

    return { totalTopics, completedTopics }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary-700" />
          <p className="text-muted-foreground">Loading roadmaps...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Learning Roadmaps</h1>
        <p className="text-muted-foreground">Select a roadmap to start your learning journey</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search roadmaps..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-customgreys-darkGrey border-customgreys-darkerGrey"
        />
      </div>

      {filteredRoadmaps.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No roadmaps found</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredRoadmaps.map((roadmap: Roadmap) => {
            const { totalTopics, completedTopics } = getRoadmapStats(roadmap)
            const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

            return (
              <Card
                key={roadmap._id}
                className="overflow-hidden transition-all duration-200 hover:shadow-md bg-customgreys-secondarybg border-customgreys-darkerGrey"
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{roadmap.title}</CardTitle>
                    <Badge variant="outline" className="bg-primary-750/10 text-primary-750">
                      {roadmap.sections.length} {roadmap.sections.length === 1 ? "Section" : "Sections"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{roadmap.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span className="font-medium">{progress}%</span>
                    </div>
                    <div className="h-2 bg-customgreys-darkGrey rounded-full overflow-hidden">
                      <div className="h-full bg-primary-750 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {completedTopics} of {totalTopics} topics completed
                      </span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full mt-2" onClick={() => router.push(`/user/roadmaps/${roadmap._id}`)}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    {completedTopics > 0 ? "Continue Learning" : "Start Learning"}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

