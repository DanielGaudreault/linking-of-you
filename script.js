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
let connectionRetries = 0;
const maxRetries = 3;

// Display peer ID
peer.on('open', (id) => {
    document.getElementById('my-id').textContent = id;
    document.getElementById('status').textContent = 'Ready';
    document.getElementById('peer-id').value = ''; // Clear input on refresh
});

// Handle incoming connections
peer.on('connection', (connection) => {
    conn = connection;
    setupConnection();
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
        document.getElementById('status').textContent = 'Failed';
        document.getElementById('connect-btn').disabled = false;
        document.getElementById('spinner').style.display = 'none';
        return;
    }
    document.getElementById('status').textContent = 'Connecting...';
    document.getElementById('connect-btn').disabled = true;
    document.getElementById('spinner').style.display = 'inline-block';
    conn = peer.connect(peerId);
    setTimeout(() => {
        if (conn && conn.open) {
            setupConnection();
        } else {
            connectionRetries++;
            document.getElementById('status').textContent = 'Failed';
            alert(`Failed to connect (attempt ${connectionRetries}/${maxRetries}). Retrying...`);
            setTimeout(connectToPeer, 2000 * connectionRetries); // Exponential backoff
            document.getElementById('connect-btn').disabled = false;
            document.getElementById('spinner').style.display = 'none';
        }
    }, 2000); // Delay for PeerJS initialization
}

// Setup connection
function setupConnection() {
    if (!conn || !conn.open) {
        document.getElementById('status').textContent = 'Failed';
        document.getElementById('connect-btn').disabled = false;
        document.getElementById('spinner').style.display = 'none';
        return;
    }
    document.getElementById('connect-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    document.getElementById('status').textContent = 'Connected!';
    connectionRetries = 0; // Reset retries

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
            sound.play();
            animateHearts();
        }
    });

    conn.on('error', (err) => {
        console.error('Connection error:', err);
        document.getElementById('status').textContent = 'Failed';
        alert('Connection error: ' + err.type + '. Please try again.');
        resetToConnect();
    });

    conn.on('close', () => {
        document.getElementById('status').textContent = 'Disconnected';
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
}

// Send thought
function sendThought() {
    if (!conn || !conn.open) {
        alert('Not connected to a peer!');
        return;
    }
    const message = document.getElementById('message-type').value;
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
}

// Click message to acknowledge
document.getElementById('message').addEventListener('click', acknowledgeMessage);

// Animate hearts
function animateHearts() {
    const container = document.getElementById('animation-container');
    const colors = ['#d81b60', '#ff4081', '#f06292'];
    for (let i = 0; i < 5; i++) {
        const heart = document.createElement('div');
        heart.className = 'heart';
        heart.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        heart.style.width = `${Math.random() * 10 + 15}px`;
        heart.style.height = heart.style.width;
        heart.style.setProperty('--before-width', heart.style.width);
        heart.style.setProperty('--after-width', heart.style.width);
        container.appendChild(heart);
        anime({
            targets: heart,
            translateX: () => anime.random(-50, 50),
            translateY: () => anime.random(-50, -100),
            scale: [0.5, Math.random() * 0.5 + 1.2],
            opacity: [0, 1, 0],
            duration: 2000,
            easing: 'easeOutQuad',
            complete: () => heart.remove()
        });
    }
}

// Update heart pseudo-elements
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
    .heart::before, .heart::after {
        width: var(--before-width);
        height: var(--before-width);
        background-color: inherit;
    }`, styleSheet.cssRules.length);

// Check online status
window.addEventListener('offline', () => {
    document.getElementById('status').textContent = 'Offline';
    resetToConnect();
});

// Handle peer errors
peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    document.getElementById('status').textContent = 'Failed';
    document.getElementById('connect-btn').disabled = false;
    document.getElementById('spinner').style.display = 'none';
    if (err.type === 'server-error') {
        alert('Unable to connect to server. Check your network and try again.');
    } else if (err.type === 'peer-unavailable') {
        alert('Peer ID not found. Check the ID and ensure your friend is online.');
    } else {
        alert('Error: ' + err.type);
    }
    document.getElementById('app-section').style.display = 'none';
    document.getElementById('connect-section').style.display = 'block';
});
