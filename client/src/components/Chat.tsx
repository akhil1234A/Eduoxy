"use client";

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useGetChatHistoryQuery } from "@/state/redux";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Paperclip } from "lucide-react";
import { uploadToS3 } from "@/lib/utils";

interface ChatMessage {
  courseId: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  isFile?: boolean;
  fileName?: string;
}

interface ChatProps {
  courseId: string;
  senderId: string;
  receiverId: string;
}

const Chat = ({ courseId, senderId, receiverId }: ChatProps) => {
  const { data, isLoading, isError } = useGetChatHistoryQuery({ courseId, senderId, receiverId });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL, {
      query: { userId: senderId },
      path: "/socket.io/",
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
      forceNew: true,
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Socket connected:", socketInstance.id);
      socketInstance.emit("joinChat", { courseId });
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
      toast.error("Failed to connect to chat server. Retrying...");
    });

    socketInstance.on("error", (error: { message: string }) => {
      console.error("Socket error:", error);
      toast.error(error.message);
    });

    socketInstance.on("newMessage", (message: ChatMessage) => {
      console.log("New message received:", message);
      setMessages((prev) => {
        const messageExists = prev.some(
          (msg) => 
            msg.senderId === message.senderId && 
            msg.receiverId === message.receiverId && 
            msg.message === message.message && 
            msg.timestamp === message.timestamp
        );
        if (!messageExists) {
          return [...prev, message];
        }
        return prev;
      });
    });

    socketInstance.on("messageSent", (message: ChatMessage) => {
      console.log("Message sent successfully:", message);
      setMessages((prev) => [...prev, message]);
    });

    socketInstance.on("userJoined", ({ userId: joinedUserId }) => {
      console.log(`${joinedUserId} joined the chat for course ${courseId}`);
    });

    return () => {
      if (socketInstance.connected) {
        socketInstance.emit("leaveChat", { courseId });
        socketInstance.disconnect();
      }
    };
  }, [courseId, senderId]);

  useEffect(() => {
    if (data?.data) {
      console.log("Chat history loaded:", data.data);
      setMessages(data.data);
    }
    if (isError) {
      toast.error("Failed to load chat history");
    }
  }, [data, isError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    const payload = {
      courseId,
      senderId,
      receiverId,
      message: newMessage.trim(),
      isFile: false,
    };
    socket.emit("sendMessage", payload);
    setNewMessage("");
  };

  const handleFileUpload = async () => {
    if (!file || !socket) return;

    try {
      const { publicUrl } = await uploadToS3(file, "chat_file"); 
      const payload = {
        courseId,
        senderId,
        receiverId,
        message: publicUrl,
        isFile: true,
        fileName: file.name,
      };
      socket.emit("sendMessage", payload);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("File sent successfully!");
    } catch (error) {
      toast.error("Failed to send file: " + (error as Error).message);
    }
  };

  return (
    <Card className="w-full h-[500px] flex flex-col bg-[#2D2E36] border-none shadow-md">
      <ScrollArea className="flex-1 p-4 bg-[#1B1C22] rounded-t-lg">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400">No messages yet. Start the conversation!</div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`mb-4 flex ${msg.senderId === senderId ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg shadow-sm ${
                  msg.senderId === senderId
                    ? "bg-[#6366F1] text-white ml-4"
                    : "bg-[#3A3B45] text-gray-300 mr-4"
                }`}
              >
                {msg.isFile ? (
                  <a
                    href={msg.message}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-300 underline"
                  >
                    {msg.fileName || "Download File"}
                  </a>
                ) : (
                  <p className="text-sm">{msg.message}</p>
                )}
                <span className="text-xs text-gray-400 block mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </ScrollArea>
      <CardContent className="p-4 bg-[#2D2E36] rounded-b-lg flex items-center gap-2">
        <Input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 bg-[#3A3B45] text-white border-none focus:ring-[#6366F1]"
        />
        <Button onClick={sendMessage} className="bg-[#6366F1] hover:bg-[#4f46e5]">
          <Send className="w-4 h-4" />
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="bg-[#6366F1] hover:bg-[#4f46e5]"
          disabled={!!file}
        >
          <Paperclip className="w-4 h-4" />
        </Button>
        {file && (
          <Button onClick={handleFileUpload} className="bg-[#6366F1] hover:bg-[#4f46e5]">
            Upload
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default Chat;