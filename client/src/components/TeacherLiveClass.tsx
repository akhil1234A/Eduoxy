"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import Peer, { MediaConnection } from "peerjs";
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
  const [isStreamActive, setIsStreamActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'streaming'>('idle');
  const [showPeerId, setShowPeerId] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const callsRef = useRef<Map<string, MediaConnection>>(new Map());

  const initializeWebRTCAndSocket = useCallback(async () => {
    const socket = io("http://localhost:8000", {
      query: { userId },
      path: "/socket.io/",
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected");
      socket.emit("joinLiveClass", { liveClassId, isTeacher: true });
      toast.success("Connected to live class");
    });

    socket.on("userJoined", ({ userId: joinedUserId, participants: newParticipants, isTeacher }) => {
      console.log(`User joined: ${joinedUserId}, isTeacher: ${isTeacher}`);
      setParticipants(newParticipants);
    });

    socket.on("userLeft", ({ userId: leftUserId, isTeacher, participants: updatedParticipants }) => {
      console.log(`User left: ${leftUserId}, isTeacher: ${isTeacher}`);
      setParticipants(updatedParticipants);
      
      if (!isTeacher && callsRef.current.has(leftUserId)) {
        callsRef.current.get(leftUserId)?.close();
        callsRef.current.delete(leftUserId);
      }
    });

    socket.on("chatHistory", (messages: ChatMessage[]) => setChatMessages(messages));
    socket.on("liveMessage", (message: ChatMessage) => setChatMessages(prev => [...prev, message]));

    socket.on("error", (error: { message: string }) => toast.error(error.message));

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

    peerRef.current.on('open', (id) => {
      console.log(`Teacher PeerJS ID: ${id}`);
      if (socketRef.current) {
        socketRef.current.emit("providePeerId", { liveClassId, peerId: id });
        console.log("Emitted teacher PeerID to server");
      }
    });

    peerRef.current.on('call', (call) => {
      console.log('Received call from student:', call.peer);
      console.log('Call metadata:', call.metadata);
      
      if (localStreamRef.current && localStreamRef.current.active) {
        console.log('Answering call with local stream, ensuring unmute');
        localStreamRef.current.getAudioTracks().forEach(track => track.enabled = true);
        localStreamRef.current.getVideoTracks().forEach(track => track.enabled = true);

        call.answer(localStreamRef.current);
        callsRef.current.set(call.peer, call);

        call.on('stream', (remoteStream) => {
          console.log('Received student stream (if any):', {
            active: remoteStream.active,
            id: remoteStream.id,
            tracks: remoteStream.getTracks().map(t => ({
              kind: t.kind,
              enabled: t.enabled,
              muted: t.muted,
              readyState: t.readyState,
            })),
          });
        });

        call.on('close', () => {
          console.log('Call closed with student:', call.peer);
          callsRef.current.delete(call.peer);
        });

        call.on('error', (err) => {
          console.error('Call error:', err);
          callsRef.current.delete(call.peer);
          toast.error("Failed to maintain call with student: " + err.message);
        });
      } else {
        console.log('No active local stream available, rejecting call');
        call.close();
        toast.error("Teacher is not streaming yet.");
      }
    });

    peerRef.current.on('error', (err) => {
      console.error("PeerJS error:", err);
      toast.error("PeerJS error: " + err.message);
      setConnectionStatus('idle');
    });

    return () => {
      socket.emit("leaveLiveClass", { liveClassId });
      socket.disconnect();
      stopStream();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveClassId, userId]);

  useEffect(() => {
    initializeWebRTCAndSocket();
  }, [initializeWebRTCAndSocket]);

  const startStream = async () => {
    try {
      setConnectionStatus('connecting');
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      console.log('Local stream details:', {
        active: stream.active,
        id: stream.id,
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length,
        tracks: stream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          muted: t.muted,
          readyState: t.readyState,
        })),
      });

      if (stream.getVideoTracks().length === 0 || stream.getAudioTracks().length === 0) {
        throw new Error("No video or audio tracks available");
      }

      stream.getAudioTracks().forEach(track => track.enabled = true);
      stream.getVideoTracks().forEach(track => track.enabled = true);

      localStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => {
          console.error("Video play error:", err);
          toast.error("Failed to play video: " + err.message);
        });
      }

      setIsStreamActive(true);
      setConnectionStatus('streaming');
      toast.success("Stream started");

      // Notify all students that streaming has started
      if (socketRef.current) {
        socketRef.current.emit("teacherStreamStarted", { liveClassId });
      }
    } catch (error) {
      console.error("Failed to start stream:", error);
      toast.error("Failed to start stream: " + (error as Error).message);
      setConnectionStatus('idle');
    }
  };

  const stopStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    callsRef.current.forEach(call => call.close());
    callsRef.current.clear();

    setIsStreamActive(false);
    setIsScreenSharing(false);
    setIsMuted(false);
    setIsVideoOff(false);
    setConnectionStatus('idle');

    if (socketRef.current) {
      socketRef.current.emit("teacherStreamStopped", { liveClassId });
    }

    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = new Peer({
        host: 'localhost',
        port: 9000,
        path: '/myapp',
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
    }
  };

  const toggleScreenShare = async () => {
    if (!isStreamActive) {
      toast.error("Start streaming first!");
      return;
    }

    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        localStreamRef.current?.getVideoTracks()[0].stop();
        localStreamRef.current = screenStream;

        callsRef.current.forEach((call) => {
          const videoSender = call.peerConnection.getSenders().find((s: RTCRtpSender) => s.track?.kind === "video");
          videoSender?.replaceTrack(screenStream.getVideoTracks()[0]);
        });

        if (videoRef.current) videoRef.current.srcObject = screenStream;
        setIsScreenSharing(true);
        toast.success("Screen sharing started");

        screenStream.getVideoTracks()[0].onended = () => toggleScreenShare();
      } else {
        const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current?.getTracks().forEach(track => track.stop());
        localStreamRef.current = cameraStream;

        callsRef.current.forEach((call) => {
          const videoSender = call.peerConnection.getSenders().find((s: RTCRtpSender) => s.track?.kind === "video");
          videoSender?.replaceTrack(cameraStream.getVideoTracks()[0]);
        });

        if (videoRef.current) videoRef.current.srcObject = cameraStream;
        setIsScreenSharing(false);
        toast.success("Returned to camera");
      }
    } catch (error) {
      console.error("Screen share error:", error);
      toast.error("Failed to toggle screen share: " + (error as Error).message);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
      toast.success(audioTrack.enabled ? "Unmuted" : "Muted");

      callsRef.current.forEach((call) => {
        const audioSender = call.peerConnection.getSenders().find((s: RTCRtpSender) => s.track?.kind === "audio");
        if (audioSender && localStreamRef.current) {
          audioSender.replaceTrack(localStreamRef.current.getAudioTracks()[0]);
        }
      });
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoOff(!videoTrack.enabled);
      toast.success(videoTrack.enabled ? "Video on" : "Video off");

      callsRef.current.forEach((call) => {
        const videoSender = call.peerConnection.getSenders().find((s: RTCRtpSender) => s.track?.kind === "video");
        videoSender?.replaceTrack(videoTrack);
      });
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
    window.location.href = `/search/${courseId}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <div className="w-4/5 p-6 flex flex-col">
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" style={{ minHeight: "300px" }} />
          {!isStreamActive && (
            <div className="absolute inset-0 flex items-center justify-center flex-col bg-gray-900 bg-opacity-75">
              {connectionStatus === 'idle' ? (
                <p className="text-xl mb-4">Click Start Streaming to begin</p>
              ) : connectionStatus === 'connecting' ? (
                <p className="text-xl mb-4">Starting stream...</p>
              ) : null}
              <Button onClick={startStream} className="bg-green-600 hover:bg-green-700">Start Streaming</Button>
            </div>
          )}
        </div>
        <div className="mt-4 flex gap-4 flex-wrap">
          {isStreamActive ? (
            <>
              <Button onClick={stopStream} className="bg-red-600 hover:bg-red-700">Stop Streaming</Button>
              <Button onClick={toggleScreenShare} className="bg-blue-600 hover:bg-blue-700">
                {isScreenSharing ? "Stop Screen Share" : "Share Screen"}
              </Button>
              <Button onClick={toggleMute} className="bg-yellow-600 hover:bg-yellow-700">
                {isMuted ? "Unmute" : "Mute"}
              </Button>
              <Button onClick={toggleVideo} className="bg-purple-600 hover:bg-purple-700">
                {isVideoOff ? "Turn Video On" : "Turn Video Off"}
              </Button>
            </>
          ) : (
            <Button onClick={startStream} className="bg-green-600 hover:bg-green-700">Start Streaming</Button>
          )}
          <Button onClick={handleLeave} className="bg-red-600 hover:bg-red-700">Leave Class</Button>
          <Button 
            onClick={() => setShowPeerId(!showPeerId)} 
            className="bg-gray-600 hover:bg-gray-700"
          >
            {showPeerId ? "Hide Peer ID" : "Show Peer ID"}
          </Button>
        </div>
        
        {showPeerId && peerRef.current && (
          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Your PeerJS ID (For Debugging)</h3>
            <div className="flex gap-2 mb-2">
              <Input
                value={peerRef.current.id || "Not connected"}
                readOnly
                className="flex-1 bg-gray-700 border-gray-600 text-white"
              />
              <Button 
                onClick={() => {
                  if (peerRef.current?.id) {
                    navigator.clipboard.writeText(peerRef.current.id);
                    toast.success("Peer ID copied to clipboard");
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Copy
              </Button>
            </div>
          </div>
        )}
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