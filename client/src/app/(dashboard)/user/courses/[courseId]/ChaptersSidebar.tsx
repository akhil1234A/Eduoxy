"use client";

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp, FileText, CheckCircle, Trophy } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/components/ui/sidebar"
import Loading from "@/components/Loading"
import { useCourseProgressData } from "@/hooks/useCourseProgressData"

interface ChaptersSidebarProps {
  courseId: string
}

interface Section {
  sectionId: string
  sectionTitle: string
  chapters: Chapter[]
}

interface Chapter {
  chapterId: string
  title: string
  type: string
}

interface SectionProgress {
  sectionId: string
  chapters: ChapterProgress[]
}

interface ChapterProgress {
  chapterId: string
  completed: boolean
}

const ChaptersSidebar = ({ courseId: propCourseId }: ChaptersSidebarProps) => {
  const router = useRouter()
  const { setOpen } = useSidebar()
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const {
    userId,
    course,
    userProgress,
    chapterId: paramChapterId,
    courseId,
    isLoading,
    updateChapterProgress,
  } = useCourseProgressData(propCourseId)

  const chapterId = typeof paramChapterId === "string" ? paramChapterId : undefined

  const sidebarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setOpen(false)
  }, [setOpen])

  if (isLoading) return <Loading />
  if (!userId) return <div>Please sign in to view course progress.</div>
  if (!course || !userProgress || !course.sections) return <div>Error loading course content</div>

  const safeUserProgress = userProgress || { sections: [] }

  const toggleSection = (sectionTitle: string) => {
    setExpandedSections((prevSections) =>
      prevSections.includes(sectionTitle)
        ? prevSections.filter((title) => title !== sectionTitle)
        : [...prevSections, sectionTitle],
    )
  }

  const handleChapterClick = (sectionId: string, chapterId: string) => {
    router.push(`/user/courses/${courseId}/chapters/${chapterId}`, {
      scroll: false,
    })
  }

  return (
    <div ref={sidebarRef} className="chapters-sidebar">
      <div className="chapters-sidebar__header">
        <h2 className="chapters-sidebar__title">{course.title}</h2>
        <hr className="chapters-sidebar__divider" />
      </div>

      {course.sections.map((section, index) => (
        <Section
          key={section.sectionId}
          section={section}
          index={index}
          sectionProgress={safeUserProgress.sections.find((s) => s.sectionId === section.sectionId)}
          chapterId={chapterId}
          expandedSections={expandedSections}
          toggleSection={toggleSection}
          handleChapterClick={handleChapterClick}
          updateChapterProgress={updateChapterProgress}
        />
      ))}
    </div>
  )
}

const Section = ({
  section,
  index,
  sectionProgress,
  chapterId,
  expandedSections,
  toggleSection,
  handleChapterClick,
  updateChapterProgress,
}: {
  section: Section
  index: number
  sectionProgress?: SectionProgress
  chapterId?: string
  expandedSections: string[]
  toggleSection: (sectionTitle: string) => void
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
}) => {
  const completedChapters = sectionProgress?.chapters.filter((c: ChapterProgress) => c.completed).length || 0
  const totalChapters = section.chapters.length
  const isExpanded = expandedSections.includes(section.sectionTitle)

  return (
    <div className="chapters-sidebar__section">
      <div onClick={() => toggleSection(section.sectionTitle)} className="chapters-sidebar__section-header">
        <div className="chapters-sidebar__section-title-wrapper">
          <p className="chapters-sidebar__section-number">Section 0{index + 1}</p>
          {isExpanded ? (
            <ChevronUp className="chapters-sidebar__chevron" />
          ) : (
            <ChevronDown className="chapters-sidebar__chevron" />
          )}
        </div>
        <h3 className="chapters-sidebar__section-title">{section.sectionTitle}</h3>
      </div>
      <hr className="chapters-sidebar__divider" />

      {isExpanded && (
        <div className="chapters-sidebar__section-content">
          <ProgressVisuals
            section={section}
            sectionProgress={sectionProgress}
            completedChapters={completedChapters}
            totalChapters={totalChapters}
          />
          <ChaptersList
            section={section}
            sectionProgress={sectionProgress}
            chapterId={chapterId}
            handleChapterClick={handleChapterClick}
            updateChapterProgress={updateChapterProgress}
          />
        </div>
      )}
      <hr className="chapters-sidebar__divider" />
    </div>
  )
}

const ProgressVisuals = ({
  section,
  sectionProgress,
  completedChapters,
  totalChapters,
}: {
  section: Section
  sectionProgress?: SectionProgress
  completedChapters: number
  totalChapters: number
}) => {
  return (
    <>
      <div className="chapters-sidebar__progress">
        <div className="chapters-sidebar__progress-bars">
          {section.chapters.map((chapter: Chapter) => {
            const isCompleted = sectionProgress?.chapters.find(
              (c: ChapterProgress) => c.chapterId === chapter.chapterId,
            )?.completed
            return (
              <div
                key={chapter.chapterId}
                className={cn(
                  "chapters-sidebar__progress-bar",
                  isCompleted && "chapters-sidebar__progress-bar--completed",
                )}
              ></div>
            )
          })}
        </div>
        <div className="chapters-sidebar__trophy">
          <Trophy className="chapters-sidebar__trophy-icon" />
        </div>
      </div>
      <p className="chapters-sidebar__progress-text">
        {completedChapters}/{totalChapters} COMPLETED
      </p>
    </>
  )
}

const ChaptersList = ({
  section,
  sectionProgress,
  chapterId,
  handleChapterClick,
  updateChapterProgress,
}: {
  section: Section
  sectionProgress?: SectionProgress
  chapterId?: string
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
}) => {
  return (
    <ul className="chapters-sidebar__chapters">
      {section.chapters.map((chapter: Chapter, index: number) => (
        <Chapter
          key={chapter.chapterId}
          chapter={chapter}
          index={index}
          sectionId={section.sectionId}
          sectionProgress={sectionProgress}
          chapterId={chapterId}
          handleChapterClick={handleChapterClick}
          updateChapterProgress={updateChapterProgress}
        />
      ))}
    </ul>
  )
}

const Chapter = ({
  chapter,
  index,
  sectionId,
  sectionProgress,
  chapterId,
  handleChapterClick,
  updateChapterProgress,
}: {
  chapter: Chapter
  index: number
  sectionId: string
  sectionProgress?: SectionProgress
  chapterId?: string
  handleChapterClick: (sectionId: string, chapterId: string) => void
  updateChapterProgress: (sectionId: string, chapterId: string, completed: boolean) => void
}) => {
  const chapterProgress = sectionProgress?.chapters.find((c: ChapterProgress) => c.chapterId === chapter.chapterId)
  const isCompleted = chapterProgress?.completed
  const isCurrentChapter = chapterId === chapter.chapterId

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateChapterProgress(sectionId, chapter.chapterId, !isCompleted)
  }

  return (
    <li
      className={cn("chapters-sidebar__chapter", {
        "chapters-sidebar__chapter--current": isCurrentChapter,
      })}
      onClick={() => handleChapterClick(sectionId, chapter.chapterId)}
    >
      {isCompleted ? (
        <div
          className="chapters-sidebar__chapter-check"
          onClick={handleToggleComplete}
          title="Toggle completion status"
        >
          <CheckCircle className="chapters-sidebar__check-icon" />
        </div>
      ) : (
        <div
          className={cn("chapters-sidebar__chapter-number", {
            "chapters-sidebar__chapter-number--current": isCurrentChapter,
          })}
        >
          {index + 1}
        </div>
      )}
      <span
        className={cn("chapters-sidebar__chapter-title", {
          "chapters-sidebar__chapter-title--completed": isCompleted,
          "chapters-sidebar__chapter-title--current": isCurrentChapter,
        })}
      >
        {chapter.title}
      </span>
      {chapter.type === "Text" && <FileText className="chapters-sidebar__text-icon" />}
    </li>
  )
}

export default ChaptersSidebar
