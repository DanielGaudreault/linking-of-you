// Connect to the signaling server (e.g., using Socket.IO)
const socket = io('http://localhost:3000'); // Replace with your server URL
let peerConnection;
let dataChannel;

// Get DOM elements
const myIdElement = document.getElementById('my-id');
const peerIdInput = document.getElementById('peer-id');
const messagesDiv = document.getElementById('messages');
const customMessageInput = document.getElementById('custom-message');

// WebRTC configuration
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

// Initialize peer connection
function initPeerConnection() {
    peerConnection = new RTCPeerConnection(configuration);
    
    // Create data channel
    dataChannel = peerConnection.createDataChannel('messageChannel');
    dataChannel.onopen = () => console.log('Data channel open');
    dataChannel.onmessage = (event) => {
        displayMessage(`Peer: ${event.data}`);
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            socket.emit('ice-candidate', { to: peerIdInput.value, candidate: event.candidate });
        }
    };

    // Handle incoming data channel
    peerConnection.ondatachannel = (event) => {
        dataChannel = event.channel;
        dataChannel.onmessage = (event) => {
            displayMessage(`Peer: ${event.data}`);
        };
    };
}

// Get your peer ID from the server
socket.on('connect', () => {
    myIdElement.textContent = socket.id;
});

// Handle signaling
socket.on('offer', async (data) => {
    if (!peerConnection) initPeerConnection();
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', { to: data.from, answer });
});

socket.on('answer', async (data) => {
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
});

socket.on('ice-candidate', async (data) => {
    try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (e) {
        console.error('Error adding ICE candidate:', e);
    }
});

// Connect to another peer
async function connectToPeer() {
    if (!peerIdInput.value) {
        alert('Please enter a peer ID');
        return;
    }
    initPeerConnection();
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    socket.emit('offer', { to: peerIdInput.value, offer });
}

// Send a message
function sendMessage(message) {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(message);
        displayMessage(`You: ${message}`);
    } else {
        alert('Not connected to peer');
    }
}

// Send selected message from dropdown
function sendSelectedMessage() {
    const select = document.getElementById('message-select');
    const message = select.value;
    if (message) sendMessage(message);
}

// Send custom message
function sendCustomMessage() {
    const message = customMessageInput.value;
    if (message) {
        sendMessage(message);
        customMessageInput.value = '';
    }
}

// Display messages
function displayMessage(message) {
    const p = document.createElement('p');
    p.textContent = message;
    messagesDiv.appendChild(p);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
