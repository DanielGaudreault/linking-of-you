// Initialize PeerJS with reliable configuration
const peer = new Peer({
    host: '0.peerjs.com',
    secure: true,
    port: 443,
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
});
let conn = null;
const sound = new Howl({ src: ['https://freesound.org/data/previews/171/171104_3042494-lq.mp3'] });
let currentMessage = null;

// Load recent peer ID
const recentPeerId = localStorage.getItem('recentPeerId');
if (recentPeerId) {
    document.getElementById('peer-id').value = recentPeerId;
}

// Display peer ID
peer.on('open', (id) => {
    document.getElementById('my-id').textContent = id;
    document.getElementById('status').textContent = 'Ready to connect';
});

// Handle incoming connections
peer.on('connection', (connection) => {
    conn = connection;
    setupConnection();
});

// Connect to peer
function connectToPeer() {
    const peerId = document.getElementById('peer-id').value.trim();
    if (!peerId) {
        alert('Please enter a peer ID');
        return;
    }
    localStorage.setItem('recentPeerId', peerId);
    document.getElementById('status').textContent = 'Connecting...';
    conn = peer.connect(peerId);
    setTimeout(() => {
        if (conn && conn.open) {
            setupConnection();
        } else {
            document.getElementById('status').textContent = 'Connection failed';
            alert('Failed to connect. Please check the peer ID and try again.');
        }
    }, 2000); // Delay to ensure PeerJS initialization
}

// Setup connection
function setupConnection() {
    if (!conn || !conn.open) {
        document.getElementById('status').textContent = 'Connection failed';
        return;
    }
    document.getElementById('connect-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    document.getElementById('status').textContent = 'Connected!';

    conn.on('data', (data) => {
        if (data === 'Message viewed!') {
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
            document.getElementById('acknowledge-btn').style.display = 'block';
            sound.play();
            animateHearts();
        }
    });

    conn.on('error', (err) => {
        console.error('Connection error:', err);
        document.getElementById('status').textContent = 'Connection error';
        alert('Connection error: ' + err.type + '. Please try again.');
        document.getElementById('app-section').style.display = 'none';
        document.getElementById('connect-section').style.display = 'block';
        currentMessage = null;
        document.getElementById('message').textContent = '';
        document.getElementById('acknowledge-btn').style.display = 'none';
    });

    conn.on('close', () => {
        document.getElementById('status').textContent = 'Disconnected';
        document.getElementById('app-section').style.display = 'none';
        document.getElementById('connect-section').style.display = 'block';
        currentMessage = null;
        document.getElementById('message').textContent = '';
        document.getElementById('acknowledge-btn').style.display = 'none';
    });
}

// Send thought
function sendThought() {
    if (!conn || !conn.open) {
        alert('Not connected to a peer!');
        return;
    }
    const messageType = document.getElementById('message-type').value;
    const customMessage = document.getElementById('custom-message').value.trim();
    const message = messageType === 'Custom' && customMessage ? customMessage : messageType;
    if (message.length > 50) {
        alert('Message too long! Max 50 characters.');
        return;
    }
    conn.send(message);
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
    if (conn && conn.open) {
        conn.send('Message viewed!');
    }
    currentMessage = null;
    document.getElementById('message').textContent = '';
    document.getElementById('acknowledge-btn').style.display = 'none';
}

// Click message to acknowledge
document.getElementById('message').addEventListener('click', acknowledgeMessage);

// Animate hearts
function animateHearts() {
    const container = document.getElementById('animation-container');
    for (let i = 0; i < 5; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        container.appendChild(heart);
        anime({
            targets: heart,
            translateX: () => anime.random(-50, 50),
            translateY: () => anime.random(-50, -100),
            scale: [0.5, 1.5],
            opacity: [0, 1, 0],
            duration: 2000,
            easing: 'easeOutQuad',
            complete: () => heart.remove()
        });
    }
}

// Toggle custom message input
document.getElementById('message-type').addEventListener('change', (e) => {
    document.getElementById('custom-message').style.display = e.target.value === 'Custom' ? 'block' : 'none';
});

// Check online status
window.addEventListener('offline', () => {
    document.getElementById('status').textContent = 'Offline - Please reconnect';
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('connect-section').style.display = 'block';
    currentMessage = null;
    document.getElementById('message').textContent = '';
    document.getElementById('acknowledge-btn').style.display = 'none';
});

// Handle peer errors
peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    document.getElementById('status').textContent = 'Connection error';
    if (err.type === 'server-error') {
        alert('Unable to connect to PeerJS server. Please check your network and try again.');
    } else if (err.type === 'peer-unavailable') {
        alert('Peer ID not found. Please check the ID and ensure your friend is online.');
    } else {
        alert('Connection error: ' + err.type);
    }
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('connect-section').style.display = 'block';
});
