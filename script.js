// Initialize PeerJS (uses default PeerJS signaling server)
const peer = new Peer();
let conn = null;

// Display your peer ID when generated
peer.on('open', (id) => {
    document.getElementById('my-id').textContent = id;
});

// Handle incoming connections
peer.on('connection', (connection) => {
    conn = connection;
    setupConnection();
});

// Connect to another peer
function connectToPeer() {
    const peerId = document.getElementById('peer-id').value.trim();
    if (!peerId) {
        alert('Please enter a peer ID');
        return;
    }
    conn = peer.connect(peerId);
    setupConnection();
}

// Set up connection event listeners
function setupConnection() {
    document.getElementById('connect-section').style.display = 'none';
    document.getElementById('app-section').style.display = 'block';
    document.getElementById('status').textContent = 'Connected!';

    // Receive messages
    conn.on('data', (data) => {
        document.getElementById('message').textContent = data;
        setTimeout(() => {
            document.getElementById('message').textContent = '';
        }, 3000);
    });

    // Handle connection close
    conn.on('close', () => {
        document.getElementById('status').textContent = 'Disconnected';
        document.getElementById('app-section').style.display = 'none';
        document.getElementById('connect-section').style.display = 'block';
    });
}

// Send "thinking of you" message
function sendThought() {
    if (conn && conn.open) {
        conn.send('Someone is thinking of you!');
        document.getElementById('message').textContent = 'Thought sent!';
        setTimeout(() => {
            document.getElementById('message').textContent = '';
        }, 3000);
    } else {
        alert('Not connected to a peer!');
    }
}

// Handle peer errors
peer.on('error', (err) => {
    console.error('PeerJS error:', err);
    alert('Error: ' + err.type);
});
