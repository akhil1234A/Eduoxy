"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import SimplePeer from "simple-peer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LiveClassProps {
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

const LiveClass = ({ liveClassId, courseId, userId, teacherId }: LiveClassProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [userId: string]: SimplePeer.Instance }>({}); // Store peers

  const isTeacher = userId === teacherId;

  useEffect(() => {
    const socketInstance = io("http://localhost:8000", {
      query: { userId },
      path: "/socket.io/",
    });
    setSocket(socketInstance);

    // Teacher: Start media stream
    if (isTeacher) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((mediaStream) => {
          setStream(mediaStream);
          if (videoRef.current) videoRef.current.srcObject = mediaStream;
          console.log("Teacher stream initialized:", mediaStream);
        })
        .catch((err) => console.error("Teacher media error:", err));
    }

    socketInstance.on("userJoined", ({ userId: joinedUserId, participants: newParticipants }) => {
      setParticipants(newParticipants);
      if (isTeacher && joinedUserId !== userId && stream) {
        createPeer(joinedUserId, socketInstance);
      }
    });

    socketInstance.on("peerConnected", ({ peerId }) => {
      if (!isTeacher && peerId === teacherId) {
        console.log("Student received peerConnected from teacher:", peerId);
        addPeer(peerId, socketInstance);
      }
    });

    socketInstance.on("signal", ({ from, signal }) => {
      if (peersRef.current[from]) {
        peersRef.current[from].signal(signal);
      } else if (!isTeacher && from === teacherId) {
        addPeer(from, socketInstance, signal);
      }
    });


    socketInstance.on("userLeft", ({ participants: updatedParticipants }) => {
      setParticipants(updatedParticipants);
      if (peersRef.current[userId]) {
        peersRef.current[userId].destroy();
        delete peersRef.current[userId];
      }
    });

    socketInstance.on("chatHistory", (messages: ChatMessage[]) => {
      setChatMessages(messages);
    });

    socketInstance.on("liveMessage", (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socketInstance.on("error", (error: { message: string }) => {
      console.error("Socket error:", error.message);
    });

    socketInstance.emit("joinLiveClass", { liveClassId });

    return () => {
      socketInstance.emit("leaveLiveClass", { liveClassId });
      socketInstance.disconnect();
      if (stream) stream.getTracks().forEach((track) => track.stop());
      Object.values(peersRef.current).forEach((peer) => peer.destroy());
    };
  }, [liveClassId, userId, teacherId, isTeacher]);

  const createPeer = useCallback((peerId: string, socket: Socket) => {
    if (!stream) return;
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
    });

    peer.on("signal", (signal) => socket.emit("signal", { to: peerId, signal }));
    peer.on("error", (err) => console.error(`Peer error with ${peerId}:`, err));

    peersRef.current[peerId] = peer;
  }, [stream]);

  const addPeer = useCallback((peerId: string, socket: Socket, signal?: any) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      config: { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] },
    });

    peer.on("stream", (peerStream) => {
      if (videoRef.current) videoRef.current.srcObject = peerStream;
    });

    peer.on("signal", (signal) => socket.emit("signal", { to: peerId, signal }));
    peer.on("error", (err) => console.error(`Peer error with ${peerId}:`, err));

    if (signal) peer.signal(signal);
    peersRef.current[peerId] = peer;
  }, []);




  const startScreenShare = async () => {
    if (!isTeacher) return;
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      setStream(screenStream);
      if (videoRef.current) videoRef.current.srcObject = screenStream;
      Object.values(peersRef.current).forEach((peer) => peer.addStream(screenStream));
      setIsScreenSharing(true);
      screenStream.getVideoTracks()[0].onended = stopScreenShare;
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const stopScreenShare = async () => {
    if (!isTeacher) return;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setStream(mediaStream);
    if (videoRef.current) videoRef.current.srcObject = mediaStream;
    Object.values(peersRef.current).forEach((peer) => peer.addStream(mediaStream));
    setIsScreenSharing(false);
  };

  const toggleMute = () => {
    if (!isTeacher || !stream) return;
    stream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    setIsMuted((prev) => !prev);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;
    socket.emit("sendLiveMessage", { liveClassId, message: newMessage });
    setNewMessage("");
  };

  const handleLeave = () => {
    if (socket) {
      socket.emit("leaveLiveClass", { liveClassId });
      socket.disconnect();
    }
    if (stream) stream.getTracks().forEach((track) => track.stop());
    Object.values(peersRef.current).forEach((peer) => peer.destroy());
    window.location.href = `/course/${courseId}`;
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      {/* Video Area */}
      <div className="w-4/5 p-6 flex flex-col">
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted={isTeacher}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          {isTeacher && (
            <>
              <Button
                onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isScreenSharing ? "Stop Screen Share" : "Share Screen"}
              </Button>
              <Button
                onClick={toggleMute}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                {isMuted ? "Unmute" : "Mute"}
              </Button>
            </>
          )}
          <Button
            onClick={handleLeave}
            className="bg-red-600 hover:bg-red-700"
          >
            Leave Class
          </Button>
        </div>
      </div>

      {/* Sidebar: Participants and Chat */}
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
          <div className="space-y-4">
            {chatMessages.map((msg, index) => (
              <div key={index} className="text-sm">
                <span className="font-medium text-blue-300">{msg.senderName}:</span> {msg.message}
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-gray-700 border-gray-600 text-white focus:ring-blue-500"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} className="bg-green-600 hover:bg-green-700">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveClass;