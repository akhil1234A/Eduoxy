"use client"
import { useEffect, useRef, useState } from 'react';
import Peer from 'peerjs';

function App() {
  const [peerId, setPeerId] = useState('');
  const [remotePeerIdValue, setRemotePeerIdValue] = useState('');
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const currentUserVideoRef = useRef<HTMLVideoElement>(null);
  const peerInstance = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [isLocalVideoPlaying, setIsLocalVideoPlaying] = useState(false);
  const [isRemoteVideoPlaying, setIsRemoteVideoPlaying] = useState(false);

  const playVideo = async (videoElement: HTMLVideoElement | null, isLocal: boolean = false) => {
    if (!videoElement) return;

    try {
      const playPromise = videoElement.play();
      if (playPromise !== undefined) {
        await playPromise;
        if (isLocal) {
          setIsLocalVideoPlaying(true);
        } else {
          setIsRemoteVideoPlaying(true);
        }
      }
    } catch (error) {
      console.error(`Error playing ${isLocal ? 'local' : 'remote'} video:`, error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        console.log('Autoplay blocked, waiting for user interaction');
      }
    }
  };

  useEffect(() => {
    const peer = new Peer();

    peer.on('open', (id) => {
      setPeerId(id)
    });

    peer.on('call', (call) => {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((mediaStream) => {
          localStreamRef.current = mediaStream;
          if (currentUserVideoRef.current) {
            currentUserVideoRef.current.srcObject = mediaStream;
            playVideo(currentUserVideoRef.current, true);
          }
          call.answer(mediaStream);
          call.on('stream', (remoteStream) => {
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
              playVideo(remoteVideoRef.current);
            }
          });
        })
        .catch(err => console.error('Failed to get user media:', err));
    });

    peerInstance.current = peer;

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      peer.destroy();
    };
  }, []);

  const call = (remotePeerId: string) => {
    if (!peerInstance.current) return;

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((mediaStream) => {
        localStreamRef.current = mediaStream;
        if (currentUserVideoRef.current) {
          currentUserVideoRef.current.srcObject = mediaStream;
          playVideo(currentUserVideoRef.current, true);
        }

        const call = peerInstance.current!.call(remotePeerId, mediaStream);

        call.on('stream', (remoteStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
            playVideo(remoteVideoRef.current);
          }
        });
      })
      .catch(err => console.error('Failed to get user media:', err));
  };

  const handleLocalVideoClick = () => {
    if (currentUserVideoRef.current && !isLocalVideoPlaying) {
      playVideo(currentUserVideoRef.current, true);
    }
  };

  const handleRemoteVideoClick = () => {
    if (remoteVideoRef.current && !isRemoteVideoPlaying) {
      playVideo(remoteVideoRef.current);
    }
  };

  return (
    <div className="App" style={{ 
      padding: '20px',
      color: 'white',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#fff', marginBottom: '20px' }}>Current user id is {peerId}</h1>
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          value={remotePeerIdValue} 
          onChange={e => setRemotePeerIdValue(e.target.value)}
          placeholder="Enter peer ID to call"
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
          onClick={() => call(remotePeerIdValue)}
          style={{
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Call
        </button>
      </div>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ color: '#fff', marginBottom: '10px' }}>Your Video</h3>
          <video 
            ref={currentUserVideoRef} 
            style={{ 
              width: '100%',
              maxWidth: '500px',
              backgroundColor: '#333',
              borderRadius: '8px',
              cursor: !isLocalVideoPlaying ? 'pointer' : 'default'
            }}
            autoPlay
            playsInline
            muted
            onClick={handleLocalVideoClick}
          />
          {!isLocalVideoPlaying && (
            <p style={{ color: '#ff9800', marginTop: '5px' }}>Click video to start playback</p>
          )}
        </div>
        <div style={{ flex: 1, minWidth: '300px' }}>
          <h3 style={{ color: '#fff', marginBottom: '10px' }}>Remote Video</h3>
          <video 
            ref={remoteVideoRef}
            style={{ 
              width: '100%',
              maxWidth: '500px',
              backgroundColor: '#333',
              borderRadius: '8px',
              cursor: !isRemoteVideoPlaying ? 'pointer' : 'default'
            }}
            autoPlay
            playsInline
            onClick={handleRemoteVideoClick}
          />
          {!isRemoteVideoPlaying && (
            <p style={{ color: '#ff9800', marginTop: '5px' }}>Click video to start playback</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;