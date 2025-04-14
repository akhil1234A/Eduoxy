"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { v4 as uuidv4 } from "uuid"
import { useUpdateRoadmapMutation } from "@/state/api/roadmapApi"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Trash2, Save, ArrowLeft, LinkIcon, FileText, Video} from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface RoadmapFormData {
  title: string
  description: string
  sections: Section[]
}

interface EditRoadmapFormProps {
  roadmapId: string
  initialData: Roadmap
}

export default function EditRoadmapForm({ roadmapId, initialData }: EditRoadmapFormProps) {
  const [updateRoadmap, { isLoading: isUpdating }] = useUpdateRoadmapMutation()
  const router = useRouter()

  const [formData, setFormData] = useState<RoadmapFormData>({
    title: "",
    description: "",
    sections: [],
  })

  useEffect(() => {
    if (initialData) {
      // Transform API data to form data structure
      setFormData({
        title: initialData.title || "",
        description: initialData.description || "",
        sections: initialData.sections || [],
      })
    }
  }, [initialData])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSectionChange = (sectionId: string, field: string, value: string) => {
    setFormData({
      ...formData,
      sections: formData.sections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section,
      ),
    })
  }

  const handleTopicChange = (sectionId: string, topicId: string, field: string, value: string) => {
    setFormData({
      ...formData,
      sections: formData.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              topics: section.topics.map((topic) => (topic.id === topicId ? { ...topic, [field]: value } : topic)),
            }
          : section,
      ),
    })
  }

  const handleResourceChange = (
    sectionId: string,
    topicId: string,
    resourceId: string,
    field: string,
    value: string,
  ) => {
    setFormData({
      ...formData,
      sections: formData.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              topics: section.topics.map((topic) =>
                topic.id === topicId
                  ? {
                      ...topic,
                      resources: topic.resources.map((resource) =>
                        resource.id === resourceId ? { ...resource, [field]: value } : resource,
                      ),
                    }
                  : topic,
              ),
            }
          : section,
      ),
    })
  }

  const addSection = () => {
    setFormData({
      ...formData,
      sections: [
        ...formData.sections,
        {
          id: uuidv4(),
          title: `Section ${formData.sections.length + 1}`,
          topics: [
            {
              id: uuidv4(),
              title: "",
              description: "",
              isCompleted: false,
              resources: [],
            },
          ],
        },
      ],
    })
  }

  const removeSection = (sectionId: string) => {
    if (formData.sections.length === 1) {
      toast.error("A roadmap must have at least one section")
      return
    }

    setFormData({
      ...formData,
      sections: formData.sections.filter((section) => section.id !== sectionId),
    })
  }

  const addTopic = (sectionId: string) => {
    setFormData({
      ...formData,
      sections: formData.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              topics: [
                ...section.topics,
                {
                  id: uuidv4(),
                  title: "",
                  description: "",
                  isCompleted: false,
                  resources: [],
                },
              ],
            }
          : section,
      ),
    })
  }

  const removeTopic = (sectionId: string, topicId: string) => {
    const section = formData.sections.find((s) => s.id === sectionId)

    if (section && section.topics.length === 1) {
      toast.error("A section must have at least one topic")
      return
    }

    setFormData({
      ...formData,
      sections: formData.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              topics: section.topics.filter((topic) => topic.id !== topicId),
            }
          : section,
      ),
    })
  }

  const addResource = (sectionId: string, topicId: string) => {
    setFormData({
      ...formData,
      sections: formData.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              topics: section.topics.map((topic) =>
                topic.id === topicId
                  ? {
                      ...topic,
                      resources: [
                        ...topic.resources,
                        {
                          id: uuidv4(),
                          title: "",
                          url: "",
                          type: "link",
                        },
                      ],
                    }
                  : topic,
              ),
            }
          : section,
      ),
    })
  }

  const removeResource = (sectionId: string, topicId: string, resourceId: string) => {
    setFormData({
      ...formData,
      sections: formData.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              topics: section.topics.map((topic) =>
                topic.id === topicId
                  ? {
                      ...topic,
                      resources: topic.resources.filter((resource) => resource.id !== resourceId),
                    }
                  : topic,
              ),
            }
          : section,
      ),
    })
  }

  const handleResourceTypeChange = (
    sectionId: string,
    topicId: string,
    resourceId: string,
    type: "article" | "video" | "link",
  ) => {
    setFormData({
      ...formData,
      sections: formData.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              topics: section.topics.map((topic) =>
                topic.id === topicId
                  ? {
                      ...topic,
                      resources: topic.resources.map((resource) =>
                        resource.id === resourceId ? { ...resource, type } : resource,
                      ),
                    }
                  : topic,
              ),
            }
          : section,
      ),
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!formData.title.trim()) {
      toast.error("Roadmap title is required")
      return
    }

    // Validate sections and topics
    for (const section of formData.sections) {
      if (!section.title.trim()) {
        toast.error("All section titles are required")
        return
      }

      for (const topic of section.topics) {
        if (!topic.title.trim()) {
          toast.error("All topic titles are required")
          return
        }

        // Validate resources
        for (const resource of topic.resources) {
          if (!resource.title.trim() || !resource.url.trim()) {
            toast.error("All resource titles and URLs are required")
            return
          }
        }
      }
    }

    try {
      await updateRoadmap({ id: roadmapId, roadmap: formData }).unwrap()
      toast.success("Roadmap updated successfully");
      router.push("/admin/roadmaps")
    } catch (error) {
      toast.error("Failed to update roadmap", {
        description: (error as Error).message,
      });
    }
  }

  return (
    <div className="container py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.push("/admin/roadmaps")} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <h1 className="text-2xl font-bold">Edit Roadmap</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Roadmap Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter roadmap title"
                className="bg-customgreys-darkGrey border-customgreys-darkerGrey"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter roadmap description"
                className="bg-customgreys-darkGrey border-customgreys-darkerGrey"
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Sections</h2>
            <Button type="button" onClick={addSection} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" /> Add Section
            </Button>
          </div>

          <Accordion type="multiple" className="space-y-4">
            {formData.sections.map((section, sectionIndex) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border bg-customgreys-secondarybg rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between px-4">
                  <AccordionTrigger className="py-4 hover:no-underline">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        Section {sectionIndex + 1}: {section.title}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeSection(section.id)
                    }}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Remove Section</span>
                  </Button>
                </div>

                <AccordionContent className="px-4 pb-4 pt-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`section-${section.id}-title`}>Section Title</Label>
                      <Input
                        id={`section-${section.id}-title`}
                        value={section.title}
                        onChange={(e) => handleSectionChange(section.id, "title", e.target.value)}
                        placeholder="Enter section title"
                        className="bg-customgreys-darkGrey border-customgreys-darkerGrey"
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium">Topics</h3>
                        <Button type="button" onClick={() => addTopic(section.id)} variant="outline" size="sm">
                          <Plus className="mr-2 h-3 w-3" /> Add Topic
                        </Button>
                      </div>

                      {section.topics.map((topic, topicIndex) => (
                        <Card key={topic.id} className="bg-customgreys-primarybg border-customgreys-darkerGrey">
                          <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between">
                            <CardTitle className="text-sm font-medium">Topic {topicIndex + 1}</CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTopic(section.id, topic.id)}
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive/90"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span className="sr-only">Remove Topic</span>
                            </Button>
                          </CardHeader>
                          <CardContent className="p-4 pt-0 space-y-3">
                            <div className="space-y-2">
                              <Label htmlFor={`topic-${topic.id}-title`} className="text-xs">
                                Title
                              </Label>
                              <Input
                                id={`topic-${topic.id}-title`}
                                value={topic.title}
                                onChange={(e) => handleTopicChange(section.id, topic.id, "title", e.target.value)}
                                placeholder="Enter topic title"
                                className="bg-customgreys-darkGrey border-customgreys-darkerGrey"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor={`topic-${topic.id}-description`} className="text-xs">
                                Description
                              </Label>
                              <Textarea
                                id={`topic-${topic.id}-description`}
                                value={topic.description}
                                onChange={(e) => handleTopicChange(section.id, topic.id, "description", e.target.value)}
                                placeholder="Enter topic description"
                                className="bg-customgreys-darkGrey border-customgreys-darkerGrey"
                              />
                            </div>

                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs">Resources</Label>
                                <Button
                                  type="button"
                                  onClick={() => addResource(section.id, topic.id)}
                                  variant="outline"
                                  size="sm"
                                  className="h-7"
                                >
                                  <Plus className="mr-1 h-3 w-3" /> Add Resource
                                </Button>
                              </div>

                              {topic.resources.length > 0 ? (
                                <div className="space-y-3">
                                  {topic.resources.map((resource) => (
                                    <div
                                      key={resource.id}
                                      className="grid grid-cols-[auto_1fr] gap-2 p-2 rounded-md bg-customgreys-darkGrey"
                                    >
                                      <div className="flex items-center justify-center p-1 bg-customgreys-darkerGrey rounded-md">
                                        {resource.type === "article" && <FileText className="h-4 w-4" />}
                                        {resource.type === "video" && <Video className="h-4 w-4" />}
                                        {resource.type === "link" && <LinkIcon className="h-4 w-4" />}
                                      </div>
                                      <div className="space-y-2">
                                        <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                                          <Input
                                            value={resource.title}
                                            onChange={(e) =>
                                              handleResourceChange(
                                                section.id,
                                                topic.id,
                                                resource.id,
                                                "title",
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Resource title"
                                            className="h-7 bg-customgreys-primarybg border-customgreys-darkerGrey"
                                          />
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeResource(section.id, topic.id, resource.id)}
                                            className="h-7 w-7 p-0 text-destructive hover:text-destructive/90"
                                          >
                                            <Trash2 className="h-3 w-3" />
                                            <span className="sr-only">Remove Resource</span>
                                          </Button>
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto] gap-2">
                                          <Input
                                            value={resource.url}
                                            onChange={(e) =>
                                              handleResourceChange(
                                                section.id,
                                                topic.id,
                                                resource.id,
                                                "url",
                                                e.target.value,
                                              )
                                            }
                                            placeholder="Resource URL"
                                            className="h-7 bg-customgreys-primarybg border-customgreys-darkerGrey"
                                          />
                                          <Select
                                            value={resource.type}
                                            onValueChange={(value) =>
                                              handleResourceTypeChange(
                                                section.id,
                                                topic.id,
                                                resource.id,
                                                value as "article" | "video" | "link",
                                              )
                                            }
                                          >
                                            <SelectTrigger className="w-24 h-7 bg-customgreys-primarybg border-customgreys-darkerGrey">
                                              <SelectValue placeholder="Type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="link">Link</SelectItem>
                                              <SelectItem value="article">Article</SelectItem>
                                              <SelectItem value="video">Video</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-2 text-sm text-customgreys-dirtyGrey">
                                  No resources added
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.push("/admin/roadmaps")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Roadmap"}
            {!isUpdating && <Save className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  )
} 