"use client";

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGetPostsQuery, useGetForumQuery } from "@/state/api/forumApi"
import { PaginationControls } from "@/components/PaginationControls"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CreatePostModal } from "@/components/forum/CreatePostModal"
import { toast } from "sonner"
import { useDebounce } from "@/hooks/useDebounce"
import { Loader2, Search, Plus, MessageSquare, ArrowLeft, Calendar, User } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { useUser } from "@/contexts/UserContext";

export default function ForumPostsPage() {
  const { forumId } = useParams()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const { userId, userName} = useUser();

  const { data: forumData } = useGetForumQuery(forumId as string)
  const { data, isLoading, error } = useGetPostsQuery({
    forumId: forumId as string,
    page,
    pageSize: 10,
    query: debouncedSearchQuery,
  })



  // Reset to first page when search query changes
  useEffect(() => {
    setPage(1)
  }, [debouncedSearchQuery])

  const posts = data?.data?.items || []
  const { total, pageSize } = data?.data || { total: 0, pageSize: 10 }
  const forum = forumData?.data

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`
    } else if (diffMins > 0) {
      return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`
    } else {
      return "Just now"
    }
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-[#3a3b44] hover:bg-[#32333c] text-white"
            onClick={() => router.push("/admin/forums")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Forums
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">{forum?.title || "Forum"}</h1>
            <p className="text-[#9ca3af] mt-1">{forum?.description || "Discussion forum"}</p>
          </div>
          <Button
            className="bg-primary-700 hover:bg-primary-600 text-white w-full md:w-auto"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Post
          </Button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#6e6e6e]" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-[#2a2b34] border-[#3a3b44] text-white w-full"
          />
        </div>
      </div>

      {/* Posts List */}
      <div className="bg-[#2a2b34] rounded-lg border border-[#3a3b44] overflow-hidden">
        <div className="bg-[#32333c] p-4 flex items-center justify-between border-b border-[#3a3b44]">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary-500" />
            <h2 className="text-white font-medium">Posts</h2>
            {!isLoading && (
              <Badge variant="outline" className="ml-2 bg-[#3d3e47] text-white border-none">
                {total}
              </Badge>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="animate-spin h-8 w-8 text-primary-700" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-500 p-6">
            <p className="text-lg">Error loading posts</p>
            <p className="text-sm text-[#9ca3af] mt-2">Please try again later</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 p-6">
            <MessageSquare className="h-12 w-12 text-[#3a3b44] mx-auto mb-4" />
            <p className="text-lg text-white mb-2">No posts found</p>
            <p className="text-sm text-[#9ca3af] mb-6">
              {debouncedSearchQuery
                ? `No results for "${debouncedSearchQuery}"`
                : "There are no posts in this forum yet"}
            </p>
            <Button
              className="bg-primary-700 hover:bg-primary-600 text-white"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Post
            </Button>
          </div>
        ) : (
          <div>
            {posts.map((post, index) => (
              <div key={post._id}>
                <div className="p-4 hover:bg-[#32333c] transition-colors">
                  <Link href={`/admin/forums/${forumId}/posts/${post._id}`} className="block">
                    <div className="flex gap-4">
                      <div className="hidden sm:flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#3d3e47]">
                        <span className="font-medium text-white">{post.userName.charAt(0)}</span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                          <h3 className="text-lg font-medium text-white">{post.topic}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs bg-[#3d3e47] text-white border-none">
                              {formatTimeAgo(post.createdAt)}
                            </Badge>
                          </div>
                        </div>

                        <p className="text-[#9ca3af] line-clamp-2 mb-3">{post.content}</p>

                        {post.files && post.files.length > 0 && (
                          <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                            {post.files
                              .filter((file) => file.type.startsWith("image/"))
                              .slice(0, 3)
                              .map((file, fileIndex) => (
                                <div
                                  key={fileIndex}
                                  className="relative h-16 w-16 flex-shrink-0 rounded overflow-hidden border border-[#3a3b44]"
                                >
                                  <Image
                                    src={file.url || "/placeholder.svg"}
                                    alt={file.name || `Attachment ${fileIndex + 1}`}
                                    fill
                                    className="object-cover"
                                    sizes="64px"
                                  />
                                </div>
                              ))}
                            {post.files.length > 3 && (
                              <div className="flex items-center justify-center h-16 w-16 flex-shrink-0 rounded bg-[#3d3e47] border border-[#3a3b44]">
                                <span className="text-xs text-white">+{post.files.length - 3} more</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex items-center text-xs text-[#6e6e6e]">
                          <div className="flex items-center">
                            <User className="h-3 w-3 mr-1" />
                            <span>{post.userName}</span>
                          </div>
                          <Separator orientation="vertical" className="mx-2 h-3 bg-[#3a3b44]" />
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{formatDate(post.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
                {index < posts.length - 1 && <Separator className="bg-[#3a3b44]" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {!isLoading && total > pageSize && (
        <div className="mt-8">
          <PaginationControls total={total} page={page} pageSize={pageSize} onPageChange={setPage} />
        </div>
      )}

      <CreatePostModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        forumId={forumId as string}
        userId={userId || ""}
        userName={userName || ""}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          toast.success("Post created successfully")
        }}
      />
    </div>
  )
}
