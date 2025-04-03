"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { X, Plus, MessageSquare, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import Cookies from "js-cookie";
import { toast } from "sonner";
import debounce from "lodash/debounce";

interface Post {
  _id: string;
  userId: string;
  userName: string;
  content: string;
  topic: string;
  timestamp: string;
  replies: Reply[];
}

interface Reply {
  _id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

const AVAILABLE_TAGS = ["general", "Devops", "Web Development", "Data Science", "Machine Learning", "AI"];

const Forum = () => {
  const userId = Cookies.get("userId");

  const [socket, setSocket] = useState<Socket | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [newTopic, setNewTopic] = useState(AVAILABLE_TAGS[0]);
  const [newReply, setNewReply] = useState<{ [postId: string]: string }>({});
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTopic, setFilterTopic] = useState<string | null>("all");
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastPostElementRef = useRef<HTMLDivElement | null>(null);
  const isConnected = useRef(false);

  const initializeSocket = useCallback(() => {
    if (!userId) {
      setError("Please sign in to access the forum.");
      return;
    }

    const socketInstance = io("http://localhost:8000", {
      query: { userId },
      path: "/socket.io/",
    });

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      if (!isConnected.current) {
        socketInstance.emit("joinForum");
        isConnected.current = true;
      }
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket error:", err);
      setError("Failed to connect to forum server");
      toast.error("Failed to connect to forum server");
    });

    socketInstance.on("forumPosts", (data: Post[]) => {
      console.log("Received forum posts:", data);
      setPosts(data);
      setHasMore(data.length > 0);
    });

    socketInstance.on("newPost", (post: Post) => {
      console.log("New post received:", post);
      setPosts((prev) => [post, ...prev]);
    });

    socketInstance.on("newReply", ({ postId, reply }: { postId: string; reply: Reply }) => {
      console.log("New reply received for post:", postId, reply);
      setPosts((prev) =>
        prev.map((post) =>
          post._id === postId ? { ...post, replies: [...post.replies, reply] } : post
        )
      );
    });

    socketInstance.on("postDeleted", (postId: string) => {
      console.log("Post deleted:", postId);
      setPosts((prev) => prev.filter((post) => post._id !== postId));
      toast.success("Post deleted successfully!");
    });

    socketInstance.on("error", (error: { message: string }) => {
      console.error("Server error:", error);
      setError(error.message);
      toast.error(error.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      isConnected.current = false;
    };
  }, [userId]);

  useEffect(() => {
    const cleanup = initializeSocket();
    return cleanup;
  }, [initializeSocket]);

  const loadMorePosts = useCallback(() => {
    if (socket && hasMore) {
      console.log(`Loading more posts, page: ${page + 1}`);
      socket.emit("joinForum"); // Replace with paginated fetch if backend supports it
      setPage((prev) => prev + 1);
    }
  }, [socket, hasMore, page]);

  useEffect(() => {
    if (!lastPostElementRef.current || !hasMore) return;

    observer.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMorePosts();
        }
      },
      { threshold: 0.1 }
    );

    observer.current.observe(lastPostElementRef.current);

    return () => {
      if (observer.current && lastPostElementRef.current) {
        observer.current.unobserve(lastPostElementRef.current);
      }
    };
  }, [loadMorePosts, hasMore]);

  const handleCreatePost = useCallback(() => {
    if (!userId) {
      setError("Please sign in to create a post.");
      return;
    }
    if (!newPost.trim() || !newTopic || !socket) {
      setError("Post content and topic are required.");
      return;
    }
    console.log("Emitting createPost:", { content: newPost.trim(), topic: newTopic });
    socket.emit("createPost", { content: newPost.trim(), topic: newTopic });
    setNewPost("");
    setNewTopic(AVAILABLE_TAGS[0]);
    setError(null);
    setIsModalOpen(false);
    toast.success("Post created successfully!");
  }, [userId, newPost, newTopic, socket]);

  const handleCreateReply = useCallback(
    (postId: string) => {
      if (!userId) {
        setError("Please sign in to create a reply.");
        return;
      }
      if (!newReply[postId]?.trim() || !socket) {
        setError("Reply content is required.");
        return;
      }
      console.log("Emitting createReply:", { postId, content: newReply[postId] });
      socket.emit("createReply", { postId, content: newReply[postId] });
      setNewReply((prev) => ({ ...prev, [postId]: "" }));
      setError(null);
      toast.success("Reply posted!");
    },
    [userId, newReply, socket]
  );

  const handleDeletePost = useCallback(
    (postId: string) => {
      if (!userId || !socket) {
        setError("Please sign in to delete a post.");
        return;
      }
      console.log("Emitting deletePost:", { postId });
      socket.emit("deletePost", { postId });
    },
    [userId, socket]
  );

  const handleFilterByTopic = useCallback(
    (topic: string) => {
      setFilterTopic(topic);
      if (topic === "all") {
        console.log("Emitting joinForum to reset filter");
        socket?.emit("joinForum");
      } else if (socket) {
        console.log("Emitting filterByTopic:", { topic });
        socket.emit("filterByTopic", { topic });
      }
    },
    [socket]
  );

  const debouncedSearch = useMemo(
    () =>
      debounce((query: string) => {
        if (socket) {
          if (query.trim()) {
            console.log("Emitting searchPosts:", { query });
            socket.emit("searchPosts", { query });
          } else {
            socket.emit("joinForum");
          }
        }
      }, 300),
    [socket]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    debouncedSearch(e.target.value);
  };

  const filteredPosts = useMemo(() => {
    return filterTopic && filterTopic !== "all"
      ? posts.filter((post) => post.topic === filterTopic)
      : posts;
  }, [posts, filterTopic]);

  if (!userId) {
    return (
      <div className="p-6 text-white min-h-screen bg-gray-900">
        <Alert variant="destructive">
          <X className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Please sign in to access the forum.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 text-white min-h-screen bg-gray-900">
      <div className="flex flex-row items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Forum</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#6366F1] hover:bg-[#4f46e5] text-white">
              <Plus className="mr-2 h-4 w-4" />
              New Post
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#2D2E36] border-[#3A3B45] text-white sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Create a New Post</DialogTitle>
              <DialogDescription className="text-gray-400">Share your thoughts with the community</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="topic" className="text-white">Topic</Label>
                <Select value={newTopic} onValueChange={setNewTopic}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    {AVAILABLE_TAGS.map((tag) => (
                      <SelectItem key={tag} value={tag} className="text-white hover:bg-gray-600">
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content" className="text-white">Content</Label>
                <Textarea
                  id="content"
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Write your post content here..."
                  className="min-h-[150px] bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
              >
                Cancel
              </Button>
              <Button onClick={handleCreatePost} className="bg-blue-600 hover:bg-blue-700 text-white">
                Post
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4 bg-[#3A3B45] border-none">
          <X className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-4 mb-6">
        <Input
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Search posts..."
          className="flex-1 bg-[#3A3B45] border-none text-white placeholder-gray-400"
        />
        <Button onClick={() => debouncedSearch(searchQuery)} className="bg-[#6366F1] hover:bg-[#4f46e5] text-white">
          Search
        </Button>
        <Select onValueChange={handleFilterByTopic} value={filterTopic || "all"}>
          <SelectTrigger className="w-40 bg-[#3A3B45] border-none text-white">
            <SelectValue placeholder="Filter by Topic" />
          </SelectTrigger>
          <SelectContent className="bg-[#3A3B45] border-[#4f46e5]">
            <SelectItem value="all" className="text-white hover:bg-[#4f46e5]">All Topics</SelectItem>
            {AVAILABLE_TAGS.map((tag) => (
              <SelectItem key={tag} value={tag} className="text-white hover:bg-[#4f46e5]">
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8">
            <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-300 text-lg">No posts found.</p>
            <p className="text-gray-400 text-sm mt-2">Be the first to start a discussion!</p>
          </div>
        ) : (
          filteredPosts.map((post, index) => (
            <Card
              key={post._id}
              className="bg-[#3A3B45] border-none"
              ref={index === filteredPosts.length - 1 ? lastPostElementRef : null}
            >
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-[#6366F1]">{post.userName[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg text-white">{post.userName}</CardTitle>
                  <p className="text-sm text-gray-400">{new Date(post.timestamp).toLocaleString()}</p>
                </div>
                <Badge variant="secondary" className="ml-auto bg-[#6366F1] text-white">
                  {post.topic}
                </Badge>
              </CardHeader>
              <CardContent>
                <p className="text-white">{post.content}</p>
              </CardContent>
              <CardFooter className="flex flex-col gap-4">
                <div className="flex justify-between w-full">
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedPost(selectedPost === post._id ? null : post._id)}
                    className="text-gray-400 hover:text-white"
                  >
                    {selectedPost === post._id ? "Hide Replies" : `Show Replies (${post.replies.length})`}
                  </Button>
                  {post.userId === userId && (
                    <Button
                      variant="ghost"
                      onClick={() => handleDeletePost(post._id)}
                      className="text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
                {selectedPost === post._id && (
                  <div className="w-full space-y-4">
                    <ScrollArea className="h-[200px] rounded-md border border-[#4f46e5] p-4 bg-[#2D2E36]">
                      {post.replies.length === 0 ? (
                        <p className="text-gray-400 text-center">No replies yet.</p>
                      ) : (
                        post.replies.map((reply) => (
                          <Card key={reply._id} className="bg-[#2D2E36] border-none mb-2">
                            <CardHeader className="flex flex-row items-center gap-4">
                              <Avatar>
                                <AvatarFallback className="bg-[#6366F1]">{reply.userName[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <CardTitle className="text-sm text-white">{reply.userName}</CardTitle>
                                <p className="text-xs text-gray-400">
                                  {new Date(reply.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <p className="text-white">{reply.content}</p>
                            </CardContent>
                          </Card>
                        ))
                      )}
                    </ScrollArea>
                    <div className="flex gap-2">
                      <Input
                        value={newReply[post._id] || ""}
                        onChange={(e) =>
                          setNewReply((prev) => ({ ...prev, [post._id]: e.target.value }))
                        }
                        placeholder="Write a reply..."
                        className="flex-1 bg-[#2D2E36] border-none text-white placeholder-gray-400"
                      />
                      <Button
                        onClick={() => handleCreateReply(post._id)}
                        className="bg-[#6366F1] hover:bg-[#4f46e5] text-white"
                      >
                        Reply
                      </Button>
                    </div>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Forum;