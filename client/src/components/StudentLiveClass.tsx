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
  const [isTeacherConnected, setIsTeacherConnected] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("disconnected");
  const [teacherPeerId, setTeacherPeerId] = useState<string | null>(null);

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
      console.log("Socket connected");
      socket.emit("joinLiveClass", { liveClassId, isTeacher: false });
      toast.success("Connected to live class");
    });

    socket.on("userJoined", ({ userId: joinedUserId, participants: newParticipants, isTeacher }) => {
      console.log(`User joined: ${joinedUserId}, isTeacher: ${isTeacher}`);
      setParticipants(newParticipants);
      if (isTeacher && joinedUserId === teacherId) {
        setIsTeacherConnected(true);
      }
    });

    socket.on("teacherPeerId", ({ peerId }) => {
      console.log(`Received teacher PeerJS ID: ${peerId}`);
      setTeacherPeerId(peerId);
      if (peerRef.current && peerId) {
        connectToTeacher(peerId);
      }
    });

    socket.on("teacherStreamStarted", () => {
      console.log("Teacher started streaming");
      setIsTeacherConnected(true);
      if (teacherPeerId && peerRef.current) {
        connectToTeacher(teacherPeerId);
      }
    });

    socket.on("teacherStreamStopped", () => {
      console.log("Teacher stopped streaming");
      setIsTeacherConnected(false);
      setIsStreamActive(false);
      setConnectionStatus("disconnected");
      if (callRef.current) {
        callRef.current.close();
        callRef.current = null;
      }
      toast.warning("Teacher stopped streaming");
    });

    socket.on("chatHistory", (messages: ChatMessage[]) => setChatMessages(messages));
    socket.on("liveMessage", (message: ChatMessage) => setChatMessages(prev => [...prev, message]));

    socket.on("error", (error: { message: string }) => toast.error(error.message));
    socket.on("disconnect", () => toast.info("Disconnected from server"));

    peerRef.current = new Peer({
      host: 'localhost',
      port: 9000,
      path: '/myapp',
      debug: 3,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
          { urls: "stun:stun2.l.google.com:19302" },
          { urls: "stun:stun3.l.google.com:19302" },
          { urls: "stun:stun4.l.google.com:19302" },
        ],
      },
    });

    peerRef.current.on("open", (id) => {
      console.log(`Student PeerJS ID: ${id}`);
      socket.emit("provideStudentPeerId", { liveClassId, peerId: id });
      if (teacherPeerId) {
        connectToTeacher(teacherPeerId);
      }
    });

    peerRef.current.on("call", (call) => {
      console.log(`Student ${userId} received call from teacher`);
      console.log("Call details:", {
        peer: call.peer,
        metadata: call.metadata,
        connectionState: call.peerConnection ? call.peerConnection.connectionState : "unavailable",
      });

      callRef.current = call;
      call.answer();

      call.on("stream", (remoteStream) => {
        console.log("Received teacher's stream", {
          active: remoteStream.active,
          id: remoteStream.id,
          tracks: remoteStream.getTracks().map(t => ({
            kind: t.kind,
            enabled: t.enabled,
            muted: t.muted,
            readyState: t.readyState,
          })),
        });
        handleIncomingStream(remoteStream);
      });

      call.on("error", (err) => {
        console.error("Call error:", err);
        toast.error("Failed to connect to stream: " + err.message);
        setIsStreamActive(false);
        setConnectionStatus("disconnected");
      });

      call.on("close", () => {
        console.log("Call closed");
        setIsStreamActive(false);
        setConnectionStatus("disconnected");
        callRef.current = null;
      });
    });

    peerRef.current.on("error", (err) => {
      console.error("PeerJS error:", err);
      toast.error("PeerJS error: " + err.message);
      setConnectionStatus("disconnected");
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
  }, [liveClassId, userId, teacherId, teacherPeerId]);

  const handleIncomingStream = useCallback((stream: MediaStream) => {
    if (videoRef.current) {
      if (videoRef.current.srcObject) {
        const oldStream = videoRef.current.srcObject as MediaStream;
        oldStream.getTracks().forEach(track => track.stop());
      }

      videoRef.current.srcObject = stream;
      videoRef.current.autoplay = true;
      videoRef.current.muted = false;

      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().then(() => {
          console.log("Video playback started successfully");
          setIsStreamActive(true);
          setConnectionStatus("connected");
          toast.success("Connected to teacher's stream");
        }).catch(err => {
          console.error("Video play error:", err);
          if (err.name === "NotAllowedError" || err.name === "AbortError") {
            toast.error("Autoplay blocked. Please click the video to start playback.");
            videoRef.current?.addEventListener('click', handleVideoClick, { once: true });
          } else {
            toast.error("Failed to play video: " + err.message);
          }
        });
      };

      stream.getAudioTracks().forEach(track => {
        if (track.muted) {
          track.muted = false;
          console.log("Unmuted audio track");
        }
      });
      stream.getVideoTracks().forEach(track => {
        if (track.muted) {
          track.muted = false;
          console.log("Unmuted video track");
        }
      });

      setTimeout(() => {
        if (videoRef.current && videoRef.current.paused) {
          toast.error("Video playback failed. Click the video to start manually.");
        }
      }, 5000);
    }
  }, []);

  const connectToTeacher = useCallback((teacherPeerId: string) => {
    if (!peerRef.current) return;

    console.log(`Connecting to teacher with PeerJS ID: ${teacherPeerId}`);
    setConnectionStatus("connected");
    setIsTeacherConnected(true);

    if (callRef.current) {
      callRef.current.close();
    }

    const call = peerRef.current.call(teacherPeerId, new MediaStream());
    callRef.current = call;

    call.on("stream", (remoteStream) => {
      console.log("Received teacher's stream from outgoing call", {
        active: remoteStream.active,
        id: remoteStream.id,
        tracks: remoteStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
        })),
      });
      handleIncomingStream(remoteStream);
    });

    call.on("error", (err) => {
      console.error("Call error:", err);
      toast.error("Failed to connect to teacher: " + err.message);
      setConnectionStatus("disconnected");
    });

    call.on("close", () => {
      console.log("Call closed");
      setIsStreamActive(false);
      setConnectionStatus("disconnected");
    });
  }, [handleIncomingStream]);

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
    window.location.href = `/search/${courseId}`;
  };

  const handleVideoClick = () => {
    if (videoRef.current && videoRef.current.paused && videoRef.current.srcObject) {
      videoRef.current.play().then(() => {
        console.log("Video playback started by user interaction");
        setIsStreamActive(true);
        setConnectionStatus("connected");
        toast.success("Stream started manually");
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getAudioTracks().forEach(track => track.enabled = true);
        stream.getVideoTracks().forEach(track => track.enabled = true);
      }).catch(err => {
        console.error("Video play error after click:", err);
        toast.error("Failed to play video: " + err.message);
      });
    }
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
            onError={(e) => console.error("Video element error:", e)}
          />
          {!isStreamActive && (
            <div className="absolute inset-0 flex items-center justify-center flex-col bg-gray-900 bg-opacity-75">
              {!isTeacherConnected ? (
                <p className="text-xl mb-4">Waiting for teacher to start streaming...</p>
              ) : connectionStatus === "connecting" ? (
                <p className="text-xl mb-4">Connecting to teacher's stream...</p>
              ) : (
                <p className="text-xl mb-4">Teacher has stopped streaming</p>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-4">
          <Button onClick={handleLeave} className="bg-red-600 hover:bg-red-700">
            Leave Class
          </Button>
          {isStreamActive && (
            <div className="ml-auto text-sm text-green-400 flex items-center">
              <span className="h-2 w-2 rounded-full bg-green-400 mr-2"></span>
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
                {p.userName} {p.userId === userId ? "(You)" : p.userId === teacherId ? "(Teacher)" : ""}
              </li>
            ))}
          </ul>
        </ScrollArea>
        <h2 className="text-lg font-semibold mb-2">Live Chat</h2>
        <ScrollArea className="flex-1 rounded-md border border-gray-700 p-4 mb-4">
          {chatMessages.map((msg, i) => (
            <div key={i} className="text-sm mb-3">
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
          <Button onClick={sendMessage} className="bg-green-600 hover:bg-green-700">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StudentLiveClass;