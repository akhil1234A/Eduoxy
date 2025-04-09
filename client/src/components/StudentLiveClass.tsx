"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
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

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const initializeWebRTCAndSocket = useCallback(async () => {
    // Initialize Socket.IO
    const socket = io("http://localhost:8000", {
      query: { userId },
      path: "/socket.io/",
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinLiveClass", { liveClassId, isTeacher: false });
      toast.success("Connected to live class");
    });

    socket.on("userJoined", ({ userId: joinedUserId, participants: newParticipants, isTeacher }) => {
      setParticipants(newParticipants);
      if (isTeacher && joinedUserId === teacherId) setIsTeacherConnected(true);
    });

    socket.on("teacherStreamStarted", () => {
      setIsTeacherConnected(true);
      startWebRTCConnection();
    });

    socket.on("teacherDisconnected", () => {
      setIsTeacherConnected(false);
      setIsStreamActive(false);
      cleanupWebRTC();
    });

    socket.on("chatHistory", (messages: ChatMessage[]) => setChatMessages(messages));
    socket.on("liveMessage", (message: ChatMessage) => setChatMessages(prev => [...prev, message]));

    socket.on("offer", async (offer: RTCSessionDescriptionInit) => {
      if (!peerConnectionRef.current) {
        await createPeerConnection();
      }
      await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnectionRef.current!.createAnswer();
      await peerConnectionRef.current!.setLocalDescription(answer);
      socket.emit("answer", { liveClassId, answer });
    });

    socket.on("iceCandidate", (candidate: RTCIceCandidateInit) => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("error", (error: { message: string }) => toast.error(error.message));
    socket.on("disconnect", () => toast.info("Disconnected from server"));

    return () => {
      socket.emit("leaveLiveClass", { liveClassId });
      socket.disconnect();
      cleanupWebRTC();
    };
  }, [liveClassId, userId, teacherId]);

  useEffect(() => {
    initializeWebRTCAndSocket();

    return () => {
      cleanupWebRTC();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [initializeWebRTCAndSocket]);

  const createPeerConnection = async () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      console.log("Received track:", event.track.kind);
      if (videoRef.current) {
        videoRef.current.srcObject = event.streams[0];
        setIsStreamActive(true);
        setIsTeacherConnected(true);
        toast.success("Teacher's stream connected");
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log("Sending ICE candidate to teacher");
        socketRef.current.emit("iceCandidate", { liveClassId, userId: teacherId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Connection state changed:", pc.connectionState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        setIsStreamActive(false);
        toast.error("Stream disconnected");
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log("ICE connection state changed:", pc.iceConnectionState);
    };
  };

  const startWebRTCConnection = async () => {
    if (!peerConnectionRef.current) {
      await createPeerConnection();
    }
  };

  const cleanupWebRTC = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreamActive(false);
  };

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
    cleanupWebRTC();
    window.location.href = `/course/${courseId}`;
  };

  // Handle incoming offer
  useEffect(() => {
    if (!socketRef.current) return;

    const handleOffer = async (offer: RTCSessionDescriptionInit) => {
      try {
        if (!peerConnectionRef.current) {
          await createPeerConnection();
        }

        const pc = peerConnectionRef.current;
        if (!pc) {
          console.error("Failed to create peer connection");
          return;
        }

        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        console.log("Sending answer to teacher");
        socketRef.current?.emit("answer", { liveClassId, userId: teacherId, answer });
      } catch (error) {
        console.error("Failed to handle offer:", error);
        toast.error("Failed to connect to teacher's stream");
      }
    };

    socketRef.current.on("offer", handleOffer);
    return () => {
      socketRef.current?.off("offer", handleOffer);
    };
  }, [liveClassId, teacherId]);

  // Handle incoming ICE candidates
  useEffect(() => {
    if (!socketRef.current) return;

    const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Added ICE candidate from teacher");
        }
      } catch (error) {
        console.error("Failed to add ICE candidate:", error);
      }
    };

    socketRef.current.on("iceCandidate", handleIceCandidate);
    return () => {
      socketRef.current?.off("iceCandidate", handleIceCandidate);
    };
  }, []);

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