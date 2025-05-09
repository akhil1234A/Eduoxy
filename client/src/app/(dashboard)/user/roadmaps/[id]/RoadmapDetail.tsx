"use client";

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useUpdateTopicProgressMutation } from "@/state/api/roadmapApi"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  FileText,
  Video,
  LinkIcon,
  ExternalLink,
  CheckCircle2,
  Circle,
  BookOpen,
  ChevronRight,
} from "lucide-react"
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
  isInterviewTopic: boolean
  interviewQuestions: string[]
  resources: Resource[]
}

interface Section {
  id: string
  title: string
  topics: Topic[]
}

interface Roadmap {
  id: string
  title: string
  description: string
  sections: Section[]
}

interface RoadmapDetailProps {
  roadmapId: string
  initialData: Roadmap
 
}

export default function RoadmapDetail({ roadmapId, initialData }: RoadmapDetailProps) {
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<string | null>(
    initialData.sections.length > 0 ? initialData.sections[0].id : null,
  )
  const [activeTopic, setActiveTopic] = useState<string | null>(
    initialData.sections.length > 0 && initialData.sections[0].topics.length > 0
      ? initialData.sections[0].topics[0].id
      : null,
  )
  const [roadmap, setRoadmap] = useState<Roadmap>(initialData)
  const [activeTab, setActiveTab] = useState<"learning" | "interview">("learning")
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateTopicProgress] = useUpdateTopicProgressMutation()

  const handleTopicClick = (sectionId: string, topicId: string) => {
    setActiveSection(sectionId)
    setActiveTopic(topicId)
  }

  const handleToggleComplete = async (sectionId: string, topicId: string, isCompleted: boolean) => {
    setIsUpdating(true)
    try {
      const result = await updateTopicProgress({
        roadmapId,
        sectionId,
        topicId,
        isCompleted: !isCompleted,
      })

      if (result.data) {
        // Update the roadmap state with the new data
        setRoadmap(prevRoadmap => ({
          ...prevRoadmap,
          sections: prevRoadmap.sections.map(section => {
            if (section.id === sectionId) {
              return {
                ...section,
                topics: section.topics.map(topic => {
                  if (topic.id === topicId) {
                    return {
                      ...topic,
                      isCompleted: !isCompleted
                    }
                  }
                  return topic
                })
              }
            }
            return section
          })
        }))
      }

      toast.success(!isCompleted ? "Topic completed" : "Topic marked as incomplete")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update topic progress"
      toast.error(errorMessage)
    } finally {
      setIsUpdating(false)
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

  const getInterviewTopics = () => {
    return roadmap.sections
      .map((section) => ({
        ...section,
        topics: section.topics.filter((topic) => topic.isInterviewTopic),
      }))
      .filter((section) => section.topics.length > 0)
  }

  const progress = calculateProgress(roadmap)
  const interviewSections = getInterviewTopics()

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

  const getResourceIcon = (type?: string) => {
    switch (type) {
      case "article":
        return <FileText className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      default:
        return <LinkIcon className="h-4 w-4" />
    }
  }

  const findAdjacentTopic = (direction: "next" | "prev") => {
    if (!activeSection || !activeTopic) return null

    const sections = roadmap.sections
    let currentSectionIndex = -1
    let currentTopicIndex = -1

    // Find current indices
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].id === activeSection) {
        currentSectionIndex = i
        for (let j = 0; j < sections[i].topics.length; j++) {
          if (sections[i].topics[j].id === activeTopic) {
            currentTopicIndex = j
            break
          }
        }
        break
      }
    }

    if (currentSectionIndex === -1 || currentTopicIndex === -1) return null

    if (direction === "next") {
      // Check if there's a next topic in the same section
      if (currentTopicIndex < sections[currentSectionIndex].topics.length - 1) {
        return {
          sectionId: sections[currentSectionIndex].id,
          topicId: sections[currentSectionIndex].topics[currentTopicIndex + 1].id,
        }
      }
      // Check if there's a next section with topics
      else if (currentSectionIndex < sections.length - 1 && sections[currentSectionIndex + 1].topics.length > 0) {
        return {
          sectionId: sections[currentSectionIndex + 1].id,
          topicId: sections[currentSectionIndex + 1].topics[0].id,
        }
      }
    } else {
      // prev
      // Check if there's a previous topic in the same section
      if (currentTopicIndex > 0) {
        return {
          sectionId: sections[currentSectionIndex].id,
          topicId: sections[currentSectionIndex].topics[currentTopicIndex - 1].id,
        }
      }
      // Check if there's a previous section with topics
      else if (currentSectionIndex > 0 && sections[currentSectionIndex - 1].topics.length > 0) {
        const prevSection = sections[currentSectionIndex - 1]
        return {
          sectionId: prevSection.id,
          topicId: prevSection.topics[prevSection.topics.length - 1].id,
        }
      }
    }

    return null
  }

  return (
    <div className="bg-[#25262f] min-h-screen text-white">
      <div className="container py-8 px-4 md:px-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.push("/user/roadmaps")}
              className="h-10 w-10 p-0 rounded-full bg-black/20 hover:bg-black/30 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Roadmaps</h1>
            </div>
          </div>

          <Card className="mb-6 bg-[#2a2b34] border border-[#3a3b44] overflow-hidden shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                    {roadmap.title}
                  </CardTitle>
                  <p className="text-gray-400 mt-2">{roadmap.description}</p>
                </div>
                <div className="flex flex-col items-center bg-black/20 p-4 rounded-lg">
                  <div className="relative w-20 h-20">
                    {/* Circular progress bar */}
                    <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" fill="transparent" stroke="#3a3b44" strokeWidth="8" />
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke="#4f46e5"
                        strokeWidth="8"
                        strokeDasharray={`${2 * Math.PI * 45}`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress.percentage / 100)}`}
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <div className="text-2xl font-bold">{progress.percentage}%</div>
                      <div className="text-xs text-gray-400">
                        {progress.completedTopics}/{progress.totalTopics}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "learning" | "interview")}
            className="mb-6"
          >
            <TabsList className="grid w-full grid-cols-2 p-1 bg-[#2a2b34] rounded-lg">
              <TabsTrigger
                value="learning"
                className="py-3 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md transition-all"
              >
                Learning Path
              </TabsTrigger>
              <TabsTrigger
                value="interview"
                className="py-3 data-[state=active]:bg-indigo-600 data-[state=active]:text-white rounded-md transition-all"
              >
                Interview Prep
              </TabsTrigger>
            </TabsList>

            <TabsContent value="learning" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
                {/* Sidebar with sections and topics */}
                <div className="space-y-4">
                  <Card className="bg-[#2a2b34] border border-[#3a3b44] shadow-lg">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-medium">Roadmap Sections</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <Accordion type="multiple" className="w-full" defaultValue={activeSection ? [activeSection] : []}>
                        {roadmap.sections.map((section) => {
                          // Calculate section progress
                          const totalTopics = section.topics.length
                          const completedTopics = section.topics.filter((t) => t.isCompleted).length
                          const sectionProgress =
                            totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0

                          return (
                            <AccordionItem key={section.id} value={section.id} className="border-b border-[#3a3b44]">
                              <AccordionTrigger className="px-4 py-3 hover:no-underline group">
                                <div className="flex flex-col items-start w-full">
                                  <div className="flex items-center gap-2 w-full justify-between">
                                    <span className="font-medium group-hover:text-indigo-400 transition-colors">
                                      {section.title}
                                    </span>
                                    {sectionProgress === 100 && (
                                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                        Completed
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 w-full">
                                    <span>
                                      {completedTopics}/{totalTopics} topics
                                    </span>
                                    <div className="flex-1 h-1.5 bg-[#1e1f26] rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                        style={{ width: `${sectionProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-2 pb-2 pt-1">
                                <ul className="space-y-1">
                                  {section.topics.map((topic) => (
                                    <li key={topic.id}>
                                      <Button
                                        variant="ghost"
                                        className={`w-full justify-start text-left h-auto py-2.5 px-3 rounded-md transition-all ${
                                          activeSection === section.id && activeTopic === topic.id
                                            ? "bg-indigo-600/20 text-white border-l-2 border-indigo-500"
                                            : "hover:bg-black/20"
                                        }`}
                                        onClick={() => handleTopicClick(section.id, topic.id)}
                                      >
                                        <div className="flex items-center gap-2">
                                          {topic.isCompleted ? (
                                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                          ) : (
                                            <Circle className="h-4 w-4 text-gray-400 shrink-0" />
                                          )}
                                          <span className="line-clamp-1">{topic.title}</span>
                                          {topic.isInterviewTopic && (
                                            <Badge className="ml-auto text-xs bg-blue-500/20 text-blue-400 border-blue-500/30">
                                              Interview
                                            </Badge>
                                          )}
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
                    <Card className="bg-[#2a2b34] border border-[#3a3b44] shadow-lg overflow-hidden">
                      <CardHeader className="border-b border-[#3a3b44]">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Badge className="bg-indigo-500/20 text-indigo-400 border-indigo-500/30 text-xs">
                                {roadmap.sections.find((s) => s.id === activeSection)?.title}
                              </Badge>
                              {activeTopicData.isInterviewTopic && (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                  Interview
                                </Badge>
                              )}
                            </div>
                            <CardTitle className="text-xl mt-2">{activeTopicData.title}</CardTitle>
                            <CardDescription className="mt-1 text-gray-400">
                              {activeTopicData.description}
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-400">Mark as completed</span>
                            <div className="relative">
                              <Checkbox
                                checked={activeTopicData.isCompleted}
                                onCheckedChange={() => {
                                  if (activeSection && activeTopic) {
                                    handleToggleComplete(activeSection, activeTopic, activeTopicData.isCompleted)
                                  }
                                }}
                                disabled={isUpdating}
                                className="w-5 h-5 border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 transition-colors"
                              />
                              {isUpdating && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Tabs defaultValue="content" className="w-full">
                          <TabsList className="flex gap-1 p-1 bg-[#1e1f26] rounded-none border-b border-[#3a3b44]">
                            <TabsTrigger
                              value="content"
                              className="flex-1 py-2 data-[state=active]:bg-[#2a2b34] rounded-md transition-all"
                            >
                              Content
                            </TabsTrigger>
                            <TabsTrigger
                              value="resources"
                              className="flex-1 py-2 data-[state=active]:bg-[#2a2b34] rounded-md transition-all"
                            >
                              Resources ({activeTopicData.resources.length})
                            </TabsTrigger>
                            {activeTopicData.isInterviewTopic && activeTopicData.interviewQuestions.length > 0 && (
                              <TabsTrigger
                                value="interview"
                                className="flex-1 py-2 data-[state=active]:bg-[#2a2b34] rounded-md transition-all"
                              >
                                Interview ({activeTopicData.interviewQuestions.length})
                              </TabsTrigger>
                            )}
                          </TabsList>

                          <TabsContent value="content" className="p-6 space-y-6">
                            <div className="prose prose-invert max-w-none">
                              <p>{activeTopicData.description}</p>
                            </div>

                            {activeTopicData.resources.length > 0 && (
                              <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-medium flex items-center">
                                  <BookOpen className="mr-2 h-5 w-5 text-indigo-400" />
                                  Recommended Resources
                                </h3>
                                <div className="grid gap-2">
                                  {activeTopicData.resources.slice(0, 3).map((resource) => (
                                    <a
                                      key={resource.id}
                                      href={resource.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="group flex items-center gap-3 p-3 rounded-md bg-[#1e1f26] hover:bg-[#32333c] transition-colors"
                                    >
                                      <div className="flex items-center justify-center p-2.5 bg-black/30 rounded-md group-hover:bg-indigo-600/20 transition-colors">
                                        {getResourceIcon(resource.type)}
                                      </div>
                                      <span className="flex-1 line-clamp-1 group-hover:text-indigo-400 transition-colors">
                                        {resource.title}
                                      </span>
                                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-indigo-400 transition-colors" />
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-6 border-t border-[#3a3b44] mt-6">
                              {/* Previous Topic Button */}
                              {(() => {
                                const prevTopic = findAdjacentTopic("prev")
                                return (
                                  <Button
                                    variant="outline"
                                    className="border-[#3a3b44] hover:bg-[#32333c] transition-colors"
                                    onClick={() => {
                                      if (prevTopic) {
                                        handleTopicClick(prevTopic.sectionId, prevTopic.topicId)
                                      }
                                    }}
                                    disabled={!prevTopic}
                                  >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Previous Topic
                                  </Button>
                                )
                              })()}

                              {/* Next Topic Button */}
                              {(() => {
                                const nextTopic = findAdjacentTopic("next")
                                return (
                                  <Button
                                    className="bg-indigo-600 hover:bg-indigo-700 transition-colors"
                                    onClick={() => {
                                      if (nextTopic) {
                                        handleTopicClick(nextTopic.sectionId, nextTopic.topicId)
                                      }
                                    }}
                                    disabled={!nextTopic}
                                  >
                                    Next Topic
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                  </Button>
                                )
                              })()}
                            </div>
                          </TabsContent>

                          <TabsContent value="resources" className="p-6">
                            {activeTopicData.resources.length > 0 ? (
                              <div className="grid gap-3">
                                {activeTopicData.resources.map((resource) => (
                                  <a
                                    key={resource.id}
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group flex items-center gap-4 p-4 rounded-md bg-[#1e1f26] hover:bg-[#32333c] transition-all border border-transparent hover:border-indigo-500/30"
                                  >
                                    <div className="flex items-center justify-center p-3 bg-black/30 rounded-md group-hover:bg-indigo-600/20 transition-colors">
                                      {getResourceIcon(resource.type)}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium line-clamp-1 group-hover:text-indigo-400 transition-colors">
                                        {resource.title}
                                      </h4>
                                      <p className="text-sm text-gray-400 line-clamp-1 mt-1">{resource.url}</p>
                                    </div>
                                    <div className="p-2 rounded-full bg-black/20 group-hover:bg-indigo-600/20 transition-colors">
                                      <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-indigo-400" />
                                    </div>
                                  </a>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-12">
                                <p className="text-gray-400">No resources available for this topic</p>
                              </div>
                            )}
                          </TabsContent>

                          {activeTopicData.isInterviewTopic && (
                            <TabsContent value="interview" className="p-6">
                              {activeTopicData.interviewQuestions.length > 0 ? (
                                <div className="space-y-6">
                                  <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                      <FileText className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-medium">Interview Questions</h3>
                                  </div>

                                  <ul className="space-y-4">
                                    {activeTopicData.interviewQuestions.map((question, index) => (
                                      <li key={index} className="p-4 rounded-md bg-[#1e1f26] border border-[#3a3b44]">
                                        <div className="flex items-start gap-3">
                                          <div className="h-6 w-6 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-xs font-medium text-blue-400">{index + 1}</span>
                                          </div>
                                          <p className="text-base">{question}</p>
                                        </div>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ) : (
                                <div className="text-center py-12">
                                  <p className="text-gray-400">No interview questions available for this topic</p>
                                </div>
                              )}
                            </TabsContent>
                          )}
                        </Tabs>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="text-center py-12 bg-[#2a2b34] rounded-lg">
                      <p className="text-gray-400">Select a topic to view its content</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="interview" className="mt-6">
              {interviewSections.length > 0 ? (
                <Accordion type="multiple" className="space-y-4">
                  {interviewSections.map((section) => (
                    <AccordionItem
                      key={section.id}
                      value={section.id}
                      className="border bg-[#2a2b34] rounded-lg overflow-hidden shadow-lg"
                    >
                      <AccordionTrigger className="px-4 py-4 hover:no-underline group">
                        <div className="flex items-center gap-2">
                          <span className="font-medium group-hover:text-indigo-400 transition-colors">
                            {section.title}
                          </span>
                          <Badge variant="outline" className="ml-2 bg-blue-500/10 text-blue-400 border-blue-500/30">
                            {section.topics.length} topics
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="space-y-4">
                          {section.topics.map((topic) => (
                            <Card key={topic.id} className="bg-[#1e1f26] border-[#3a3b44] overflow-hidden">
                              <CardContent className="p-4">
                                <div>
                                  <h3 className="font-medium flex items-center text-indigo-400">
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    {topic.title}
                                  </h3>

                                  {topic.interviewQuestions.length > 0 && (
                                    <div className="mt-3">
                                      <h4 className="text-xs font-medium mb-2 text-gray-400">Interview Questions:</h4>
                                      <ul className="space-y-2 pl-6 list-disc">
                                        {topic.interviewQuestions.map((question, index) => (
                                          <li key={index} className="text-sm text-gray-300">
                                            {question}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {topic.resources.length > 0 && (
                                    <div className="mt-3">
                                      <h4 className="text-xs font-medium mb-2 text-gray-400">Resources:</h4>
                                      <div className="space-y-2">
                                        {topic.resources.map((resource) => (
                                          <a
                                            key={resource.id}
                                            href={resource.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
                                          >
                                            <div className="flex items-center justify-center p-1 bg-black/30 rounded-md">
                                              {getResourceIcon(resource.type)}
                                            </div>
                                            {resource.title}
                                            <ExternalLink className="h-3 w-3" />
                                          </a>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <div className="text-center py-12 bg-[#2a2b34] rounded-lg shadow-lg">
                  <p className="text-gray-400">No interview topics available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
