"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import Peer, { MediaConnection } from "peerjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface StudentLiveClassProps {
  liveClassId: string;
  courseId: string;
  userId: string;
  teacherId: string;
}

interface Participant {
  userId: string;
  userName: string;
}

interface ChatMessage {
  senderId: string;
  senderName: string;
  message: string;
  timestamp: string;
}

const StudentLiveClass = ({ liveClassId, courseId, userId, teacherId }: StudentLiveClassProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTeacherConnected, setIsTeacherConnected] = useState(true);
  const [isStreamActive, setIsStreamActive] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const callRef = useRef<MediaConnection | null>(null);

  const initializeWebRTCAndSocket = useCallback(async () => {
    const socket = io("http://localhost:8000", {
      query: { userId },
      path: "/socket.io/",
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinLiveClass", { liveClassId, isTeacher: false });
      socket.emit("requestStream", { liveClassId, userId });
      toast.success("Connected to live class");
    });

    socket.on("userJoined", ({ userId: joinedUserId, participants: newParticipants, isTeacher }) => {
      setParticipants(newParticipants);
      if (isTeacher && joinedUserId === teacherId) setIsTeacherConnected(true);
    });

    socket.on("teacherStreamStarted", () => {
      setIsTeacherConnected(true);
      console.log("Teacher started streaming");
    });

    socket.on("teacherPeerId", ({ peerId }) => {
      console.log(`Received teacher PeerJS ID: ${peerId}`);
    });

    socket.on("provideStudentPeerId", ({ liveClassId }) => {
      if (peerRef.current) {
        console.log(`Student ${userId} sending PeerJS ID: ${peerRef.current.id}`);
        socket.emit("provideStudentPeerId", { liveClassId, peerId: peerRef.current.id });
      }
    });

    socket.on("chatHistory", (messages: ChatMessage[]) => setChatMessages(messages));
    socket.on("liveMessage", (message: ChatMessage) => setChatMessages(prev => [...prev, message]));

    socket.on("error", (error: { message: string }) => toast.error(error.message));
    socket.on("disconnect", () => toast.info("Disconnected from server"));

    peerRef.current = new Peer({
      host: 'localhost',
      port: 9000,
      path: '/myapp',
      debug: 3
    });

    peerRef.current.on('open', (id) => {
      console.log(`Student PeerJS ID: ${id}`);
    });

    peerRef.current.on('call', (call) => {
      console.log(`Student ${userId} received call from teacher`);
      callRef.current = call;
      call.answer(); // No local stream needed
      
      call.on('stream', (remoteStream) => {
        console.log("Received teacher's stream");
        if (videoRef.current) {
          videoRef.current.srcObject = remoteStream;
          videoRef.current.play().catch(err => console.error("Video play error:", err));
          setIsStreamActive(true);
          toast.success("Connected to teacher's stream");
        }
      });
      
      call.on('error', (err) => {
        console.error("Call error:", err);
        toast.error("Failed to connect to stream: " + err.message);
        setIsStreamActive(false);
      });
      
      call.on('close', () => {
        console.log("Call closed");
        setIsStreamActive(false);
        callRef.current = null;
      });
    });

    peerRef.current.on('error', (err) => {
      console.error("PeerJS error:", err);
      toast.error("PeerJS error: " + err.message);
    });

    return () => {
      socket.emit("leaveLiveClass", { liveClassId });
      socket.disconnect();
      if (callRef.current) {
        callRef.current.close();
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [liveClassId, userId, teacherId]);

  useEffect(() => {
    initializeWebRTCAndSocket();
  }, [initializeWebRTCAndSocket]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;
    socketRef.current.emit("sendLiveMessage", { liveClassId, message: newMessage.trim() });
    setNewMessage("");
  };

  const handleLeave = () => {
    if (socketRef.current) {
      socketRef.current.emit("leaveLiveClass", { liveClassId });
      socketRef.current.disconnect();
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    window.location.href = `/course/${courseId}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="w-4/5 p-6 flex flex-col">
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-contain" 
            style={{ minHeight: "300px" }} 
          />
          {!isStreamActive && isTeacherConnected && (
            <div className="absolute inset-0 flex items-center justify-center flex-col bg-gray-900 bg-opacity-75">
              <p className="text-xl mb-4">Teacher is streaming. Connecting...</p>
            </div>
          )}
          {!isTeacherConnected && (
            <div className="absolute inset-0 flex items-center justify-center flex-col bg-gray-900 bg-opacity-75">
              <p className="text-xl mb-4">Waiting for teacher to start streaming...</p>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-4">
          <Button onClick={handleLeave} className="bg-red-600 hover:bg-red-700">Leave Class</Button>
        </div>
      </div>
      <div className="w-1/5 p-6 bg-gray-800 flex flex-col">
        <h2 className="text-lg font-semibold mb-2">Participants ({participants.length})</h2>
        <ScrollArea className="h-40 rounded-md border border-gray-700 p-2 mb-6">
          <ul className="space-y-2">
            {participants.map((p) => (
              <li key={p.userId} className="text-sm">
                {p.userName} {p.userId === userId ? "(You)" : p.userId === teacherId ? "(Teacher)" : ""}
              </li>
            ))}
          </ul>
        </ScrollArea>
        <h2 className="text-lg font-semibold mb-2">Live Chat</h2>
        <ScrollArea className="flex-1 rounded-md border border-gray-700 p-4 mb-4">
          {chatMessages.map((msg, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium text-blue-300">{msg.senderName}:</span> {msg.message}
              <div className="text-xs text-gray-400 mt-1">{new Date(msg.timestamp).toLocaleTimeString()}</div>
            </div>
          ))}
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 border-gray-600 text-white"
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button onClick={sendMessage} className="bg-green-600 hover:bg-green-700">Send</Button>
        </div>
      </div>
    </div>
  );
};

export default StudentLiveClass;