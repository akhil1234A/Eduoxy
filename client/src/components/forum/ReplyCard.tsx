"use client"

import type React from "react"

import { useState, memo } from "react"
import { Button } from "@/components/ui/button"
import { EditReplyModal } from "./EditReplyModal"
import { CreateReplyModal } from "./CreateReplyModal"
import { useDeleteReplyMutation } from "@/state/api/forumApi"
import { toast } from "sonner"
import { FileViewer } from "@/components/FileViewer"
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
import { Loader2, User, ChevronDown, ChevronUp, MessageSquare, Calendar, Edit, Trash2 } from "lucide-react"
import Cookies from "js-cookie"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

interface IReplyTreeNode {
  _id: string
  userId: string
  userName: string
  content: string
  createdAt: string
  files: {
    url: string
    key?: string
    type: string
    size?: number
    name?: string
    publicUrl: string
  }[]
  children: IReplyTreeNode[]
}

interface ReplyCardProps {
  reply: IReplyTreeNode
  canEdit: boolean
  canDelete: boolean
  postId: string
  level?: number
}

const MAX_REPLY_DEPTH = 2

export const ReplyCard: React.FC<ReplyCardProps> = memo(({ reply, canEdit, canDelete, postId, level = 0 }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false)
  const [showNestedReplies, setShowNestedReplies] = useState(level === 0)
  const [deleteReply, { isLoading: isDeleting }] = useDeleteReplyMutation()
  const userId = Cookies.get("userId") || localStorage.getItem("userId");

  const handleDelete = async () => {
    try {
      await deleteReply({ replyId: reply._id, userId: reply.userId }).unwrap()
      toast.success("Reply deleted successfully")
    } catch (error) {
      toast.error((error as Error).message)
    }
  }

  const isMaxDepthReached = level >= MAX_REPLY_DEPTH

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const borderColorClass =
    level === 0 ? "border-l-primary-700" : level === 1 ? "border-l-primary-600" : "border-l-primary-500"

  return (
    <div
      className={`border-l-4 ${borderColorClass} bg-[#2a2b34] rounded-r-lg p-5 shadow-sm hover:shadow-md transition-shadow border-t border-r border-b border-[#3a3b44]`}
      style={{ marginLeft: `${level * 2}rem` }}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 bg-[#32333c] rounded-full p-2">
          <User className="h-5 w-5 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap justify-between items-start gap-2 mb-3">
            <div>
              <p className="text-white font-medium">{reply.userName}</p>
              <div className="flex items-center text-xs text-[#9ca3af] mt-1">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{formatDate(reply.createdAt)}</span>
              </div>
            </div>

            {(canEdit || canDelete) && (
              <div className="flex gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditModalOpen(true)}
                    disabled={isDeleting}
                    className="text-white border-[#3a3b44] hover:bg-[#32333c]"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                )}

                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={isDeleting}>
                        {isDeleting ? (
                          <Loader2 className="animate-spin h-4 w-4" />
                        ) : (
                          <>
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete
                          </>
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-[#2a2b34] text-white border-[#3a3b44]">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-[#9ca3af]">
                          This action cannot be undone. This will permanently delete the reply and its nested replies.
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
                )}
              </div>
            )}
          </div>

          <div className="text-white mb-4 whitespace-pre-line">{reply.content}</div>

          {reply.files && reply.files.length > 0 && (
            <div className="mb-4 p-3 bg-[#32333c] rounded-lg border border-[#3a3b44]">
              <div className="flex items-center mb-2">
                <span className="text-sm text-white mr-2">Attachments</span>
                <Badge variant="outline" className="text-xs">
                  {reply.files.length} {reply.files.length === 1 ? "file" : "files"}
                </Badge>
              </div>
              <FileViewer files={reply.files} />
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsReplyModalOpen(true)}
                      disabled={isMaxDepthReached}
                      className={`text-primary-500 hover:text-primary-400 hover:bg-[#32333c] ${isMaxDepthReached ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Reply
                    </Button>
                  </span>
                </TooltipTrigger>
                {isMaxDepthReached && (
                  <TooltipContent className="bg-[#32333c] text-white border-[#3a3b44]">
                    <p>Maximum reply depth reached</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>

            {reply.children.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowNestedReplies(!showNestedReplies)}
                className="text-[#9ca3af] hover:text-white hover:bg-[#32333c]"
              >
                {showNestedReplies ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5 mr-1.5" />
                    Hide Replies ({reply.children.length})
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5 mr-1.5" />
                    Show Replies ({reply.children.length})
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {showNestedReplies && reply.children.length > 0 && (
        <div className="mt-5 space-y-4">
          {reply.children.map((nestedReply) => (
            <ReplyCard
              key={nestedReply._id}
              reply={nestedReply}
              canEdit={nestedReply.userId === userId}
              canDelete={nestedReply.userId === userId}
              postId={postId}
              level={level + 1}
            />
          ))}
        </div>
      )}

      <EditReplyModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        reply={{
          id: reply._id,
          content: reply.content,
          files: reply.files.map((file) => ({
            url: file.url,
            key: file.key || "",
            type: file.type,
            size: file.size || 0,
            name: file.name || "",
            publicUrl: file.publicUrl,
          })),
        }}
      />

      <CreateReplyModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        postId={postId}
        parentReplyId={reply._id}
        level={level}
        onSuccess={() => {
          setIsReplyModalOpen(false)
          toast.success("Reply created successfully")
        }}
      />
    </div>
  )
})

ReplyCard.displayName = "ReplyCard"
