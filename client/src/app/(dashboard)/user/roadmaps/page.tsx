"use client";

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useGetRoadmapsQuery } from "@/state/api/roadmapApi"
import { Button } from "@/components/ui/button"
import { Loader2, BookOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import DynamicTable from "@/components/DynamicTable"



const RoadmapsContent = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = parseInt(searchParams.get("page") || "1", 10)
  const limit = parseInt(searchParams.get("limit") || "10", 10)
  const searchTerm = searchParams.get("q") || ""
  
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)

  const { data, isLoading } = useGetRoadmapsQuery({ 
    page, 
    limit, 
    searchTerm: debouncedSearchTerm 
  })
  
  const roadmaps = data?.data?.roadmaps || []
  const total = data?.data?.total || 0
  const totalPages = data?.data?.totalPages || 1

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(localSearchTerm)
      // Only update URL when debounced search term changes
      if (localSearchTerm !== searchTerm) {
        const query = new URLSearchParams({
          page: "1",
          limit: limit.toString(),
          q: localSearchTerm,
        }).toString()
        router.push(`/user/roadmaps?${query}`, { scroll: false })
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timer)
  }, [localSearchTerm, limit, router, searchTerm])

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      const query = new URLSearchParams({
        page: newPage.toString(),
        limit: limit.toString(),
        q: localSearchTerm,
      }).toString()
      router.push(`/user/roadmaps?${query}`, { scroll: false })
    }
  }

  const handleSearchChange = (value: string) => {
    setLocalSearchTerm(value)
  }

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

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (value: unknown) => (
        <div className="font-medium">{String(value)}</div>
      ),
    },
    {
      key: "description",
      label: "Description",
      render: (value: unknown) => (
        <div className="line-clamp-2 text-muted-foreground">{String(value)}</div>
      ),
    },
    {
      key: "sections",
      label: "Sections",
      render: (value: unknown) => (
        <Badge variant="outline" className="bg-primary-750/10 text-primary-750">
          {Array.isArray(value) ? value.length : 0} {Array.isArray(value) && value.length === 1 ? "Section" : "Sections"}
        </Badge>
      ),
    },
    {
      key: "progress",
      label: "Progress",
      render: (_: unknown, item: Roadmap) => {
        const { totalTopics, completedTopics } = getRoadmapStats(item)
        const progress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0
        
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-customgreys-darkGrey rounded-full overflow-hidden">
              <div className="h-full bg-primary-750 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <div className="text-xs text-muted-foreground">
              {completedTopics} of {totalTopics} topics completed
            </div>
          </div>
        )
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (_: unknown, item: Roadmap) => (
        <Button 
          className="w-full" 
          onClick={() => router.push(`/user/roadmaps/${item._id}`)}
        >
          <BookOpen className="mr-2 h-4 w-4" />
          {getRoadmapStats(item).completedTopics > 0 ? "Continue Learning" : "Start Learning"}
        </Button>
      ),
    },
  ]

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

      <DynamicTable<Roadmap>
        items={roadmaps}
        columns={columns}
        searchTerm={localSearchTerm}
        onSearchChange={handleSearchChange}
        isLoading={isLoading}
        rowKeyExtractor={(item) => item._id || ''}
        filterFn={(item, term) =>
          [item.title, item.description].some((field) =>
            String(field).toLowerCase().includes(term.toLowerCase())
          )
        }
        searchPlaceholder="Search roadmaps by title or description..."
        noResultsComponent={<div className="p-3 text-center text-gray-400">No roadmaps found</div>}
        total={total}
        page={page}
        limit={limit}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

const RoadmapsPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RoadmapsContent />
    </Suspense>
  )
}

export default RoadmapsPage

