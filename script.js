// Initialize PeerJS with robust configuration
const peer = new Peer({
    host: '0.peerjs.com',
    secure: true,
    port: 443,
    debug: 3, // Maximum WebRTC debug logging
    config: {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'turn:openrelay.metered.ca:80', username: 'openrelay.user', credential: 'openrelaypassword' }
        ]
    }
});
let conn = null;
const sound = new Howl({ src: ['https://freesound.org/data/previews/171/171104_3042494-lq.mp3'] });
let currentMessage = null;
let connectionRetries = 0;
const maxRetries = 6;
let isConnected = false;

// Log with timestamp
function log(message) {
    console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

// Display peer ID
peer.on('open', (id) => {
    log('Peer ID generated: ' + id);
    document.getElementById('my-id').textContent = id;
    document.getElementById('status').textContent = 'Ready';
    document.getElementById('peer-id').value = ''; // Clear input on refresh
    alert('Your Peer ID: ' + id + '\nShare this with your friend.');
});

// Handle incoming connections
peer.on('connection', (connection) => {
    log('Incoming connection from: ' + connection.peer);
    const peerId = document.getElementById('peer-id').value.trim();
    if (connection.peer === peerId) {
        conn = connection;
        setupConnection();
        conn.send('Connection confirmed');
        log('Sent confirmation to: ' + connection.peer);
    } else {
        log('Unexpected connection from: ' + connection.peer + ', expected: ' + peerId);
        connection.close();
    }
});

// Connect to peer with retry logic
function connectToPeer() {
    const peerId = document.getElementById('peer-id').value.trim();
    if (!peerId) {
        alert('Please enter your friend’s peer ID');
        return;
    }
    if (connectionRetries >= maxRetries) {
        alert('Max connection attempts reached. Please refresh and try again.');
        document.getElementById('status').textContent = 'Failed';
        document.getElementById('connect-btn').disabled = false;
        document.getElementById('spinner').style.display = 'none';
        return;
    }
    document.getElementById('status').textContent = `Connecting (Attempt ${connectionRetries + 1}/6)...`;
    document.getElementById('connect-btn').disabled = true;
    document.getElementById('spinner').style.display = 'inline-block';
    log(`Attempting to connect to: ${peerId}, Attempt: ${connectionRetries + 1}`);
    conn = peer.connect(peerId);
    setTimeout(() => {
        if (conn && conn.open) {
            log('Connection successful to: ' + peerId);
            conn.send('Connection confirmed');
            log('Sent confirmation to: ' + peerId);
            checkConnection();
        } else {
            connectionRetries++;
            document.getElementById('status').textContent = 'Failed';
            alert(`Failed to connect (attempt ${connectionRetries}/6). Retrying...`);
            log('Connection failed, retrying: ' + connectionRetries);
            setTimeout(connectToPeer, 10000 * connectionRetries); // Exponential backoff
            document.getElementById('connect-btn').disabled = false;
            document.getElementById('spinner').style.display = 'none';
        }
    }, 10000); // Extended delay for PeerJS initialization
}

// Check for two-way connection
function checkConnection() {
    if (!conn || !conn.open) {
        log('Connection check failed: ' + (conn ? 'Connection not open' : 'No connection'));
        document.getElementById('status').textContent = 'Failed';
        document.getElementById('connect-btn').disabled = false;
        document.getElementById('spinner').style.display = 'none';
        isConnected = false;
        return;
    }
    setTimeout(() => {
        if (isConnected) {
            document.getElementById('connect-section').style.display = 'none';
            document.getElementById('app-section').style.display = 'block';
            document.getElementById('status').textContent = 'Connected!';
            alert('Connected to your friend!');
            log('Two-way connection established');
        } else {
            log('No confirmation received from peer');
            document.getElementById('status').textContent = 'Failed: No confirmation from peer';
            alert('Failed: Peer did not confirm connection. Both must enter peer IDs and click Connect.');
            resetToConnect();
        }
    }, 5000); // Wait for confirmation
}

// Setup connection
function setupConnection() {
    if (!conn || !conn.open) {
        log('Connection setup failed: ' + (conn ? 'Connection not open' : 'No connection'));
        document.getElementById('status').textContent = 'Failed';
        document.getElementById('connect-btn').disabled = false;
        document.getElementById('spinner').style.display = 'none';
        return;
    }

    conn.on('data', (data) => {
        log('Received data: ' + data + ' from: ' + conn.peer);
        alert('Received: ' + data); // Persistent debug alert
        if (data === 'Connection confirmed') {
            isConnected = true;
            document.getElementById('status').textContent = 'Connected!';
        } else if (data === 'Message viewed!') {
            document.getElementById('message').textContent = data;
            animateHearts();
            setTimeout(() => {
                if (!currentMessage) {
                    document.getElementById('message').textContent = '';
                }
            }, 3000);
        } else {
            currentMessage = data;
            document.getElementById('message').textContent = data;
            sound.play();
            animateHearts();
        }
    });

    conn.on('error', (err) => {
        log('Connection error: ' + err.type);
        document.getElementById('status').textContent = 'Failed';
        alert('Connection error: ' + err.type + '. Please try again.');
        resetToConnect();
    });

    conn.on('close', () => {
        log('Connection closed with: ' + conn.peer);
        document.getElementById('status').textContent = 'Disconnected';
        alert('Disconnected from peer. Please reconnect.');
        resetToConnect();
    });
}

// Reset to connect section
function resetToConnect() {
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('connect-section').style.display = 'block';
    document.getElementById('connect-btn').disabled = false;
    document.getElementById('spinner').style.display = 'none';
    currentMessage = null;
    document.getElementById('message').textContent = '';
    isConnected = false;
}

// Send thought
function sendThought() {
    if (!conn || !conn.open || !isConnected) {
        alert('Not connected to a peer! Both must enter peer IDs and click Connect.');
        return;
    }
    const message = document.getElementById('message-type').value;
    conn.send(message);
    log('Sent message: ' + message + ' to: ' + conn.peer);
    document.getElementById('message').textContent = 'Thought sent!';
    animateHearts();
    setTimeout(() => {
        if (!currentMessage) {
            document.getElementById('message').textContent = '';
        }
    }, 3000);
}

// Acknowledge message
function acknowledgeMessage() {
    if (conn && conn.open && isConnected) {
        conn.send('Message viewed!');
        log('Sent acknowledgment to: ' + conn.peer);
    }
    currentMessage = null;
    document.getElementById('message').textContent = '';
}

// Click message to acknowledge
document.getElementById('message').addEventListener('click', acknowledgeMessage);

// Animate hearts (reduced for performance)
function animateHearts() {
    const container = document.getElementById('animation-container');
    const colors = ['#c51162', '#ff4081'];
    for (let i = 0; i < 2; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        container.appendChild(heart);
        anime({
            targets: heart,
            translateX: () => anime.random(-30, 30),
            translateY: () => anime.random(-30, -60),
            scale: [0.5, 1],
            opacity: [0, 1, 0],
            duration: 1000,
            easing: 'easeOutQuad',
            complete: () => heart.remove()
        });
    }
}

// Check online status
window.addEventListener('offline', () => {
    log('Browser went offline');
    document.getElementById('status').textContent = 'Offline';
    alert('Network offline. Please check your connection.');
    resetToConnect();
});

// Handle peer errors
peer.on('error', (err) => {
    log('PeerJS error: ' + err.type);
    document.getElementById('status').textContent = 'Failed';
    document.getElementById('connect-btn').disabled = false;
    document.getElementById('spinner').style.display = 'none';
    if (err.type === 'server-error') {
        alert('Unable to connect to server. Check your network or try again later.');
    } else if (err.type === 'peer-unavailable') {
        alert('Peer ID not found. Check the ID and ensure your friend is online.');
    } else if (err.type === 'disconnected') {
        alert('Disconnected from server. Please refresh and try again.');
    } else if (err.type === 'network') {
        alert('Network error. Check your connection and try again.');
    } else {
        alert('Error: ' + err.type + '. Please try again.');
    }
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('connect-section').style.display = 'block';
});
