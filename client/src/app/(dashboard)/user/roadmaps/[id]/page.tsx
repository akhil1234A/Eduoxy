"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useGetRoadmapByIdQuery, useUpdateTopicProgressMutation } from "@/state/api/roadmapApi"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Loader2, FileText, Video, LinkIcon, ExternalLink, CheckCircle2, Circle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface Resource {
  id: string
  title: string
  url: string
  type: "article" | "video" | "link"
}

interface Topic {
  id: string
  title: string
  description: string
  isCompleted: boolean
  resources: Resource[]
}

interface Section {
  id: string
  title: string
  topics: Topic[]
}

interface Roadmap {
  _id: string
  title: string
  description: string
  sections: Section[]
}

export default function RoadmapDetailPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useGetRoadmapByIdQuery(params.id)
  const [updateTopicProgress, { isLoading: isUpdating }] = useUpdateTopicProgressMutation()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [activeTopic, setActiveTopic] = useState<string | null>(null)

  const handleTopicClick = (sectionId: string, topicId: string) => {
    setActiveSection(sectionId)
    setActiveTopic(topicId)
  }

  const handleToggleComplete = async (sectionId: string, topicId: string, isCompleted: boolean) => {
    try {
      await updateTopicProgress({
        roadmapId: params.id,
        sectionId,
        topicId,
        isCompleted: !isCompleted,
      }).unwrap()

      toast.success(!isCompleted ? "Topic completed" : "Topic marked as incomplete")
    } catch (error) {
      toast.error("Failed to update topic progress")
    }
  }

  const calculateProgress = (roadmap: Roadmap) => {
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

    return {
      totalTopics,
      completedTopics,
      percentage: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8"></div>
    )
  }

  if (!data) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Roadmap not found</p>
          <Button variant="outline" onClick={() => router.push("/user/roadmaps")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Roadmaps
          </Button>
        </div>
      </div>
    )
  }

  const roadmap = data.data as unknown as Roadmap
  const progress = calculateProgress(roadmap)

  // Find the active topic data
  let activeTopicData: Topic | null = null
  if (activeSection && activeTopic) {
    const section = roadmap.sections.find((s) => s.id === activeSection)
    if (section) {
      activeTopicData = section.topics.find((t) => t.id === activeTopic) || null
    }
  } else if (roadmap.sections.length > 0) {
    // Default to first topic if none selected
    const firstSection = roadmap.sections[0]
    if (firstSection.topics.length > 0) {
      setActiveSection(firstSection.id)
      setActiveTopic(firstSection.topics[0].id)
      activeTopicData = firstSection.topics[0]
    }
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/user/roadmaps")} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{roadmap.title}</h1>
            <p className="text-muted-foreground">{roadmap.description}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span className="font-medium">{progress.percentage}%</span>
          </div>
          <div className="h-2 bg-customgreys-darkGrey rounded-full overflow-hidden">
            <div className="h-full bg-primary-750 rounded-full" style={{ width: `${progress.percentage}%` }} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {progress.completedTopics} of {progress.totalTopics} topics completed
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar with sections and topics */}
          <div className="space-y-4">
            <Card className="bg-customgreys-secondarybg border-customgreys-darkerGrey">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Roadmap Sections</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Accordion type="multiple" className="w-full">
                  {roadmap.sections.map((section) => {
                    // Calculate section progress
                    const totalTopics = section.topics.length
                    const completedTopics = section.topics.filter((t) => t.isCompleted).length
                    const sectionProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

                    return (
                      <AccordionItem
                        key={section.id}
                        value={section.id}
                        className="border-b border-customgreys-darkerGrey"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <div className="flex flex-col items-start">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{section.title}</span>
                              {sectionProgress === 100 && (
                                <Badge variant="outline" className="bg-green-500/10 text-green-500 text-xs">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>
                                {completedTopics}/{totalTopics} topics
                              </span>
                              <div className="w-16 h-1 bg-customgreys-darkGrey rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary-750 rounded-full"
                                  style={{ width: `${sectionProgress}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-3 pt-0">
                          <ul className="space-y-1">
                            {section.topics.map((topic) => (
                              <li key={topic.id}>
                                <Button
                                  variant="ghost"
                                  className={`w-full justify-start text-left h-auto py-2 ${
                                    activeSection === section.id && activeTopic === topic.id
                                      ? "bg-primary-750/10 text-primary-750"
                                      : ""
                                  }`}
                                  onClick={() => handleTopicClick(section.id, topic.id)}
                                >
                                  <div className="flex items-center gap-2">
                                    {topic.isCompleted ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                    ) : (
                                      <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                                    )}
                                    <span className="line-clamp-1">{topic.title}</span>
                                  </div>
                                </Button>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    )
                  })}
                </Accordion>
              </CardContent>
            </Card>
          </div>

          {/* Main content area */}
          <div className="space-y-6">
            {activeTopicData ? (
              <Card className="bg-customgreys-secondarybg border-customgreys-darkerGrey">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{activeTopicData.title}</CardTitle>
                      <CardDescription>{activeTopicData.description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Mark as completed</span>
                      <Checkbox
                        checked={activeTopicData.isCompleted}
                        onCheckedChange={() => {
                          if (activeSection && activeTopic) {
                            handleToggleComplete(activeSection, activeTopic, activeTopicData.isCompleted)
                          }
                        }}
                        disabled={isUpdating}
                        className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="content">Content</TabsTrigger>
                      <TabsTrigger value="resources">Resources ({activeTopicData.resources.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="content" className="space-y-4">
                      <div className="prose prose-invert max-w-none">
                        <p>{activeTopicData.description}</p>
                      </div>

                      {activeTopicData.resources.length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-medium mb-2">Recommended Resources</h3>
                          <div className="grid gap-2">
                            {activeTopicData.resources.slice(0, 3).map((resource) => (
                              <a
                                key={resource.id}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 p-2 rounded-md bg-customgreys-darkGrey hover:bg-customgreys-darkerGrey transition-colors"
                              >
                                <div className="flex items-center justify-center p-1 bg-customgreys-darkerGrey rounded-md">
                                  {resource.type === "article" && <FileText className="h-4 w-4" />}
                                  {resource.type === "video" && <Video className="h-4 w-4" />}
                                  {resource.type === "link" && <LinkIcon className="h-4 w-4" />}
                                </div>
                                <span className="flex-1 line-clamp-1">{resource.title}</span>
                                <ExternalLink className="h-3 w-3 text-muted-foreground" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Find previous topic
                            const sections = roadmap.sections
                            let prevSectionIndex = -1
                            let prevTopicIndex = -1

                            for (let i = 0; i < sections.length; i++) {
                              const section = sections[i]
                              if (section.id === activeSection) {
                                for (let j = 0; j < section.topics.length; j++) {
                                  if (section.topics[j].id === activeTopic) {
                                    if (j > 0) {
                                      // Previous topic in same section
                                      prevSectionIndex = i
                                      prevTopicIndex = j - 1
                                    } else if (i > 0) {
                                      // Last topic in previous section
                                      prevSectionIndex = i - 1
                                      prevTopicIndex = sections[i - 1].topics.length - 1
                                    }
                                    break
                                  }
                                }
                                break
                              }
                            }

                            if (prevSectionIndex >= 0 && prevTopicIndex >= 0) {
                              const prevSection = sections[prevSectionIndex]
                              const prevTopic = prevSection.topics[prevTopicIndex]
                              handleTopicClick(prevSection.id, prevTopic.id)
                            }
                          }}
                          disabled={
                            // Disable if this is the first topic
                            roadmap.sections[0].id === activeSection && roadmap.sections[0].topics[0].id === activeTopic
                          }
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Previous Topic
                        </Button>

                        <Button
                          onClick={() => {
                            // Find next topic
                            const sections = roadmap.sections
                            let nextSectionIndex = -1
                            let nextTopicIndex = -1

                            for (let i = 0; i < sections.length; i++) {
                              const section = sections[i]
                              if (section.id === activeSection) {
                                for (let j = 0; j < section.topics.length; j++) {
                                  if (section.topics[j].id === activeTopic) {
                                    if (j < section.topics.length - 1) {
                                      // Next topic in same section
                                      nextSectionIndex = i
                                      nextTopicIndex = j + 1
                                    } else if (i < sections.length - 1) {
                                      // First topic in next section
                                      nextSectionIndex = i + 1
                                      nextTopicIndex = 0
                                    }
                                    break
                                  }
                                }
                                break
                              }
                            }

                            if (nextSectionIndex >= 0 && nextTopicIndex >= 0) {
                              const nextSection = sections[nextSectionIndex]
                              const nextTopic = nextSection.topics[nextTopicIndex]
                              handleTopicClick(nextSection.id, nextTopic.id)
                            }
                          }}
                          disabled={
                            // Disable if this is the last topic
                            roadmap.sections[roadmap.sections.length - 1].id === activeSection &&
                            roadmap.sections[roadmap.sections.length - 1].topics[
                              roadmap.sections[roadmap.sections.length - 1].topics.length - 1
                            ].id === activeTopic
                          }
                        >
                          Next Topic
                          <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                        </Button>
                      </div>
                    </TabsContent>

                    <TabsContent value="resources" className="space-y-4">
                      {activeTopicData.resources.length > 0 ? (
                        <div className="grid gap-3">
                          {activeTopicData.resources.map((resource) => (
                            <a
                              key={resource.id}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-3 p-3 rounded-md bg-customgreys-darkGrey hover:bg-customgreys-darkerGrey transition-colors"
                            >
                              <div className="flex items-center justify-center p-2 bg-customgreys-darkerGrey rounded-md">
                                {resource.type === "article" && <FileText className="h-5 w-5" />}
                                {resource.type === "video" && <Video className="h-5 w-5" />}
                                {resource.type === "link" && <LinkIcon className="h-5 w-5" />}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium line-clamp-1">{resource.title}</h4>
                                <p className="text-sm text-muted-foreground line-clamp-1">{resource.url}</p>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No resources available for this topic</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Select a topic to view its content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

