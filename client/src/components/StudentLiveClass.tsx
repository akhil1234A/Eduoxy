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

export default function StudentLiveClass({
  liveClassId,
  courseId,
  userId,
  teacherId,
}: StudentLiveClassProps) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isTeacherConnected, setIsTeacherConnected] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [teacherPeerId, setTeacherPeerId] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const callRef = useRef<MediaConnection | null>(null);

  const handleVideoClick = () => {
    if (videoRef.current?.paused && videoRef.current.srcObject) {
      videoRef.current.play().then(() => {
        setIsStreamActive(true);
        setConnectionStatus("connected");
        toast.success("Stream started manually");
      }).catch(err => toast.error("Playback error: " + err.message));
    }
  };

  const handleIncomingStream = useCallback((stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return;

    if (video.srcObject) {
      (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }

    video.srcObject = stream;
    video.autoplay = true;
    video.muted = false;

    video.onloadedmetadata = () => {
      video.play()
        .then(() => {
          setIsStreamActive(true);
          setConnectionStatus("connected");
          toast.success("Connected to teacher's stream");
        })
        .catch(err => {
          toast.error(err.name === "NotAllowedError"
            ? "Autoplay blocked. Click to play."
            : "Video play failed: " + err.message);
        });
    };
  }, []);

  const connectToTeacher = useCallback((peerId: string) => {
    if (!peerRef.current) return;
    const call = peerRef.current.call(peerId, new MediaStream());
    callRef.current = call;

    call.on("stream", handleIncomingStream);
    call.on("close", () => {
      setIsStreamActive(false);
      setConnectionStatus("disconnected");
    });
    call.on("error", err => {
      toast.error("Call error: " + err.message);
      setConnectionStatus("disconnected");
    });
  }, [handleIncomingStream]);

  const initializeWebRTCAndSocket = useCallback(() => {
    const socket = io("http://localhost:8000", {
      query: { userId },
      path: "/socket.io/",
      transports: ["websocket"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinLiveClass", { liveClassId, isTeacher: false });
      toast.success("Connected to live class");
    });

    socket.on("userJoined", ({ userId: joinedId, participants, isTeacher }) => {
      setParticipants(participants);
      if (isTeacher && joinedId === teacherId) setIsTeacherConnected(true);
    });

    socket.on("teacherPeerId", ({ peerId }) => {
      setTeacherPeerId(peerId);
      if (peerRef.current) connectToTeacher(peerId);
    });

    socket.on("teacherStreamStarted", () => {
      setIsTeacherConnected(true);
      if (teacherPeerId && peerRef.current) connectToTeacher(teacherPeerId);
    });

    socket.on("teacherStreamStopped", () => {
      setIsTeacherConnected(false);
      setIsStreamActive(false);
      setConnectionStatus("disconnected");
      callRef.current?.close();
      callRef.current = null;
      toast.warning("Teacher stopped streaming");
    });

    socket.on("chatHistory", setChatMessages);
    socket.on("liveMessage", msg => setChatMessages(prev => [...prev, msg]));
    socket.on("error", err => toast.error(err.message));
    socket.on("disconnect", () => toast.info("Disconnected from server"));

    const peer = new Peer({
      host: "localhost",
      port: 9000,
      path: "/myapp",
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peerRef.current = peer;

    peer.on("open", id => {
      socket.emit("provideStudentPeerId", { liveClassId, peerId: id });
      if (teacherPeerId) connectToTeacher(teacherPeerId);
    });

    peer.on("call", call => {
      callRef.current = call;
      call.answer();
      call.on("stream", handleIncomingStream);
      call.on("close", () => {
        setIsStreamActive(false);
        setConnectionStatus("disconnected");
        callRef.current = null;
      });
      call.on("error", err => {
        toast.error("Call error: " + err.message);
        setIsStreamActive(false);
      });
    });

    peer.on("error", err => toast.error("PeerJS error: " + err.message));

    return () => {
      socket.emit("leaveLiveClass", { liveClassId });
      socket.disconnect();
      peer.destroy();
      callRef.current?.close();
    };
  }, [userId, teacherId, liveClassId, teacherPeerId, connectToTeacher, handleIncomingStream]);

  useEffect(() => {
    const cleanup = initializeWebRTCAndSocket();
    return () => cleanup?.();
  }, [initializeWebRTCAndSocket]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;
    socketRef.current.emit("sendLiveMessage", { liveClassId, message: newMessage.trim() });
    setNewMessage("");
  };

  const handleLeave = () => {
    socketRef.current?.emit("leaveLiveClass", { liveClassId });
    socketRef.current?.disconnect();
    peerRef.current?.destroy();
    window.location.href = `/search/${courseId}`;
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
            onClick={handleVideoClick}
          />
          {!isStreamActive && (
            <div className="absolute inset-0 flex items-center justify-center flex-col bg-gray-900 bg-opacity-75">
              <p className="text-xl mb-4">
                {!isTeacherConnected
                  ? "Waiting for teacher to start streaming..."
                  : connectionStatus === "connecting"
                  ? "Connecting to teacher's stream..."
                  : "Teacher has stopped streaming"}
              </p>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-4">
          <Button onClick={handleLeave} className="bg-red-600 hover:bg-red-700">
            Leave Class
          </Button>
          {isStreamActive && (
            <div className="ml-auto text-sm text-green-400 flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-400 mr-2" />
              Connected to stream
            </div>
          )}
        </div>
      </div>
      <div className="w-1/5 p-6 bg-gray-800 flex flex-col">
        <h2 className="text-lg font-semibold mb-2">Participants ({participants.length})</h2>
        <ScrollArea className="h-40 rounded-md border border-gray-700 p-2 mb-6">
          <ul className="space-y-2">
            {participants.map((p) => (
              <li key={p.userId} className="text-sm">
                {p.userName}{" "}
                {p.userId === userId
                  ? "(You)"
                  : p.userId === teacherId
                  ? "(Teacher)"
                  : ""}
              </li>
            ))}
          </ul>
        </ScrollArea>

        <h2 className="text-lg font-semibold mb-2">Live Chat</h2>
        <ScrollArea className="flex-1 rounded-md border border-gray-700 p-4 mb-4">
          {chatMessages.map((msg, i) => (
            <div key={i} className="text-sm mb-3">
              <span className="font-medium text-blue-300">{msg.senderName}:</span> {msg.message}
              <div className="text-xs text-gray-400 mt-1">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </ScrollArea>
        <div className="flex mt-auto gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <Button onClick={sendMessage} className="shrink-0">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
