"use client";

import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useGetChatHistoryQuery } from "@/state/redux"; 
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send } from "lucide-react";

interface ChatMessage {
  courseId: string;
  senderId: string;
  receiverId: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

interface ChatProps {
  courseId: string;
  senderId: string; // Current user (student or instructor)
  receiverId: string; // Other party (instructor or student)
}

const Chat = ({ courseId, senderId, receiverId }: ChatProps) => {
  const { data, isLoading, isError } = useGetChatHistoryQuery({ courseId, senderId, receiverId });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  console.log("Chat props - senderId:", senderId, "receiverId:", receiverId, "courseId:", courseId);

  useEffect(() => {
    const socketInstance = io("http://localhost:8000", {
      query: { userId: senderId }, // Use senderId for socket connection
      path: "/socket.io/",
    });
    setSocket(socketInstance);

    socketInstance.on("connect", () => console.log("Socket connected:", socketInstance.id));
    socketInstance.on("connect_error", (err) => console.error("Socket error:", err));

    socketInstance.emit("joinChat", { courseId });

    socketInstance.on("newMessage", (message: ChatMessage) => {
      console.log("New message received:", message);
      setMessages((prev) => [...prev, message]);
    });

    socketInstance.on("userJoined", ({ userId: joinedUserId }) => {
      console.log(`${joinedUserId} joined the chat for course ${courseId}`);
    });

    socketInstance.on("error", (error: { message: string }) => {
      toast.error(error.message);
    });

    return () => {
      socketInstance.emit("leaveChat", { courseId });
      socketInstance.disconnect();
    };
  }, [courseId, senderId]);

  useEffect(() => {
    if (data?.data) {
      console.log("Chat history loaded:", data.data);
      setMessages(data.data);
    }
    if (isError) {
      console.error("Chat history fetch error:", isError);
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
      senderId, // Current user sending the message
      receiverId, // Recipient of the message
      message: newMessage.trim(),
    };
    console.log("Sending message payload:", payload);

    socket.emit("sendMessage", payload);
    setNewMessage("");
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
          messages.map((msg, index) => {
            console.log(`Rendering msg ${index}: senderId=${msg.senderId}, userId=${senderId}, aligns ${msg.senderId === senderId ? "right" : "left"}`);
            return (
              <div
                key={index}
                className={`mb-4 flex ${
                  msg.senderId === senderId ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs p-3 rounded-lg shadow-sm ${
                    msg.senderId === senderId
                      ? "bg-[#6366F1] text-white ml-4"
                      : "bg-[#3A3B45] text-gray-300 mr-4"
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <span className="text-xs text-gray-400 block mt-1">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            );
          })
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
      </CardContent>
    </Card>
  );
};

export default Chat;