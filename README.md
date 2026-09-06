# 🔐 CipherLink

### End-to-End Encrypted Real-Time Chat & User Discovery Platform

**CipherLink** is a secure, real-time communication platform designed around **privacy, controlled user discovery, and end-to-end encrypted messaging**.

The platform allows users to register and authenticate securely, discover other users based on **geographical radius or globally**, send and manage friend requests, and communicate through real-time encrypted conversations once a connection has been established.

The system combines **Node.js, TypeScript, Express.js, MongoDB, Mongoose, JWT, Cookies, and Socket.io** to provide a scalable backend architecture for secure real-time communication.

---

## 🚀 Key Features

### 🔐 End-to-End Encrypted Messaging

CipherLink is designed around private communication where messages are encrypted before being transmitted and decrypted by the intended recipient.

```text
User A
   │
   │ Message
   ▼
Encryption
   │
   │ Encrypted Message
   ▼
Backend / Socket.io
   │
   │ Encrypted Message
   ▼
User B
   │
   ▼
Decryption
   │
   ▼
Original Message
```

The goal is to prevent the backend from directly accessing the plaintext content of private conversations.

---

### 👤 User Registration & Authentication

Users can create an account and securely authenticate with the platform.

Features include:

* User registration
* User login
* JWT-based authentication
* Cookie-based authentication
* Protected routes
* Authenticated sessions
* User profile management

```text
Register
   ↓
Account Created
   ↓
Login
   ↓
JWT Generated
   ↓
Authentication Cookie
   ↓
Authenticated User
```

---

### 🟢 Online User Presence

CipherLink provides real-time user presence.

Users can determine whether another user is currently:

* Online
* Offline

Socket.io is used to maintain real-time communication between clients and the backend.

```text
User connects
      ↓
Socket connection established
      ↓
Online status updated
      ↓
Other connected users receive update
```

When the user disconnects, their presence can be updated accordingly.

---

## 🌍 User Discovery

CipherLink provides two primary methods for discovering users.

### 1. 📍 Radius-Based User Search

Users can discover other users based on geographical distance.

Supported radius options include:

* **5 KM**
* **10 KM**
* **15 KM**

Example:

```text
Current Location
       │
       ├── 5 KM
       │
       ├── 10 KM
       │
       └── 15 KM
```

This allows users to find people who are geographically close to them.

The backend can use geographical coordinates and MongoDB geospatial querying to identify users within the requested radius.

---

### 2. 🌎 Global User Discovery

Users can also search for users globally rather than restricting the search to a geographical radius.

```text
                  Global Users
                      │
       ┌──────────────┼──────────────┐
       ▼              ▼              ▼
     India          USA            Europe
       │              │              │
       └──────────────┼──────────────┘
                      ▼
                Search Results
```

This provides two discovery modes:

```text
User Discovery
      │
      ├── Nearby Users
      │      ├── 5 KM
      │      ├── 10 KM
      │      └── 15 KM
      │
      └── Global Users
```

---

# 🤝 Friend Request System

Users cannot immediately start a private conversation with any arbitrary user.

A connection must first be established through the friend-request workflow.

### Connection Flow

```text
User A
  │
  │ Search User B
  ▼
User B Profile
  │
  │ Send Friend Request
  ▼
User B
  │
  │ Accept Request
  ▼
Connection Established
  │
  ▼
Chat Enabled
```

### Friend Request States

A request can move through states such as:

```text
No Connection
      ↓
Request Sent
      ↓
Pending
      ↓
Accepted
      ↓
Connected
```

This provides a controlled communication model and prevents unsolicited private conversations.

---

# 💬 Real-Time Chat

Once two users become connected, they can communicate through real-time chat.

Socket.io provides the real-time communication layer.

### Chat Flow

```text
User A
   │
   │ Send Message
   ▼
Client-Side Encryption
   │
   │ Encrypted Payload
   ▼
Socket.io Server
   │
   │ Forward Message
   ▼
User B
   │
   ▼
Client-Side Decryption
   │
   ▼
Message Displayed
```

The system does not require the client to continuously poll the server for new messages.

---

# 🔒 Security Architecture

CipherLink uses multiple layers of security.

### Authentication

```text
Client
   ↓
Login
   ↓
Backend
   ↓
JWT
   ↓
Secure Cookie
   ↓
Authenticated Requests
```

### Communication Security

```text
Plaintext
    ↓
Encryption
    ↓
Ciphertext
    ↓
Network
    ↓
Backend
    ↓
Network
    ↓
Ciphertext
    ↓
Decryption
    ↓
Plaintext
```

The encryption layer is separate from the authentication layer.

**JWT authenticates the user; it does not provide end-to-end message encryption.**

---

# 🏗️ System Architecture

CipherLink consists of two major components:

```text
┌──────────────────────────────────────────────┐
│                  Frontend                    │
│                                              │
│  Authentication                             │
│  User Discovery                              │
│  Friend Requests                             │
│  Chat UI                                     │
│  Encryption / Decryption                     │
│  Socket.io Client                            │
└──────────────────────┬───────────────────────┘
                       │
                       │ HTTPS / WebSocket
                       ▼
┌──────────────────────────────────────────────┐
│                  Backend                     │
│                                              │
│  Node.js                                     │
│  TypeScript                                  │
│  Express.js                                  │
│  JWT Authentication                          │
│  Socket.io                                   │
│  Business Logic                              │
│  User Management                             │
│  Friend Requests                             │
│  User Discovery                              │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
              ┌─────────────────┐
              │     MongoDB      │
              │    Mongoose     │
              └─────────────────┘
```

---

# 🔄 Complete Application Flow

## Step 1 — Registration

A new user creates an account.

```text
Frontend
   ↓
Registration API
   ↓
Express.js
   ↓
Validation
   ↓
MongoDB
   ↓
User Created
```

---

## Step 2 — Login

The user authenticates using their credentials.

```text
Frontend
   ↓
Login API
   ↓
Authentication
   ↓
JWT Generation
   ↓
Cookie
   ↓
Authenticated Session
```

---

## Step 3 — User Discovery

After authentication, the user can discover other users.

The frontend provides options such as:

```text
Search Users

[ Nearby Users ]

5 KM
10 KM
15 KM

[ Global Users ]
```

The selected option is sent to the backend.

The backend queries MongoDB and returns the relevant users.

---

## Step 4 — Send Friend Request

The user selects another user and sends a friend request.

```text
User A
   ↓
Select User B
   ↓
Send Friend Request
   ↓
Backend
   ↓
Friend Request Stored
   ↓
User B
```

---

## Step 5 — Accept Friend Request

User B receives the request and accepts it.

```text
User B
   ↓
Accept Request
   ↓
Backend
   ↓
Connection Established
   ↓
Chat Access Granted
```

Only after this connection is established can the two users start a private conversation.

---

# 💬 Step 6 — Start Encrypted Chat

After the connection is established:

```text
User A
   ↓
Open Chat
   ↓
Write Message
   ↓
Encrypt Message
   ↓
Send Through Socket.io
   ↓
Backend
   ↓
User B
   ↓
Decrypt Message
   ↓
Display Message
```

This creates a real-time private communication channel between connected users.

---

# ⚡ Socket.io Architecture

Socket.io is responsible for real-time events such as:

* User connection
* User disconnection
* Online status
* Real-time messages
* Chat events
* Connection-related updates

Example conceptual flow:

```text
             Socket.io Server
              /           \
             /             \
            ▼               ▼
        User A            User B
          │                  │
          │──── Message ────▶│
          │                  │
          │◀─── Response ────│
```

---

# 🗄️ Backend Technology Stack

| Technology     | Purpose                          |
| -------------- | -------------------------------- |
| **Node.js**    | Backend runtime                  |
| **TypeScript** | Type-safe development            |
| **Express.js** | REST API framework               |
| **MongoDB**    | Data persistence                 |
| **Mongoose**   | MongoDB ODM                      |
| **JWT**        | Authentication                   |
| **Cookies**    | Authentication/session transport |
| **Socket.io**  | Real-time communication          |

---

# 🎨 Frontend Responsibilities

The frontend is responsible for the user-facing experience and client-side operations.

### Authentication

* Registration UI
* Login UI
* Authentication state
* Logout

### User Discovery

* Global user listing
* Radius-based search
* 5 KM search
* 10 KM search
* 15 KM search
* User search

### Social Connection

* Send friend request
* View pending requests
* Accept friend request
* Connected users

### Chat

* Conversation interface
* Real-time message updates
* Online/offline status
* Message encryption/decryption
* Chat history

---

# ⚙️ Backend Responsibilities

The backend handles:

* Authentication
* Authorization
* User management
* User discovery
* Geospatial queries
* Friend-request management
* Connection management
* Chat-related APIs
* Real-time Socket.io communication
* Database operations
* Session/authentication validation

---

# 📁 Suggested Backend Structure

```text
src/
│
├── config/
│   └── database.ts
│
├── controllers/
│   ├── auth.controller.ts
│   ├── user.controller.ts
│   ├── friend.controller.ts
│   └── chat.controller.ts
│
├── middleware/
│   └── auth.middleware.ts
│
├── models/
│   ├── user.model.ts
│   ├── friendRequest.model.ts
│   ├── conversation.model.ts
│   └── message.model.ts
│
├── routes/
│   ├── auth.routes.ts
│   ├── user.routes.ts
│   ├── friend.routes.ts
│   └── chat.routes.ts
│
├── services/
│
├── sockets/
│   └── socket.ts
│
├── utils/
│
├── app.ts
└── server.ts
```

Adapt this structure to the actual repository rather than claiming folders that do not exist.

---

# 🔄 High-Level User Journey

```text
                    ┌──────────────┐
                    │    Register  │
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │     Login    │
                    └──────┬───────┘
                           ▼
                    ┌──────────────┐
                    │ Find Users   │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              ▼                         ▼
       Radius Search              Global Search
              │
       ┌──────┼──────┐
       ▼      ▼      ▼
      5KM   10KM   15KM
              │
              ▼
       ┌──────────────┐
       │ Select User  │
       └──────┬───────┘
              ▼
       ┌──────────────┐
       │ Friend Request│
       └──────┬───────┘
              ▼
       ┌──────────────┐
       │ Accept Request│
       └──────┬───────┘
              ▼
       ┌──────────────┐
       │   Connected  │
       └──────┬───────┘
              ▼
       ┌──────────────┐
       │ Encrypted Chat│
       └──────┬───────┘
              ▼
       ┌──────────────┐
       │ Real-Time Msg│
       │  Socket.io   │
       └──────────────┘
```

---

# 🛡️ Privacy Model

CipherLink is designed around the principle that users should have control over **who they communicate with**.

The communication model follows:

```text
Discover
   ↓
Request Connection
   ↓
Accept Connection
   ↓
Start Private Chat
```

This prevents users from immediately messaging arbitrary users without first establishing a connection.

The geographical discovery feature additionally allows users to choose between **nearby discovery** and **global discovery**.

---

# 🎯 Project Goals

CipherLink aims to combine:

* Secure authentication
* Privacy-focused communication
* End-to-end encrypted messaging
* Real-time communication
* Controlled user connections
* Location-based user discovery
* Global user discovery
* Scalable backend architecture

The project demonstrates how a modern backend can combine **REST APIs, WebSockets, authentication, geospatial queries, database persistence, and encrypted communication** into a single real-time application.

---

# 🔮 Future Improvements

Possible future enhancements include:

* Message read receipts
* Typing indicators
* Message reactions
* Message editing and deletion
* Push notifications
* Message search
* Pagination
* Group conversations
* Voice and video calls
* Redis-based Socket.io scaling
* Rate limiting
* API documentation with Swagger/OpenAPI
* Cloud-based media storage
* Multi-device encryption
* Key rotation and recovery mechanisms

---

# 📄 License

This project is intended for learning, development, and demonstration purposes.

---

## Built With

**Node.js • TypeScript • Express.js • MongoDB • Mongoose • JWT • Cookies • Socket.io**

### CipherLink — Private connections. Real-time communication. Secure messaging.
