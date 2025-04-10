import { PeerServer } from "peer";

const peerServer = PeerServer({
  port: 9000, 
  path: '/myapp',
  allow_discovery: true, 
});

peerServer.on('connection', (client: any) => {
  console.log('Peer connected with ID:', client.id);
});

peerServer.on('disconnect', (client: any) => {
  console.log('Peer disconnected:', client.id);
});

console.log('PeerJS server running on port 9000');