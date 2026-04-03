# CodeMenti – 1-on-1 Mentor-Student Platform

A production-level real-time collaboration platform for mentors and students, featuring:

- **Real-time collaborative code editing** (Monaco Editor + WebSocket)
- **Live chat** with message persistence
- **1-on-1 video calling** (WebRTC with backend signaling)
- **JWT-based authentication** with role management (Mentor / Student)
- **Session management** with unique invite links

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Code Editor | Monaco Editor |
| Real-time | WebSocket (STOMP / SockJS), Yjs CRDT |
| Backend | Spring Boot 3, Spring Security, Spring Data JPA |
| Auth | JWT (jjwt) |
| Database | PostgreSQL |
| Video | WebRTC (signaling via backend WebSocket) |

## Project Structure

```
codementi/
├── backend/          # Spring Boot (Java 17)
│   └── src/main/java/com/codementra/platform/
│       ├── config/       # Security, CORS
│       ├── controller/   # REST endpoints
│       ├── dto/          # Request/Response DTOs
│       ├── entity/       # JPA entities
│       ├── exception/    # Global error handling
│       ├── repository/   # Spring Data repos
│       ├── security/     # JWT filter & util
│       ├── service/      # Business logic
│       └── websocket/    # STOMP controllers & messages
└── frontend/         # Next.js (TypeScript)
    └── src/
        ├── app/          # App Router pages
        │   ├── auth/     # Login / Register
        │   ├── dashboard/
        │   └── session/[id]/
        ├── lib/          # API client, WebSocket, auth utils
        └── types/        # Shared TypeScript types
```

## Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL 14+

### Backend

```bash
cd backend

# Configure database
# Edit src/main/resources/application.properties
# or set environment variables:
export DB_URL=jdbc:postgresql://localhost:5432/mentor_db
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export JWT_SECRET=your_secret_key

./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
# Edit .env.local with your backend URL

npm install
npm run dev
```

Frontend runs on `http://localhost:3000`

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (name, email, password, role) |
| POST | `/api/auth/login` | Login (email, password) → JWT |

### Sessions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Create session (mentor only) |
| POST | `/api/sessions/join/{token}` | Join session by invite token |
| POST | `/api/sessions/{id}/end` | End session |
| GET | `/api/sessions/{id}` | Get session details |
| GET | `/api/sessions/my` | Get current user's sessions |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions/{id}/messages` | Get chat history |

### Code Snapshots
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/sessions/{id}/code/latest` | Get latest code snapshot |
| POST | `/api/sessions/{id}/code/snapshot` | Save code snapshot |

## WebSocket Topics (STOMP)

| Destination | Description |
|-------------|-------------|
| `/app/session/{id}/chat` | Send chat message |
| `/topic/session/{id}/chat` | Receive chat messages |
| `/app/session/{id}/code` | Send code update |
| `/topic/session/{id}/code` | Receive code updates |
| `/app/session/{id}/signal` | Send WebRTC signal |
| `/topic/session/{id}/signal` | Receive WebRTC signals |

## Database Schema

```sql
users (id, name, email, password_hash, role, created_at)
sessions (id, mentor_id, student_id, status, invite_token, created_at, ended_at)
messages (id, session_id, sender_id, content, created_at)
code_snapshots (id, session_id, code, language, created_at)
```

## Deployment

### Docker Compose

```bash
# Coming soon: docker-compose.yml
docker compose up
```

### Frontend → Vercel
Set environment variables:
- `NEXT_PUBLIC_API_URL` → your backend URL
- `NEXT_PUBLIC_WS_URL` → your backend WebSocket URL

### Backend → Railway / Render / Docker
Set environment variables:
- `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`
- `CORS_ORIGINS` → your frontend URL
