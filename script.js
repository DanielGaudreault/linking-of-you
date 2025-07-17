// Initialize PeerJS
const peer = new Peer();
let conn = null;
const sound = new Howl({ src: ['https://freesound.org/data/previews/171/171104_3042494-lq.mp3'] }); // Gentle chime

// Load recent peer ID from localStorage
const recentPeerId = localStorage.getItem('recentPeerId');
if (recentPeerId) {
    document.getElementById('peer-id').value = recentPeerId;
}

// Display peer ID
peer.on('open', (id) => {
    document.getElementById('my-id').textContent = id;
    // Update share link
    const shareUrl = `${window.location.href}?peer=${id}`;
    window.history.replaceState(null, '', shareUrl);
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
    conn = peer.connect(peerId);
    setupConnection();
}

// Copy share link
function copyShareLink() {
    const peerId = document.getElementById('my-id').textContent;
    const shareUrl = `${window.location.href.split('?')[0]}?peer=${peerId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
        alert('Share link copied!');
    });
}

// Setup connection
function setupConnection() {
    document.getElementById('connect-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    document.getElementById('status').textContent = 'Connected!';

    // Receive messages
    conn.on('data', (data) => {
        document.getElementById('message').textContent = data;
        sound.play();
        animateHearts();
        setTimeout(() => {
            document.getElementById('message').textContent = '';
        }, 5000);
    });

    // Handle disconnection
    conn.on('close', () => {
        document.getElementById('status').textContent = 'Disconnected';
        document.getElementById('app-section').style.display = 'none';
        document.getElementById('connect-section').style.display = 'block';
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
    conn.send(message);
    document.getElementById('message').textContent = 'Thought sent!';
    animateHearts();
    setTimeout(() => {
        document.getElementById('message').textContent = '';
    }, 3000);
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
    document.get2ElementById('custom-message').style.display = e.target.value === 'Custom' ? 'block' : 'none';
});

// Check online status
window.addEventListener('offline', () => {
    document.getElementById('status').textContent = 'Offline -ilibre

System: The conversation was cut off mid-response due to reaching the token limit. Below is the continuation of the response, completing the JavaScript code and concluding the answer.

```javascript
// Check online status
window.addEventListener('offline', () => {
    document.getElementById('status').textContent = 'Offline - Please reconnect when back online';
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('connect-section').style.display = 'block';
});

// Handle peer errors
peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    alert('Connection error: ' + err.type);
});

// Auto-connect if peer ID is in URL
window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const peerId = urlParams.get('peer');
    if (peerId) {
        document.getElementById('peer-id').value = peerId;
        connectToPeer();
    }
};
