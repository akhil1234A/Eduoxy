"use client";

import { useEffect, useRef, useState, useCallback } from "react"
import io, { type Socket } from "socket.io-client"
import LiveClassChat from "./LiveClassChat"
import { useRouter } from "next/navigation"

// Define types for WebRTC events
interface OfferEvent {
  offer: RTCSessionDescriptionInit
}

interface IceCandidateEvent {
  candidate: RTCIceCandidateInit
}

// Props interface for the component
interface StudentLiveClassProps {
  liveClassId: string
  userId: string
  courseId: string
}

export default function StudentLiveClass({ liveClassId, userId, courseId }: StudentLiveClassProps) {
  const router = useRouter()
  const roomId = liveClassId // Use liveClassId as the room ID
  const videoRef = useRef<HTMLVideoElement>(null)
  const socket = useRef<Socket | null>(null)
  const peer = useRef<RTCPeerConnection | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<string>("Initializing...")
  const [isSocketConnected, setIsSocketConnected] = useState(false)
  const [offerReceived, setOfferReceived] = useState(false)
  const [lastOffer, setLastOffer] = useState<RTCSessionDescriptionInit | null>(null)
  const requestOfferTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [showChat, setShowChat] = useState(true)

  // Initialize peer connection
  const initializePeerConnection = useCallback(() => {
    if (peer.current) {
      peer.current.close()
    }

    peer.current = new RTCPeerConnection({
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ],
    })

    // Handle incoming tracks
    peer.current.ontrack = (e) => {
      console.log("Received track from teacher")
      if (videoRef.current && e.streams && e.streams[0]) {
        videoRef.current.srcObject = e.streams[0]
        setConnectionStatus("Stream received from teacher")
      }
    }

    // Handle ICE candidates
    peer.current.onicecandidate = (e) => {
      if (e.candidate && socket.current) {
        console.log("Sending ICE candidate to teacher")
        socket.current.emit("ice-candidate", { candidate: e.candidate, roomId })
      }
    }

    // Handle connection state changes
    peer.current.onconnectionstatechange = () => {
      console.log("Connection state:", peer.current?.connectionState)
      setConnectionStatus(`Connection state: ${peer.current?.connectionState}`)

      if (peer.current?.connectionState === "failed" || peer.current?.connectionState === "disconnected") {
        if (socket.current && isSocketConnected) {
          requestOfferFromTeacher()
        }
      }
    }

    // Handle ICE connection state changes
    peer.current.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", peer.current?.iceConnectionState)
      if (peer.current?.iceConnectionState === "failed") {
        console.log("ICE connection failed, restarting ICE")
        peer.current.restartIce()
      }
    }
  }, [roomId, isSocketConnected])

  // Function to handle an offer from the teacher
  const handleOffer = useCallback(
    async (offer: RTCSessionDescriptionInit) => {
      try {
        console.log("Processing offer from teacher")
        setConnectionStatus("Received offer, setting up connection...")
        setOfferReceived(true)
        setLastOffer(offer)

        if (!peer.current) {
          initializePeerConnection()
        }

        setConnectionStatus("Setting remote description...")
        if (peer.current && peer.current.signalingState !== "closed") {
          await peer.current.setRemoteDescription(new RTCSessionDescription(offer))

          setConnectionStatus("Creating answer...")
          const answer = await peer.current.createAnswer()
          await peer.current.setLocalDescription(answer)

          console.log("Sending answer to teacher")
          socket.current?.emit("answer", { answer, roomId })
          setConnectionStatus("Answer sent, establishing connection...")
        } else {
          console.log("Peer connection not ready for setting remote description")
          initializePeerConnection()
          if (peer.current) {
            await peer.current.setRemoteDescription(new RTCSessionDescription(offer))
            const answer = await peer.current.createAnswer()
            await peer.current.setLocalDescription(answer)
            socket.current?.emit("answer", { answer, roomId })
          }
        }
      } catch (err) {
        console.error("Error handling offer:", err)
        setOfferReceived(false)
      }
    },
    [roomId, initializePeerConnection],
  )

  // Function to request an offer from the teacher
  const requestOfferFromTeacher = useCallback(() => {
    if (socket.current && isSocketConnected) {
      console.log("Requesting offer from teacher")
      socket.current.emit("request-offer", { roomId })
      setConnectionStatus("Requested offer from teacher...")

      if (requestOfferTimeoutRef.current) {
        clearTimeout(requestOfferTimeoutRef.current)
      }

      requestOfferTimeoutRef.current = setTimeout(() => {
        if (!offerReceived) {
          console.log("No offer received, requesting again")
          requestOfferFromTeacher()
        }
      }, 5000)
    }
  }, [roomId, isSocketConnected, offerReceived])

  const handleRetryConnection = () => {
    setOfferReceived(false)

    if (socket.current) {
      socket.current.emit("joinRoom", { roomId })
      socket.current.emit("student-ready", { roomId })
      initializePeerConnection()

      if (lastOffer) {
        handleOffer(lastOffer)
      } else {
        requestOfferFromTeacher()
      }
    } else if (!isSocketConnected) {
      socket.current = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000", {
        query: { userId: localStorage.getItem("studentId") },
      })
      socket.current.connect()
    }
  }

  const handleLeaveClass = async () => {
    if (socket.current && isSocketConnected) {
      try {
        // Close peer connection first
        if (peer.current) {
          peer.current.close();
          console.log("Closed peer connection");
        }

        // Emit leave-class event and wait for acknowledgment
        socket.current.emit("leave-class", { roomId });
        
        // Wait a bit to ensure the server processes the leave-class event
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Finally disconnect socket
        if (socket.current) {
          socket.current.disconnect();
          console.log("Disconnected socket");
        }

        // Redirect to course page
        router.push(`/search/${courseId}`);
      } catch (error) {
        console.error("Error leaving class:", error);
      }
    }
  }

  useEffect(() => {
    const setupConnection = async () => {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000"
      console.log("Connecting to socket server:", socketUrl)

      // Use provided userId or fallback to localStorage
      let studentId = userId || localStorage.getItem("studentId")
      if (!studentId) {
        studentId = `student-${Math.random().toString(36).substring(2, 9)}`
        localStorage.setItem("studentId", studentId)
      }
      console.log("Using student ID:", studentId)

      socket.current = io(socketUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 10000,
        query: { userId: studentId },
      })

      socket.current.on("connect", () => {
        console.log("Socket connected with ID:", socket.current?.id)
        setConnectionStatus("Connected to signaling server")
        setIsSocketConnected(true)

        socket.current?.emit("joinRoom", { roomId })
        socket.current?.emit("student-ready", { roomId })
        initializePeerConnection()

        if (!offerReceived) {
          requestOfferFromTeacher()
        }
      })

      socket.current.on("connect_error", (err) => {
        console.error("Socket connection error:", err)
        setConnectionStatus("Connection failed")
        setIsSocketConnected(false)
      })

      socket.current.on("disconnect", () => {
        console.log("Socket disconnected")
        setConnectionStatus("Disconnected from server")
        setIsSocketConnected(false)
      })

      socket.current.on("offer", async ({ offer }: OfferEvent) => {
        await handleOffer(offer)
      })

      socket.current.on("ice-candidate", ({ candidate }: IceCandidateEvent) => {
        try {
          console.log("Received ICE candidate from teacher")
          if (peer.current && peer.current.remoteDescription) {
            peer.current
              .addIceCandidate(new RTCIceCandidate(candidate))
              .catch((err) => console.error("Error adding ICE candidate:", err))
          } else {
            console.log("Cannot add ICE candidate: peer not ready or no remote description")
          }
        } catch (err) {
          console.error("Error handling ICE candidate:", err)
        }
      })

      socket.current.on("stream-ended", async ({ roomId: endedRoomId }) => {
        if (endedRoomId === roomId) {
          try {
            setConnectionStatus("Stream ended by teacher");
            
            // Close peer connection first
            if (peer.current) {
              peer.current.close();
              console.log("Closed peer connection");
            }

            // Wait a bit before disconnecting
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Finally disconnect socket
            if (socket.current) {
              socket.current.disconnect();
              console.log("Disconnected socket");
            }

            // Redirect to course page
            router.push(`/search/${courseId}`);
          } catch (error) {
            console.error("Error handling stream end:", error);
          }
        }
      });
    }

    setupConnection()

    const reconnectInterval = setInterval(() => {
      if (!isSocketConnected && socket.current) {
        console.log("Attempting to reconnect...")
        socket.current.connect()
      }
    }, 5000)

    return () => {
      console.log("Cleaning up resources")
      clearInterval(reconnectInterval)

      if (requestOfferTimeoutRef.current) {
        clearTimeout(requestOfferTimeoutRef.current)
      }

      if (peer.current) {
        peer.current.close()
      }

      if (socket.current) {
        socket.current.disconnect()
      }
    }
  }, [router, courseId])

  return (
    <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-100px)] p-6">
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-semibold mb-4">Student Viewer</h2>
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4 w-full">
          <p className="font-bold">Status:</p>
          <p>{connectionStatus}</p>
        </div>
        <div className="flex-1 flex flex-col">
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded-xl shadow-lg" />
        </div>
        <div className="mt-4 flex gap-4">
          <button
            onClick={handleRetryConnection}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            Reconnect
          </button>
          <button
            onClick={() => setShowChat(!showChat)}
            className="bg-purple-500 text-white px-6 py-2 rounded hover:bg-purple-600"
          >
            {showChat ? "Hide Chat" : "Show Chat"}
          </button>
          <button
            onClick={handleLeaveClass}
            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
          >
            Leave Class
          </button>
        </div>
      </div>

      {showChat && (
        <div className="w-full md:w-80 h-full">
          <LiveClassChat socket={socket.current} roomId={roomId} userId={userId} isTeacher={false} />
        </div>
      )}
    </div>
  )
}