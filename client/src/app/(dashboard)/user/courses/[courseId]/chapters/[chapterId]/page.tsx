"use client";

import { useRef } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import ReactPlayer from "react-player"
import Loading from "@/components/Loading"
import { useCourseProgressData } from "@/hooks/useCourseProgressData"
import { useGenerateCertificateMutation } from "@/state/redux"
import { Award, Download, FileText } from "lucide-react"

const Course = () => {
  const {
    userId,
    course,
    userProgress,
    currentSection,
    currentChapter,
    isLoading,
    isChapterCompleted,
    isCourseCompleted,
    certificate,
    updateChapterProgress,
    hasMarkedComplete,
    setHasMarkedComplete,
    handleVideoProgress,
  } = useCourseProgressData()

  const [generateCertificate, { isLoading: isGeneratingCertificate }] = useGenerateCertificateMutation()
  const playerRef = useRef<ReactPlayer>(null)

  const handleProgress = ({ played, playedSeconds }: { played: number; playedSeconds: number }) => {
    if (
      played >= 0.8 &&
      !hasMarkedComplete &&
      currentChapter &&
      currentSection &&
      userProgress?.sections &&
      !isChapterCompleted()
    ) {
      setHasMarkedComplete(true)
      updateChapterProgress(currentSection.sectionId, currentChapter.chapterId, true)
    }
    handleVideoProgress({ playedSeconds })
  }

  const handleGenerateCertificate = async () => {
    if (!userId || !course) return
    try {
      await generateCertificate({
        userId,
        courseId: course.courseId,
        courseName: course.title,
      }).unwrap()
      console.log("Certificate generated successfully")
    } catch (err) {
      console.error("Failed to generate certificate:", err)
    }
  }

  if (isLoading) return <Loading />
  if (!userId) return <div>Please sign in to view this course.</div>
  if (!course || !userProgress) return <div>Error loading course</div>

  const subtitleProxyUrl = currentChapter?.subtitle
    ? `/api/proxy-subtitles?url=${encodeURIComponent(currentChapter.subtitle as string)}`
    : null

  return (
    <div className="course">
      <div className="course__container">
        <div className="course__breadcrumb">
          <div className="course__path">
            {course.title} / {currentSection?.sectionTitle} /{" "}
            <span className="course__current-chapter">{currentChapter?.title}</span>
          </div>
          <h2 className="course__title">{currentChapter?.title}</h2>
          <div className="course__header">
            <div className="course__instructor">
              <Avatar className="course__avatar">
                <AvatarImage alt={course.teacherName} />
                <AvatarFallback className="course__avatar-fallback">{course.teacherName[0]}</AvatarFallback>
              </Avatar>
              <span className="course__instructor-name">{course.teacherName}</span>
            </div>

            {/* Certificate UI - Only show in main course view */}
            {isCourseCompleted && (
              <div className="flex items-center ml-auto">
                {certificate ? (
                  <Button
                    asChild
                    className="bg-secondary-700 hover:bg-secondary-600 text-white flex items-center gap-2"
                    size="sm"
                  >
                    <a href={certificate.certificateUrl} target="_blank" rel="noopener noreferrer">
                      <Award className="h-4 w-4" />
                      View Certificate
                    </a>
                  </Button>
                ) : (
                  <Button
                    onClick={handleGenerateCertificate}
                    disabled={isGeneratingCertificate}
                    className="bg-primary-700 hover:bg-primary-600 text-white flex items-center gap-2"
                    size="sm"
                  >
                    <Download className="h-4 w-4" />
                    Generate Certificate
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <Card className="course__video">
          <CardContent className="course__video-container">
            {currentChapter?.video ? (
              <ReactPlayer
                ref={playerRef}
                url={currentChapter.video as string}
                controls
                width="100%"
                height="100%"
                onProgress={handleProgress}
                onError={(e) => console.log("ReactPlayer Error:", e)}
                config={{
                  file: {
                    attributes: {
                      controlsList: "nodownload",
                    },
                    tracks: subtitleProxyUrl
                      ? [
                          {
                            kind: "subtitles",
                            src: subtitleProxyUrl,
                            srcLang: "en",
                            default: true,
                            label: "English",
                          },
                        ]
                      : [],
                  },
                }}
              />
            ) : (
              <div className="course__no-video">No video available for this chapter.</div>
            )}
          </CardContent>
        </Card>

        <div className="course__content">
          <Tabs defaultValue="Notes" className="course__tabs">
            <TabsList className="course__tabs-list">
              <TabsTrigger className="course__tab" value="Notes">
                Notes
              </TabsTrigger>
              <TabsTrigger className="course__tab" value="Resources">
                Resources
              </TabsTrigger>
              <TabsTrigger className="course__tab" value="Quiz">
                Quiz
              </TabsTrigger>
            </TabsList>

            <TabsContent className="course__tab-content" value="Notes">
              <Card className="course__tab-card">
                <CardHeader className="course__tab-header">
                  <CardTitle>Notes Content</CardTitle>
                </CardHeader>
                <CardContent className="course__tab-body">
                  {currentChapter?.content || "No notes available."}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className="course__tab-content" value="Resources">
              <Card className="course__tab-card">
                <CardHeader className="course__tab-header">
                  <CardTitle>Resources Content</CardTitle>
                </CardHeader>
                <CardContent className="course__tab-body">
                  {currentChapter?.pdf ? (
                    <div>
                      <p>PDF Resource:</p>
                      <Button asChild variant="link">
                        <a href={currentChapter.pdf as string} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 mr-2" />
                          Download PDF ({(currentChapter.pdf as string).split("/").pop()})
                        </a>
                      </Button>
                    </div>
                  ) : (
                    <p>No PDF available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent className="course__tab-content" value="Quiz">
              <Card className="course__tab-card">
                <CardHeader className="course__tab-header">
                  <CardTitle>Quiz</CardTitle>
                </CardHeader>
                <CardContent className="course__tab-body">
                  <p>No quiz available yet.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card className="course__instructor-card">
            <CardContent className="course__instructor-info">
              <div className="course__instructor-header">
                <Avatar className="course__instructor-avatar">
                  <AvatarImage alt={course.teacherName} />
                  <AvatarFallback className="course__instructor-avatar-fallback">
                    {course.teacherName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="course__instructor-details">
                  <h4 className="course__instructor-name">{course.teacherName}</h4>
                  <p className="course__instructor-title">Senior UX Designer</p>
                </div>
              </div>
              <div className="course__instructor-bio">
                <p>
                  A seasoned Senior UX Designer with over 15 years of experience in creating intuitive and engaging
                  digital experiences. Expertise in leading UX design projects.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default Course
