// app/live/[roomId]/teacher/page.tsx
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";

// Define types for WebRTC events
interface AnswerEvent {
  answer: RTCSessionDescriptionInit;
}

interface IceCandidateEvent {
  candidate: RTCIceCandidateInit;
}

// Use a static room ID for testing
const STATIC_ROOM_ID = "test-room-123";

export default function TeacherStream() {
  // Use static room ID instead of extracting from params
  const roomId = STATIC_ROOM_ID;
  const videoRef = useRef<HTMLVideoElement>(null);
  const socket = useRef<Socket | null>(null);
  const peer = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>("Initializing...");
  const [error, setError] = useState<string | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [studentReady, setStudentReady] = useState(false);
  const [offerSent, setOfferSent] = useState(false);

  // Function to create and send an offer
  const createAndSendOffer = useCallback(async () => {
    if (!peer.current || !socket.current || !isSocketConnected) {
      console.log("Cannot create offer: peer or socket not ready");
      return;
    }

    try {
      setConnectionStatus("Creating offer...");
      const offer = await peer.current.createOffer();
      await peer.current.setLocalDescription(offer);
      
      console.log("Sending offer to room:", roomId);
      socket.current.emit("offer", { offer, roomId });
      setOfferSent(true);
      setConnectionStatus("Offer sent, waiting for answer...");
    } catch (err) {
      console.error("Error creating offer:", err);
      setError(`Offer error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [roomId, isSocketConnected]);

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peer.current) {
      peer.current.close();
    }

    peer.current = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" }
      ],
    });

    // Add all tracks to the peer connection if stream is available
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => {
        if (peer.current) {
          peer.current.addTrack(track, localStream.current!);
        }
      });
    }

    // Handle ICE candidates
    peer.current.onicecandidate = e => {
      if (e.candidate && socket.current) {
        console.log("Sending ICE candidate");
        socket.current.emit("ice-candidate", { candidate: e.candidate, roomId });
      }
    };

    // Handle connection state changes
    peer.current.onconnectionstatechange = () => {
      console.log("Connection state:", peer.current?.connectionState);
      setConnectionStatus(`Connection state: ${peer.current?.connectionState}`);
      
      // Handle failed connections
      if (peer.current?.connectionState === "failed" || peer.current?.connectionState === "disconnected") {
        setError("Connection failed. Preparing to reconnect...");
        // Wait briefly and try to renegotiate if student is ready
        setTimeout(() => {
          if (studentReady) {
            initializePeerConnection();
            createAndSendOffer();
          }
        }, 2000);
      }
    };

    // Handle ICE connection state changes
    peer.current.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peer.current?.iceConnectionState);
      
      if (peer.current?.iceConnectionState === "failed") {
        console.log("ICE connection failed, restarting ICE");
        peer.current.restartIce();
      }
    };

  }, [roomId, studentReady, createAndSendOffer]);

  // Setup media stream
  const setupMediaStream = useCallback(async () => {
    try {
      setConnectionStatus("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStream.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setConnectionStatus("Camera access granted");
      }

      return true;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      setError(`Camera error: ${err instanceof Error ? err.message : String(err)}`);
      return false;
    }
  }, []);

  useEffect(() => {
    const setupConnection = async () => {
      // Connect to socket server
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";
      console.log("Connecting to socket server:", socketUrl);
      
      // Use a persistent teacher ID from localStorage or generate a new one
      let teacherId = localStorage.getItem('teacherId');
      if (!teacherId) {
        teacherId = `teacher-${Math.random().toString(36).substring(2, 9)}`;
        localStorage.setItem('teacherId', teacherId);
      }
      console.log("Using teacher ID:", teacherId);
      
      socket.current = io(socketUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        query: { userId: teacherId } // Add userId to prevent server disconnection
      });

      // Socket connection events
      socket.current.on("connect", async () => {
        console.log("Socket connected with ID:", socket.current?.id);
        setConnectionStatus("Connected to signaling server");
        setIsSocketConnected(true);
        
        // Join the room immediately after connection
        socket.current?.emit("joinRoom", { roomId });
        
        // Setup media stream if not already done
        if (!localStream.current) {
          const success = await setupMediaStream();
          if (success) {
            initializePeerConnection();
          }
        } else {
          initializePeerConnection();
        }
      });

      socket.current.on("connect_error", (err) => {
        console.error("Socket connection error:", err);
        setError(`Connection error: ${err.message}`);
        setConnectionStatus("Connection failed");
        setIsSocketConnected(false);
      });

      socket.current.on("disconnect", () => {
        console.log("Socket disconnected");
        setConnectionStatus("Disconnected from server");
        setIsSocketConnected(false);
        setStudentReady(false);
      });

      // Handle student ready event
      socket.current.on("student-ready", () => {
        console.log("Student is ready to receive stream");
        setStudentReady(true);
        
        // If student just joined and we haven't sent an offer yet, do it now
        if (!offerSent) {
          createAndSendOffer();
        }
      });

      // Handle student request for offer (in case they missed it)
      socket.current.on("request-offer", () => {
        console.log("Student requested an offer");
        createAndSendOffer();
      });

      // Handle answer from student
      socket.current.on("answer", async ({ answer }: AnswerEvent) => {
        try {
          console.log("Received answer from student");
          setConnectionStatus("Received answer, setting remote description...");
          
          if (peer.current && peer.current.signalingState !== "closed") {
            await peer.current.setRemoteDescription(new RTCSessionDescription(answer));
            setConnectionStatus("Remote description set, connection established");
          } else {
            console.log("Peer connection not available for setting remote description");
            // Re-initialize and try again
            initializePeerConnection();
            await peer.current?.setRemoteDescription(new RTCSessionDescription(answer));
          }
        } catch (err) {
          console.error("Error setting remote description:", err);
          setError(`Answer error: ${err instanceof Error ? err.message : String(err)}`);
        }
      });

      // Handle ICE candidates from student
      socket.current.on("ice-candidate", ({ candidate }: IceCandidateEvent) => {
        try {
          console.log("Received ICE candidate from student");
          if (peer.current && peer.current.remoteDescription) {
            peer.current.addIceCandidate(new RTCIceCandidate(candidate))
              .catch(err => console.error("Error adding ICE candidate:", err));
          } else {
            console.log("Cannot add ICE candidate: peer not ready or no remote description");
          }
        } catch (err) {
          console.error("Error handling ICE candidate:", err);
        }
      });
    };

    // Setup connection only once when component mounts
    setupConnection();

    // Attempt to reconnect every 5 seconds if socket disconnects
    const reconnectInterval = setInterval(() => {
      if (!isSocketConnected && socket.current) {
        console.log("Attempting to reconnect...");
        socket.current.connect();
      }
    }, 5000);

    return () => {
      console.log("Cleaning up resources");
      clearInterval(reconnectInterval);
      
      if (localStream.current) {
        localStream.current.getTracks().forEach(track => track.stop());
      }
      
      if (peer.current) {
        peer.current.close();
      }
      
      if (socket.current) {
        socket.current.disconnect();
      }
    };
  }, []);

  // Separate useEffect for handling student ready status
  useEffect(() => {
    if (studentReady && isSocketConnected && !offerSent) {
      createAndSendOffer();
    }
  }, [studentReady, isSocketConnected, offerSent, createAndSendOffer]);

  const handleRetryConnection = () => {
    setError(null);
    setOfferSent(false);
    
    if (socket.current) {
      // Rejoin the room
      socket.current.emit("joinRoom", { roomId });
      
      // If we're connected and have a stream, reinitialize and send offer
      if (isSocketConnected && localStream.current) {
        initializePeerConnection();
        createAndSendOffer();
      } else if (!isSocketConnected) {
        // Try reconnecting socket
        socket.current.connect();
      }
    }
  };

  return (
    <div className="flex flex-col items-center p-6">
      <h2 className="text-2xl font-semibold mb-4">📡 Teacher Live Stream</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 w-full max-w-3xl">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
          <button 
            onClick={handleRetryConnection}
            className="mt-2 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Retry Connection
          </button>
        </div>
      )}
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 w-full max-w-3xl">
        <p className="font-bold">Status:</p>
        <p>{connectionStatus}</p>
        <p className="mt-1"><strong>Student:</strong> {studentReady ? "Ready to receive" : "Not connected"}</p>
      </div>
      <video 
        ref={videoRef} 
        autoPlay 
        muted 
        playsInline 
        className="w-full max-w-3xl rounded-xl shadow-lg" 
      />
    </div>
  );
}