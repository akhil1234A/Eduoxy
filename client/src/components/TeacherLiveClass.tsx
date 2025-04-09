"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface TeacherLiveClassProps {
  liveClassId: string;
  courseId: string;
  userId: string;
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

const TeacherLiveClass = ({ liveClassId, courseId, userId }: TeacherLiveClassProps) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isStreamActive, setIsStreamActive] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const initializeWebRTCAndSocket = useCallback(async () => {
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
      socket.emit("joinLiveClass", { liveClassId, isTeacher: true });
      toast.success("Connected to live class");
    });

    socket.on("userJoined", ({ participants: newParticipants }) => {
      setParticipants(newParticipants);
    });

    socket.on("chatHistory", (messages: ChatMessage[]) => setChatMessages(messages));
    socket.on("liveMessage", (message: ChatMessage) => setChatMessages(prev => [...prev, message]));

    socket.on("answer", async ({ userId: studentId, answer }: { userId: string; answer: RTCSessionDescriptionInit }) => {
      const pc = peerConnectionsRef.current.get(studentId);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      }
    });

    socket.on("iceCandidate", ({ userId: studentId, candidate }: { userId: string; candidate: RTCIceCandidateInit }) => {
      const pc = peerConnectionsRef.current.get(studentId);
      if (pc) {
        pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    });

    socket.on("error", (error: { message: string }) => toast.error(error.message));

    return () => {
      socket.emit("leaveLiveClass", { liveClassId });
      socket.disconnect();
      stopStream();
    };
  }, [liveClassId, userId]);

  useEffect(() => {
    initializeWebRTCAndSocket();
  }, [initializeWebRTCAndSocket]);

  const createPeerConnection = (studentId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
      ]
    });

    peerConnectionsRef.current.set(studentId, pc);

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
        console.log(`Added ${track.kind} track to peer connection for student ${studentId}`);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        console.log(`Sending ICE candidate to student ${studentId}`);
        socketRef.current.emit("iceCandidate", { liveClassId, userId: studentId, candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`Connection state changed for student ${studentId}:`, pc.connectionState);
      if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
        peerConnectionsRef.current.delete(studentId);
        toast.error(`Connection lost with student ${studentId}`);
      }
    };

    return pc;
  };

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      setIsStreamActive(true);
      if (socketRef.current) {
        socketRef.current.emit("teacherStartedStreaming", { liveClassId });
      }

      // Create peer connections for all students
      participants.forEach(participant => {
        if (participant.userId !== userId) {
          const pc = createPeerConnection(participant.userId);
          negotiateConnection(pc, participant.userId);
        }
      });

      toast.success("Stream started");
    } catch (error) {
      console.error("Failed to start stream:", error);
      toast.error("Failed to start stream: " + (error as Error).message);
    }
  };

  const negotiateConnection = async (pc: RTCPeerConnection, studentId: string) => {
    try {
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await pc.setLocalDescription(offer);
      
      console.log(`Sending offer to student ${studentId}`);
      if (socketRef.current) {
        socketRef.current.emit("offer", { liveClassId, userId: studentId, offer });
      }
    } catch (error) {
      console.error(`Failed to create offer for student ${studentId}:`, error);
      toast.error(`Failed to connect to student ${studentId}`);
    }
  };

  const startScreenShare = async () => {
    if (!isStreamActive) return toast.error("Please start streaming first");

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      localStreamRef.current = screenStream;
      if (videoRef.current) videoRef.current.srcObject = screenStream;

      peerConnectionsRef.current.forEach(async (pc, studentId) => {
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(videoTrack);
        await negotiateConnection(pc, studentId);
      });

      setIsScreenSharing(true);
      toast.success("Screen sharing started");

      screenStream.getVideoTracks()[0].onended = stopScreenShare;
    } catch (error) {
      toast.error("Failed to start screen sharing: " + (error as Error).message);
    }
  };

  const stopScreenShare = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = cameraStream;
      if (videoRef.current) videoRef.current.srcObject = cameraStream;

      peerConnectionsRef.current.forEach(async (pc, studentId) => {
        const videoTrack = cameraStream.getVideoTracks()[0];
        const sender = pc.getSenders().find(s => s.track?.kind === "video");
        if (sender) await sender.replaceTrack(videoTrack);
        await negotiateConnection(pc, studentId);
      });

      setIsScreenSharing(false);
      toast.success("Returned to camera view");
    } catch (error) {
      toast.error("Failed to stop screen sharing: " + (error as Error).message);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      toast.success(audioTrack.enabled ? "Microphone unmuted" : "Microphone muted");
    }
  };

  const stopStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
      localStreamRef.current = null;
    }

    // Close all peer connections
    peerConnectionsRef.current.forEach((pc, studentId) => {
      pc.close();
      console.log(`Closed peer connection with student ${studentId}`);
    });
    peerConnectionsRef.current.clear();

    setIsStreamActive(false);
    setIsScreenSharing(false);
    
    if (socketRef.current) {
      socketRef.current.emit("teacherDisconnected", { liveClassId });
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !socketRef.current) return;
    socketRef.current.emit("sendLiveMessage", { liveClassId, message: newMessage.trim() });
    setNewMessage("");
  };

  const handleLeave = () => {
    stopStream();
    if (socketRef.current) {
      socketRef.current.emit("leaveLiveClass", { liveClassId });
      socketRef.current.disconnect();
    }
    window.location.href = `/course/${courseId}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="w-4/5 p-6 flex flex-col">
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" style={{ minHeight: "300px" }} />
          {!isStreamActive && (
            <div className="absolute inset-0 flex items-center justify-center flex-col bg-gray-900 bg-opacity-75">
              <p className="text-xl mb-4">Click Start Streaming to begin</p>
              <Button onClick={startStream} className="bg-green-600 hover:bg-green-700">Start Streaming</Button>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-4">
          {isStreamActive ? (
            <>
              <Button onClick={stopStream} className="bg-red-600 hover:bg-red-700">Stop Streaming</Button>
              <Button onClick={isScreenSharing ? stopScreenShare : startScreenShare} className="bg-blue-600 hover:bg-blue-700">
                {isScreenSharing ? "Stop Screen Share" : "Share Screen"}
              </Button>
              <Button onClick={toggleMute} className="bg-yellow-600 hover:bg-yellow-700">{isMuted ? "Unmute" : "Mute"}</Button>
            </>
          ) : (
            <Button onClick={startStream} className="bg-green-600 hover:bg-green-700">Start Streaming</Button>
          )}
          <Button onClick={handleLeave} className="bg-red-600 hover:bg-red-700">Leave Class</Button>
        </div>
      </div>
      <div className="w-1/5 p-6 bg-gray-800 flex flex-col">
        <h2 className="text-lg font-semibold mb-2">Participants ({participants.length})</h2>
        <ScrollArea className="h-40 rounded-md border border-gray-700 p-2 mb-6">
          <ul className="space-y-2">
            {participants.map((p) => (
              <li key={p.userId} className="text-sm">
                {p.userName} {p.userId === userId ? "(You)" : ""}
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

export default TeacherLiveClass;