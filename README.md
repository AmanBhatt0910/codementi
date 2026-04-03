# MentorSpace — Real-Time 1-on-1 Mentor–Student Platform

A production-grade collaborative coding platform with live video, CRDT-based code editing, and real-time chat.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Editor | Monaco Editor + Yjs (CRDT) |
| Real-time | WebSocket (STOMP via SockJS) |
| Backend | Spring Boot 3.2, Spring Security, Spring Data JPA |
| Auth | JWT (jjwt 0.12) |
| Database | PostgreSQL 16 |
| Video | WebRTC (signaling via WebSocket) |
| Containers | Docker + Docker Compose |

---

## Project Structure

```
mentor-platform/
├── backend/                          # Spring Boot application
│   ├── src/main/java/com/mentorplatform/
│   │   ├── MentorPlatformApplication.java
│   │   ├── config/
│   │   │   ├── SecurityConfig.java   # JWT + CORS + Spring Security
│   │   │   └── WebSocketConfig.java  # STOMP + SockJS + JWT handshake
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── SessionController.java
│   │   │   └── GlobalExceptionHandler.java
│   │   ├── websocket/
│   │   │   └── SessionWebSocketController.java  # Chat + Code + Signaling
│   │   ├── dto/
│   │   │   ├── AuthDto.java
│   │   │   ├── SessionDto.java
│   │   │   └── MessageDto.java       # Chat, CodeUpdate, Signaling, Events
│   │   ├── entity/
│   │   │   ├── User.java             # Implements UserDetails
│   │   │   ├── Session.java
│   │   │   ├── Message.java
│   │   │   └── CodeSnapshot.java
│   │   ├── repository/
│   │   │   ├── UserRepository.java
│   │   │   ├── SessionRepository.java
│   │   │   ├── MessageRepository.java
│   │   │   └── CodeSnapshotRepository.java
│   │   ├── service/
│   │   │   ├── AuthService.java      # Also implements UserDetailsService
│   │   │   ├── SessionService.java
│   │   │   ├── MessageService.java
│   │   │   └── CodeSnapshotService.java
│   │   └── security/
│   │       ├── JwtUtil.java
│   │       └── JwtAuthenticationFilter.java
│   ├── src/main/resources/
│   │   └── application.properties
│   ├── pom.xml
│   └── Dockerfile
│
├── frontend/                         # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx            # Root layout + fonts + Toaster
│   │   │   ├── globals.css           # Tailwind + custom CSS
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── layout.tsx        # Auth guard
│   │   │   │   └── page.tsx          # Sessions list + create/join modals
│   │   │   └── session/[id]/
│   │   │       ├── layout.tsx        # Auth guard
│   │   │       └── page.tsx          # Main session room
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── SessionHeader.tsx
│   │   │   ├── editor/
│   │   │   │   └── CollaborativeEditor.tsx  # Monaco + Yjs CRDT
│   │   │   ├── chat/
│   │   │   │   └── ChatPanel.tsx
│   │   │   └── video/
│   │   │       └── VideoPanel.tsx    # WebRTC UI
│   │   ├── hooks/
│   │   │   ├── useStomp.ts           # STOMP WebSocket hook
│   │   │   └── useWebRTC.ts          # WebRTC peer connection hook
│   │   ├── lib/
│   │   │   └── api.ts                # Axios API client
│   │   ├── store/
│   │   │   ├── authStore.ts          # Zustand auth state (persisted)
│   │   │   └── sessionStore.ts       # Zustand session state
│   │   └── types/
│   │       └── index.ts              # All TypeScript interfaces
│   ├── package.json
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── Dockerfile
│
└── docker-compose.yml
```

---

## Quick Start

### Option A — Docker Compose (recommended)

```bash
# Clone and start everything
git clone <repo>
cd mentor-platform
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5432

---

### Option B — Local Development

#### 1. Database

```bash
# Start PostgreSQL (or use existing)
docker run -d \
  --name mentor_db \
  -e POSTGRES_DB=mentorplatform \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16-alpine
```

#### 2. Backend

```bash
cd backend

# Copy and configure
cp src/main/resources/application.properties src/main/resources/application.properties

# Run with Maven
./mvnw spring-boot:run

# Or with environment overrides
DATABASE_URL=jdbc:postgresql://localhost:5432/mentorplatform \
DB_USERNAME=postgres \
DB_PASSWORD=postgres \
./mvnw spring-boot:run
```

#### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create env file
cp .env.local.example .env.local
# Edit .env.local:
#   NEXT_PUBLIC_API_URL=http://localhost:8080
#   NEXT_PUBLIC_WS_URL=http://localhost:8080/ws

# Start dev server
npm run dev
```

---

## REST API Reference

### Auth

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/api/auth/register` | `{name, email, password, role}` | None |
| POST | `/api/auth/login` | `{email, password}` | None |
| GET | `/api/auth/me` | — | Bearer |

**Roles:** `MENTOR` or `STUDENT`

### Sessions

| Method | Endpoint | Body | Auth |
|--------|----------|------|------|
| POST | `/api/sessions` | `{title}` | Mentor only |
| POST | `/api/sessions/join` | `{sessionCode}` | Bearer |
| POST | `/api/sessions/:id/end` | — | Bearer |
| GET | `/api/sessions/me` | — | Bearer |
| GET | `/api/sessions/:id` | — | Bearer |
| GET | `/api/sessions/code/:code` | — | Bearer |
| GET | `/api/sessions/:id/messages` | — | Bearer |
| GET | `/api/sessions/:id/snapshot` | — | Bearer |

---

## WebSocket / STOMP Reference

Connect to: `ws://localhost:8080/ws` (SockJS fallback)

**Auth header on CONNECT:**
```
Authorization: Bearer <jwt_token>
```

### Subscribe (client → server destinations)

| Topic | Description |
|-------|-------------|
| `/topic/session/{id}/chat` | Receive chat messages |
| `/topic/session/{id}/code` | Receive code updates |
| `/topic/session/{id}/signal` | Receive WebRTC signals |
| `/topic/session/{id}/events` | Receive user join/leave events |

### Publish (client → app destinations)

| Destination | Payload | Description |
|-------------|---------|-------------|
| `/app/session/{id}/chat` | `{content}` | Send chat message |
| `/app/session/{id}/code` | `{type, content, language}` | Send code update |
| `/app/session/{id}/signal` | `{type, payload}` | Send WebRTC signal |
| `/app/session/{id}/join` | `{}` | Announce presence |
| `/app/session/{id}/leave` | `{}` | Announce departure |

### Signal Types (WebRTC)

| Type | Description |
|------|-------------|
| `CALL_REQUEST` | Initiator sends SDP offer |
| `CALL_ACCEPTED` | Receiver sends SDP answer |
| `CALL_REJECTED` | Receiver declines call |
| `ICE_CANDIDATE` | Exchange ICE candidates |
| `CALL_ENDED` | Either party ends call |

---

## Database Schema

```sql
-- users
CREATE TABLE users (
  id         UUID PRIMARY KEY,
  email      VARCHAR UNIQUE NOT NULL,
  password   VARCHAR NOT NULL,
  name       VARCHAR NOT NULL,
  role       VARCHAR NOT NULL,  -- MENTOR | STUDENT
  avatar_url VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- sessions
CREATE TABLE sessions (
  id           UUID PRIMARY KEY,
  mentor_id    UUID REFERENCES users(id),
  student_id   UUID REFERENCES users(id),
  title        VARCHAR NOT NULL,
  session_code VARCHAR(8) UNIQUE NOT NULL,
  status       VARCHAR NOT NULL,  -- WAITING | ACTIVE | ENDED
  created_at   TIMESTAMP,
  started_at   TIMESTAMP,
  ended_at     TIMESTAMP
);

-- messages
CREATE TABLE messages (
  id         UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  sender_id  UUID REFERENCES users(id),
  message    TEXT NOT NULL,
  sent_at    TIMESTAMP
);

-- code_snapshots
CREATE TABLE code_snapshots (
  id         UUID PRIMARY KEY,
  session_id UUID UNIQUE REFERENCES sessions(id),
  content    TEXT,
  language   VARCHAR,
  updated_at TIMESTAMP
);
```

> Hibernate auto-creates these tables on first run (`spring.jpa.hibernate.ddl-auto=update`).

---

## Real-Time Flow

```
User types in Monaco Editor
        ↓
  Yjs CRDT processes change (conflict-free merge)
        ↓
  MonacoBinding syncs text ↔ Y.Text
        ↓
  Yjs observer fires → debounced onCodeChange()
        ↓
  STOMP publish → /app/session/{id}/code
        ↓
  Spring WebSocket Controller receives
        ↓
  Persists snapshot to PostgreSQL (CodeSnapshot)
        ↓
  Broadcasts to /topic/session/{id}/code
        ↓
  Other client receives → applyRemoteUpdate()
        ↓
  Yjs transact → Y.Text updated
        ↓
  MonacoBinding reflects in editor
```

---

## Video Call Flow (WebRTC)

```
Caller clicks "Start Call"
    → getUserMedia() for local stream
    → RTCPeerConnection created
    → createOffer() → SDP generated
    → STOMP publish CALL_REQUEST + offer
        ↓ (via Spring WebSocket relay)
    Receiver gets CALL_REQUEST
    → "Ringing" state shown
    → User clicks "Answer"
    → getUserMedia() for local stream
    → setRemoteDescription(offer)
    → createAnswer() → SDP generated
    → STOMP publish CALL_ACCEPTED + answer
        ↓
    Caller receives CALL_ACCEPTED
    → setRemoteDescription(answer)
    → ICE candidates exchanged both ways
    → P2P video stream established
```

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm install -g vercel
vercel

# Set env vars in Vercel dashboard:
# NEXT_PUBLIC_API_URL = https://your-backend.railway.app
# NEXT_PUBLIC_WS_URL  = https://your-backend.railway.app/ws
```

### Backend → Railway / Render

**Railway:**
```bash
cd backend
railway login
railway new
railway up

# Set env vars in Railway dashboard:
# DATABASE_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET, CORS_ORIGINS
```

**Render (Docker):**
- Connect GitHub repo
- Choose "Docker" environment
- Root directory: `backend`
- Set environment variables

### Backend → Docker (any VPS)

```bash
cd backend
docker build -t mentor-backend .
docker run -d \
  -p 8080:8080 \
  -e DATABASE_URL=jdbc:postgresql://host:5432/mentorplatform \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=your_jwt_secret_min_32_chars \
  -e CORS_ORIGINS=https://your-frontend.vercel.app \
  mentor-backend
```

---

## Environment Variables

### Backend (`application.properties` / env)

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `jdbc:postgresql://localhost:5432/mentorplatform` | PostgreSQL JDBC URL |
| `DB_USERNAME` | `postgres` | DB username |
| `DB_PASSWORD` | `postgres` | DB password |
| `JWT_SECRET` | *(base64 key)* | Min 32-char secret for signing JWTs |
| `JWT_EXPIRATION` | `86400000` | Token TTL in milliseconds (24h) |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated allowed origins |
| `PORT` | `8080` | Server port |

### Frontend (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL |
| `NEXT_PUBLIC_WS_URL` | WebSocket endpoint URL |

---

## Key Design Decisions

### CRDT with Yjs
- `Y.Doc` per session with `Y.Text` for the editor content
- `MonacoBinding` from `y-monaco` binds Yjs state to Monaco model
- All edits flow through Yjs → conflict-free on concurrent writes
- Full content snapshots sent via WebSocket and persisted every 500ms

### WebSocket Stability
- SockJS fallback for environments blocking raw WS
- STOMP heartbeats every 4s
- Exponential backoff reconnection (up to 30s) via `@stomp/stompjs`
- JWT auth on CONNECT frame (not HTTP handshake) via ChannelInterceptor

### Security
- JWT validated on every REST request via `OncePerRequestFilter`
- JWT validated on WebSocket CONNECT via `ChannelInterceptor`
- BCrypt password hashing
- CORS locked to configured origins
- Session ownership validated before end/modify operations

---

## License

MIT
