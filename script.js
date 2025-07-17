// Initialize PeerJS with reliable configuration
const peer = new Peer({
    host: '0.peerjs.com',
    secure: true,
    port: 443,
    config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }
});
let conn = null;
const sound = new Howl({ src: ['https://freesound.org/data/previews/171/171104_3042494-lq.mp3'] });
let messageQueue = [];
let currentMessage = null;
let connectionRetries = 0;
const maxRetries = 3;

// Load recent peer ID
const recentPeerId = localStorage.getItem('recentPeerId');
if (recentPeerId) {
    document.getElementById('peer-id').value = recentPeerId;
}

// Display peer ID and shareable link
peer.on('open', (id) => {
    document.getElementById('my-id').textContent = id;
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?peer=${encodeURIComponent(id)}`;
    document.getElementById('share-link').value = shareUrl;
    connectionRetries = 0; // Reset retries on successful peer ID
});

// Connect to peer with retry logic
function connectToPeer() {
    const peerId = document.getElementById('peer-id').value.trim();
    if (!peerId) {
        alert('Please enter a peer ID');
        return;
    }
    if (connectionRetries >= maxRetries) {
        alert('Max connection attempts reached. Please try again later.');
        document.getElementById('status').textContent = 'Connection failed';
        return;
    }
    localStorage.setItem('recentPeerId', peerId);
    document.getElementById('status').textContent = 'Connecting...';
    conn = peer.connect(peerId);
    setupConnection();
}

// Copy share link
function copyShareLink() {
    const shareLink = document.getElementById('share-link');
    shareLink.select();
    navigator.clipboard.writeText(shareLink.value).then(() => {
        alert('Share link copied!');
    }).catch(() => {
        alert('Failed to copy. Please copy manually.');
    });
}

// Setup connection
function setupConnection() {
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
            messageQueue.push(data);
            updateBadge();
            if (!currentMessage) {
                showNextMessage();
            }
        }
    });

    conn.on('error', (err) => {
        console.error('Connection error:', err);
        document.getElementById('status').textContent = 'Connection error';
        alert('Connection error. Retrying...');
        connectionRetries++;
        setTimeout(connectToPeer, 2000 * connectionRetries); // Exponential backoff
    });

    conn.on('close', () => {
        document.getElementById('status').textContent = 'Disconnected';
        document.getElementById('app-section').style.display = 'none';
        document.getElementById('connect-section').style.display = 'block';
        messageQueue = [];
        currentMessage = null;
        updateBadge();
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
    messageQueue.shift();
    currentMessage = null;
    updateBadge();
    showNextMessage();
}

// Click message to acknowledge
document.getElementById('message').addEventListener('click', acknowledgeMessage);

// Show next message
function showNextMessage() {
    if (messageQueue.length > 0) {
        currentMessage = messageQueue[0];
        document.getElementById('message').textContent = currentMessage;
        document.getElementById('acknowledge-btn').style.display = 'block';
        sound.play();
        animateHearts();
    } else {
        document.getElementById('message').textContent = '';
        document.getElementById('acknowledge-btn').style.display = 'none';
    }
}

// Update badge
function updateBadge() {
    const badge = document.getElementById('badge');
    badge.textContent = messageQueue.length;
    badge.style.display = messageQueue.length > 0 ? 'inline-block' : 'none';
}

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
    messageQueue = [];
    currentMessage = null;
    updateBadge();
});

// Auto-connect if peer ID is in URL
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const peerId = urlParams.get('peer');
    if (peerId) {
        document.getElementById('peer-id').value = peerId;
        document.getElementById('status').textContent = 'Connecting...';
        setTimeout(connectToPeer, 1000); // Delay for PeerJS initialization
    }
};

// Handle peer errors
peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    document.getElementById('status').textContent = 'Connection error';
    if (err.type === 'server-error') {
        alert('Server error. Retrying connection...');
        connectionRetries++;
        if (connectionRetries < maxRetries) {
            setTimeout(connectToPeer, 2000 * connectionRetries);
        } else {
            alert('Unable to connect to server. Please check your network or try again later.');
        }
    } else {
        alert('Connection error: ' + err.type);
    }
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('connect-section').style.display = 'block';
});
