import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { useGetProfileQuery } from "@/state/api/userApi";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
}

interface LiveClassChatProps {
  socket: Socket | null;
  roomId: string;
  userId: string;
  isTeacher?: boolean;
}

export default function LiveClassChat({ socket, roomId, userId }: LiveClassChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [participants, setParticipants] = useState<{ [key: string]: string }>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: userProfile } = useGetProfileQuery(userId, { skip: !userId });

  // Fetch participant profiles
  useEffect(() => {
    const fetchParticipantProfiles = async () => {
      if (!socket) return;
      
      // Request participant list from server
      socket.emit("get-participants", { roomId });
    };

    fetchParticipantProfiles();
  }, [socket, roomId]);

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on("live-class-message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    // Listen for participant updates
    socket.on("participant-joined", ({ userId, userName }) => {
      setParticipants((prev) => ({ ...prev, [userId]: userName }));
    });

    socket.on("participant-left", ({ userId }) => {
      setParticipants((prev) => {
        const newParticipants = { ...prev };
        delete newParticipants[userId];
        return newParticipants;
      });
    });

    // Request initial participant list
    socket.emit("get-participants", { roomId });

    // Cleanup function
    return () => {
      if (socket) {
        socket.off("live-class-message");
        socket.off("participant-joined");
        socket.off("participant-left");
        // Clear messages and participants when component unmounts
        setMessages([]);
        setParticipants({});
      }
    };
  }, [socket, roomId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!socket || !newMessage.trim() || !userProfile) return;

    const message: Message = {
      id: Date.now().toString(),
      userId,
      userName: userProfile.data?.name || "Unknown",
      content: newMessage.trim(),
      timestamp: new Date(),
    };

    socket.emit("live-class-message", { roomId, message });
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex flex-col h-full bg-customgreys-secondarybg rounded-lg overflow-hidden">
      <div className="p-4 border-b border-customgreys-darkGrey">
        <h3 className="text-lg font-semibold text-white-50">Live Class Chat</h3>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(participants).map(([id, name]) => (
            <Badge key={id} variant="outline" className="bg-customgreys-primarybg text-white-50">
              {name}
            </Badge>
          ))}
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.userId === userId ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex max-w-[80%] ${message.userId === userId ? "flex-row-reverse" : "flex-row"} items-end gap-2`}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary-700 text-white-50">
                    {message.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className={`flex flex-col ${message.userId === userId ? "items-end" : "items-start"}`}>
                  <div className="text-xs text-gray-400 mb-1">{message.userName}</div>
                  <div className={`rounded-lg px-3 py-2 ${
                    message.userId === userId 
                      ? "bg-primary-700 text-white-50" 
                      : "bg-customgreys-primarybg text-white-50"
                  }`}>
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{formatTime(message.timestamp)}</div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-customgreys-darkGrey">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="bg-customgreys-primarybg text-white-50 border-customgreys-darkGrey focus:border-primary-700"
          />
          <Button 
            onClick={handleSendMessage} 
            disabled={!newMessage.trim()}
            className="bg-primary-700 hover:bg-primary-600 text-white-50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
