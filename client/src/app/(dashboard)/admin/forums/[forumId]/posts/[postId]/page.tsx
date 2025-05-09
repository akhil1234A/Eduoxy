"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useGetPostQuery, useGetRepliesQuery, useDeletePostMutation } from "@/state/api/forumApi"
import { Button } from "@/components/ui/button"
import { CreateReplyModal } from "@/components/forum/CreateReplyModal"
import { PaginationControls } from "@/components/PaginationControls"
import { toast } from "sonner"
import Cookies from "js-cookie"
import { useSocket } from "@/contexts/SocketContext"
import { Loader2, Edit, Trash2, ArrowLeft, MessageSquare, Calendar, User } from "lucide-react"
import { FileViewer } from "@/components/FileViewer"
import { ReplyCard } from "@/components/forum/ReplyCard"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { EditPostModal } from "@/components/forum/EditPostModal"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"



export default function PostPage() {
  const { postId } = useParams()
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)
  const userId = Cookies.get("userId")
  const { socket } = useSocket()

  const { data: postData, isLoading: isPostLoading } = useGetPostQuery(postId as string)
  const {
    data: repliesData,
    isLoading: isRepliesLoading,
    refetch: refetchReplies,
  } = useGetRepliesQuery({
    postId: postId as string,
    page,
    pageSize: 10,
  })

  const [deletePost, { isLoading: isDeleting }] = useDeletePostMutation()

  useEffect(() => {
    if (!socket || !postId) return

    const postIdStr = postId.toString()
    socket.emit("joinPost", { postId: postIdStr })

    const handleNewReply = (newReply: IReplyTreeNode) => {
      console.log("New reply received:", newReply)
      refetchReplies()
      toast.success("Reply added")
    }

    socket.on("newReply", handleNewReply)

    socket.on("error", (error: { message: string }) => {
      console.error("Socket error:", error.message)
      toast.error(error.message)
    })

    return () => {
      socket.off("newReply", handleNewReply)
      socket.off("error")
      socket.emit("leavePost", { postId: postIdStr })
    }
  }, [socket, postId, refetchReplies])

  const post = postData?.data
  const { items: replies = [], total = 0, pageSize = 10 } = repliesData?.data || {}

  const handleDelete = async () => {
    if (!post) return
    try {
      await deletePost({ postId: post._id, userId: post.userId }).unwrap()
      toast.success("Post deleted successfully")
      router.push(`/admin/forums/${post.forumId}`)
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (isPostLoading || isRepliesLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="animate-spin h-8 w-8 text-primary-700" />
      </div>
    )
  }

  if (!post) {
    return <div className="text-center py-8 text-red-600">Post not found</div>
  }

  return (
    <div className="min-h-screen pb-12">
      {/* Navigation and Post Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-[#3a3b44] hover:bg-[#32333c] text-white"
            onClick={() => router.push(`/admin/forums/${post.forumId}`)}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Forum
          </Button>

          {post.userId === userId && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(true)}
                className="text-white border-[#3a3b44] hover:bg-[#32333c]"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Post
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" disabled={isDeleting}>
                    {isDeleting ? (
                      <Loader2 className="animate-spin h-4 w-4" />
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-[#2a2b34] text-white border-[#3a3b44]">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription className="text-[#9ca3af]">
                      This action cannot be undone. This will permanently delete the post and all its replies.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-[#1e1f26] text-white hover:bg-[#32333c] border-[#3a3b44]">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        {/* Post Title and Metadata */}
        <h1 className="text-3xl font-bold text-white mb-3">{post.topic}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-[#9ca3af] mb-4">
          <div className="flex items-center">
            <User className="h-4 w-4 mr-1.5" />
            <span>{post.userName}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1.5" />
            <span>{formatDate(post.createdAt)}</span>
          </div>
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1.5" />
            <span>
              {total} {total === 1 ? "reply" : "replies"}
            </span>
          </div>
        </div>
        <Separator className="bg-[#3a3b44] mb-6" />
      </div>

      {/* Post Content */}
      <div className="mb-8">
        <div className="text-white text-lg mb-6 whitespace-pre-line">{post.content}</div>

        {post.files && post.files.length > 0 && (
          <div className="mt-6 p-4 bg-[#2a2b34] rounded-lg border border-[#3a3b44]">
            <h3 className="text-white font-medium mb-3 flex items-center">
              <span className="mr-2">Attachments</span>
              <Badge variant="outline" className="text-xs">
                {post.files.length} {post.files.length === 1 ? "file" : "files"}
              </Badge>
            </h3>
            <FileViewer files={post.files} />
          </div>
        )}
      </div>

      <Separator className="bg-[#3a3b44] my-8" />

      {/* Replies Section */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            Replies
            <Badge variant="outline" className="ml-2">
              {total}
            </Badge>
          </h2>
          <Button onClick={() => setIsReplyModalOpen(true)} className="bg-primary-700 hover:bg-primary-600 text-white">
            <MessageSquare className="h-4 w-4 mr-2" />
            Add Reply
          </Button>
        </div>

        {replies.length > 0 ? (
          <div className="space-y-6">
            {replies.map((reply) => (
              <ReplyCard
                key={reply._id}
                reply={reply}
                canEdit={reply.userId === userId}
                canDelete={reply.userId === userId}
                postId={postId as string}
                level={0}
              />
            ))}

            <div className="mt-8">
              <PaginationControls total={total} page={page} pageSize={pageSize} onPageChange={setPage} />
            </div>
          </div>
        ) : (
          <div className="bg-[#2a2b34] rounded-lg p-8 text-center border border-[#3a3b44]">
            <MessageSquare className="h-12 w-12 text-[#3a3b44] mx-auto mb-4" />
            <p className="text-[#9ca3af] text-lg mb-2">No replies yet</p>
            <p className="text-[#6e6e6e] mb-6">Be the first to share your thoughts on this post</p>
            <Button
              onClick={() => setIsReplyModalOpen(true)}
              className="bg-primary-700 hover:bg-primary-600 text-white"
            >
              Add Reply
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateReplyModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        postId={postId as string}
        onSuccess={() => {
          setIsReplyModalOpen(false)
          refetchReplies()
          toast.success("Reply created successfully")
        }}
      />

      <EditPostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        post={post}
        onSuccess={() => {
          setIsEditModalOpen(false)
          toast.success("Post updated successfully")
        }}
      />
    </div>
  )
}
