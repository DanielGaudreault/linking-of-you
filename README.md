# ConnectSphere: Peer-to-Peer Messaging App

**ConnectSphere** is a Progressive Web App (PWA) that enables peer-to-peer messaging without requiring a dedicated server. Built with PeerJS, it allows users to connect using unique peer IDs and send messages such as "Thinking of you," predefined options (e.g., "Send a Smile"), or custom messages. The app features a professional, modern design and can be installed on mobile and desktop devices for an app-like experience.

**[Try ConnectSphere Now](https://danielgaudreault.github.io/linking-of-you/)**

## Features

- **Peer-to-Peer Messaging**: Connect directly with another user using a unique peer ID via WebRTC (PeerJS).
- **Message Options**:
  - Send a "Thinking of you!" message with a single click.
  - Choose from predefined messages like "Send a Smile 😊," "Send a Wave 👋," or "Let's Chat Soon!" via a dropdown.
  - Send custom messages by typing and pressing "Enter" or clicking a button.
- **Professional Design**: Clean, modern UI with responsive layout, subtle animations, and a polished look.
- **Progressive Web App**:
  - Installable on iOS, Android, and desktop for an app-like experience.
  - Offline support for loading the interface (messaging requires an internet connection).
  - Full-screen mode with a standalone display.
- **No Server Setup**: Uses PeerJS’s free signaling server for peer connections.
- **Easy Connection**: Share and enter peer IDs to establish a direct connection.

## Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Edge) that supports WebRTC.
- An internet connection for PeerJS signaling (offline mode caches the UI but messaging requires connectivity).
- For local testing, a simple HTTP server (optional, e.g., Python’s `http.server`).

## Setup

Since ConnectSphere is a client-side PWA, no server setup or installations are required. You can use it directly via the hosted link or set it up locally.

### Option 1: Use the Hosted App
1. Visit **[https://danielgaudreault.github.io/linking-of-you/](https://danielgaudreault.github.io/linking-of-you/)**.
2. Follow the usage instructions below.

### Option 2: Run Locally
1. **Clone or Download the Repository**:
   - Clone the repository or download the source files:
     ```bash
     git clone https://github.com/danielgaudreault/linking-of-you.git
     cd linking-of-you
     ```
   - Alternatively, download the ZIP file from the GitHub repository.

2. **Serve the Files**:
   - Option A: Open `index.html` directly in a browser (e.g., double-click the file). Note: Some browsers may restrict WebRTC when using `file://` URLs.
   - Option B: Use a local HTTP server for reliable testing:
     ```bash
     python -m http.server 8000
     ```
   - Access the app at `http://localhost:8000`.

3. **Directory Structure**:
