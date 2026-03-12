# UCP Connect - Tech Stack & Architecture

## Project Overview

**UCP Connect** is a campus task marketplace platform that enables students to post, accept, and complete tasks within their university community. The platform includes a points-based reward system, real-time chat, user reputation tracking, and task management features.

---

## Tech Stack

### **Frontend**
- **Next.js 14** - React framework with App Router for server-side rendering and routing
- **React 18** - UI library for building interactive user interfaces
- **TypeScript** - Type-safe JavaScript for better development experience
- **Tailwind CSS** - Utility-first CSS framework for rapid UI development
- **Socket.IO Client** - Real-time bidirectional communication for chat functionality

### **Backend**
- **Next.js API Routes** - Serverless API endpoints built into Next.js
- **Custom Node.js Server** (`server.ts`) - HTTP server for Socket.IO integration
- **Socket.IO Server** - WebSocket server for real-time chat messaging
- **Prisma ORM** - Type-safe database client and schema management
- **SQLite** - Lightweight relational database for development
- **JWT (jsonwebtoken)** - Token-based authentication
- **bcryptjs** - Password hashing and security
- **Zod** - Schema validation for API inputs

### **Development Tools**
- **tsx** - TypeScript execution engine for running server
- **ESLint** - Code linting and quality checks
- **Prisma Studio** - Database GUI for development
- **Git** - Version control

---

## Architecture Overview

### **Authentication System**
- JWT-based authentication with token storage in localStorage
- Password hashing using bcryptjs
- Protected routes using custom middleware (`withAuth`, `withRole`, `withRateLimit`)
- User roles: USER, TRUSTED, ADMIN

### **Database Schema**
The application uses Prisma with SQLite and includes the following models:

1. **User** - User accounts with points, reputation, and levels
2. **Profile** - Extended user information (name, bio, avatar)
3. **Department** - University departments for task categorization
4. **Task** - Task posts with status tracking (OPEN, ACCEPTED, COMPLETED, CANCELLED)
5. **Message** - Real-time chat messages between users
6. **Rating** - User ratings after task completion
7. **PointTransaction** - History of point changes
8. **ReputationHistory** - Reputation change tracking

### **Key Features**

#### **1. Task Management**
- Create tasks with categories (ERRAND, LOST, BOOK, TUTORING, OTHER)
- Task urgency levels (LOW, MEDIUM, HIGH)
- Point-based rewards (1-100 points)
- Task lifecycle: OPEN → ACCEPTED → COMPLETED
- Automatic task expiration
- Location and image support

#### **2. Points & Reputation System**
- Users earn points by completing tasks
- Points are deducted when posting tasks
- Reputation increases with task completion and positive ratings
- User levels: NEW → BRONZE → SILVER → GOLD → ELITE
- Anti-farming protection (limits tasks between same users)

#### **3. Real-Time Chat**
- Socket.IO-based messaging system
- Task-specific chat rooms
- Chat available only after task acceptance
- Message history persistence
- Automatic completion notifications

#### **4. User Dashboard**
- View posted tasks
- Track accepted tasks
- Monitor points and reputation
- Quick access to active tasks

---

## Project Structure

```
d:\Ucp\
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication endpoints
│   │   ├── tasks/                # Task CRUD operations
│   │   ├── messages/             # Message retrieval
│   │   └── ratings/              # Rating system
│   ├── dashboard/                # User dashboard page
│   ├── tasks/                    # Task listing and detail pages
│   │   ├── [id]/                 # Dynamic task detail page
│   │   └── new/                  # Task creation form
│   ├── login/                    # Login page
│   └── register/                 # Registration page
├── components/                   # Reusable React components
│   ├── Chat.tsx                  # Real-time chat component
│   ├── Navbar.tsx                # Navigation bar
│   └── RatingForm.tsx            # Task rating component
├── lib/                          # Utility libraries
│   ├── auth.ts                   # JWT token management
│   ├── db.ts                     # Prisma client instance
│   ├── middleware.ts             # Auth & rate limiting middleware
│   ├── points.ts                 # Points & reputation logic
│   └── socket.ts                 # Socket.IO server setup
├── hooks/                        # Custom React hooks
│   └── useAuth.ts                # Authentication hook
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Database seeding script
├── scripts/                      # Utility scripts
│   └── cleanup-tasks.ts          # Database cleanup
├── server.ts                     # Custom Node.js server
└── package.json                  # Dependencies
```

---

## API Endpoints

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### **Tasks**
- `GET /api/tasks` - List all tasks (with filters)
- `POST /api/tasks` - Create new task
- `GET /api/tasks/[id]` - Get task details
- `POST /api/tasks/[id]/accept` - Accept a task
- `POST /api/tasks/[id]/complete` - Mark task as complete
- `POST /api/tasks/[id]/cancel` - Cancel a task

### **Messages**
- `GET /api/messages?taskId=xxx` - Get chat history for a task

### **Ratings**
- `POST /api/ratings` - Submit a rating

---

## Security Features

1. **Password Security** - bcryptjs hashing with salt
2. **JWT Authentication** - Secure token-based auth
3. **Rate Limiting** - Prevents API abuse
4. **Input Validation** - Zod schema validation on all inputs
5. **SQL Injection Protection** - Prisma ORM parameterized queries
6. **CORS Configuration** - Controlled cross-origin requests
7. **Point Farming Prevention** - Limits repeated tasks between users

---

## Real-Time Features

### **Socket.IO Integration**
- Custom server setup in `server.ts`
- Authentication middleware for socket connections
- Task-specific chat rooms
- Events:
  - `join-task` - Join a task's chat room
  - `leave-task` - Leave a task's chat room
  - `send-message` - Send a message
  - `new-message` - Receive a message

---

## Development Workflow

### **Setup**
```bash
npm install
npx prisma db push
npx prisma db seed
npm run dev
```

### **Database Management**
```bash
npx prisma studio        # Open database GUI
npx prisma db push       # Push schema changes
npx prisma migrate dev   # Create migrations
```

### **Scripts**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:seed` - Seed database with sample data

---

## Future Enhancements

- [ ] PostgreSQL/MySQL for production
- [ ] Redis for session management and caching
- [ ] File upload for task images
- [ ] Push notifications
- [ ] Email notifications
- [ ] Advanced search and filtering
- [ ] Task categories expansion
- [ ] Mobile responsive improvements
- [ ] Admin dashboard
- [ ] Analytics and reporting

---

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## License

This project is built for educational purposes as part of a university campus task marketplace system.
