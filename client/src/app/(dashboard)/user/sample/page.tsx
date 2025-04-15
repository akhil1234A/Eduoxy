"use client";

import { useState, useEffect, useRef } from "react";
import Peer, { type MediaConnection } from "peerjs";

const StudentLiveClass = () => {
  const [teacherPeerId, setTeacherPeerId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const peerRef = useRef<Peer | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const callRef = useRef<MediaConnection | null>(null); 
  const localStreamRef = useRef<MediaStream | null>(null);

  const playVideo = async (videoElement: HTMLVideoElement | null) => {
    if (!videoElement) return;

    try {
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsVideoPlaying(true);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Error playing video:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.log('Autoplay blocked, waiting for user interaction');
      }
    }
  };

  useEffect(() => {
    peerRef.current = new Peer({
      host: `${process.env.NEXT_PUBLIC_HOST}`,
      port: 9000,
      path: "/myapp",
      debug: 3,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" }
        ],
        iceTransportPolicy: "all",
        iceCandidatePoolSize: 0
      }
    });

    peerRef.current.on("open", (id) => {
      console.log(`Student PeerJS ID: ${id}`);
    });

    peerRef.current.on("connection", (conn) => {
      console.log("New connection established:", conn.peer);
    });

    peerRef.current.on("error", (err) => {
      console.error("PeerJS error:", err);
      setIsConnected(false);
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if(callRef.current){
        callRef.current.close();
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, []);

  const connectToTeacher = () => {
    if (!peerRef.current || !teacherPeerId){
      console.error("Missing peer or teacher ID");
      return;
    }

    console.log(`Connecting to teacher with ID: ${teacherPeerId}`);
    const stream = new MediaStream();
    localStreamRef.current = stream;
    const call = peerRef.current.call(teacherPeerId, stream);
    callRef.current = call;

    call.on("stream", (remoteStream) => {
      console.log("Received teacher's stream:", {
        active: remoteStream.active,
        tracks: remoteStream.getTracks().map(t => ({
          kind: t.kind,
          enabled: t.enabled,
          muted: t.muted,
        })),
      });
      if (videoRef.current) {
        videoRef.current.srcObject = remoteStream;
        playVideo(videoRef.current);
      }
    });

    call.on("iceStateChanged", (state) => {
      console.log("ICE connection state changed:", state);
    });

    call.on("error", (err) => {
      console.error("Call error:", err);
      setIsConnected(false);
    });

    call.on("close", () => {
      console.log("Call closed");
      setIsConnected(false);
    });
  };

  const handleVideoClick = () => {
    if (videoRef.current && !isVideoPlaying) {
      playVideo(videoRef.current);
    }
  };

  return (
    <div style={{ 
      padding: '20px',
      color: 'white',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#fff', marginBottom: '20px' }}>Student</h1>
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        onClick={handleVideoClick} 
        style={{ 
          width: '100%',
          maxWidth: '500px',
          backgroundColor: '#333',
          borderRadius: '8px',
          marginBottom: '20px',
          cursor: !isVideoPlaying ? 'pointer' : 'default'
        }} 
      />
      {!isVideoPlaying && (
        <p style={{ color: '#ff9800', marginBottom: '20px' }}>Click video to start playback</p>
      )}
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={teacherPeerId}
          onChange={(e) => setTeacherPeerId(e.target.value)}
          placeholder="Enter Teacher Peer ID"
          style={{
            padding: '8px',
            marginRight: '10px',
            backgroundColor: '#333',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '4px'
          }}
        />
        <button 
          onClick={connectToTeacher} 
          disabled={!teacherPeerId}
          style={{
            padding: '8px 16px',
            backgroundColor: !teacherPeerId ? '#666' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: !teacherPeerId ? 'not-allowed' : 'pointer'
          }}
        >
          Connect to Teacher
        </button>
        <p style={{ color: '#fff', marginTop: '10px' }}>
          Status: {isConnected ? "Connected" : "Disconnected"}
        </p>
        <p style={{ color: '#fff' }}>
          Your Peer ID: {peerRef.current?.id || "Not connected"}
        </p>
      </div>
    </div>
  );
};

export default StudentLiveClass;