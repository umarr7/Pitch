# UCP Connect - Campus Task Marketplace

A production-ready MVP for a campus-only task marketplace app inspired by Uber/Foodpanda, but for student-to-student micro-tasks inside a university campus.

## 🚀 Features

### Core Features
- **Task System**: Post, accept, complete, and manage micro-tasks
- **Real-time Chat**: One-to-one chat opens after task acceptance
- **Points Economy**: Earn and spend points (no cash payments)
- **Reputation System**: Build reputation through task completion and ratings
- **User Levels**: NEW → BRONZE → SILVER → GOLD → ELITE with feature gating
- **Departments**: Department-specific feeds and filtering
- **Leaderboard**: Weekly, all-time, and department-wise rankings
- **Ratings & Reviews**: Rate after task completion
- **Lost & Found**: Special category with image support

### Security Features
- JWT-based authentication
- Rate limiting
- Task posting cooldowns
- Point farming prevention
- Server-side validation

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT (Email + Password)
- **Real-time**: Socket.IO
- **Deployment Ready**: Environment variables, migrations, seed scripts

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

## 🔧 Installation & Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd Ucp
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp env.example .env
```

Edit `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ucp_connect?schema=public"

# JWT Secret (generate a strong random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Next.js
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Points Configuration
POINTS_REQUIRED_TO_POST_TASK=10
POINTS_EARNED_FOR_COMPLETION=15
POINTS_DEDUCTED_FOR_POSTING=10

# Reputation Configuration
REP_FOR_TASK_COMPLETION=5
REP_FOR_POSITIVE_RATING=3
REP_LOST_FOR_NEGATIVE_RATING=2

# User Level Thresholds
REP_BRONZE=50
REP_SILVER=150
REP_GOLD=300
REP_ELITE=600

# Task Configuration
TASK_EXPIRY_HOURS=24
TASK_POST_COOLDOWN_MINUTES=30

# Rate Limiting
RATE_LIMIT_REQUESTS_PER_MINUTE=60
```

### 4. Set up the database

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database with sample data
npm run db:seed
```

### 5. Run the development server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🧪 Test Credentials

After seeding, you can use these test accounts:

**Admin:**
- Email: `admin@ucp.edu`
- Password: `admin123`

**Regular Users:**
- Email: `john.doe@ucp.edu`
- Password: `user123`
- Email: `jane.smith@ucp.edu`
- Password: `user123`

## 📁 Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── tasks/         # Task CRUD operations
│   │   ├── messages/      # Chat/messaging
│   │   ├── ratings/       # Ratings & reviews
│   │   └── leaderboard/   # Leaderboard data
│   ├── dashboard/         # Dashboard page
│   ├── tasks/             # Task pages (list, detail, create)
│   ├── leaderboard/       # Leaderboard page
│   ├── login/             # Login page
│   └── register/          # Registration page
├── components/            # React components
│   ├── Navbar.tsx         # Navigation bar
│   └── Chat.tsx           # Chat component
├── hooks/                 # Custom React hooks
│   └── useAuth.tsx        # Authentication hook
├── lib/                   # Utility libraries
│   ├── auth.ts            # JWT authentication
│   ├── db.ts              # Prisma client
│   ├── middleware.ts      # API middleware
│   ├── points.ts          # Points & reputation logic
│   └── socket.ts          # Socket.IO setup
├── prisma/                # Prisma files
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Seed script
└── server.ts              # Custom server for Socket.IO
```

## 🎮 Usage Guide

### User Levels & Features

| Level | Requirement | Unlocks |
|-------|------------|---------|
| NEW | Signup | Accept tasks |
| BRONZE | 50 rep | Post tasks |
| SILVER | 150 rep | Comment/react |
| GOLD | 300 rep | General chat |
| ELITE | 600 rep | Pinned posts, department announcements |

### Task Workflow

1. **Post Task**: Bronze+ users can post tasks (costs 10 points)
2. **Accept Task**: Any user can accept open tasks
3. **Chat**: Chat opens automatically after acceptance
4. **Complete**: Mark task as complete to earn points and reputation
5. **Rate**: Both parties rate each other after completion

### Points System

- **Post Task**: -10 points
- **Complete Task**: +reward points (set by requester)
- **Points are spendable** and required to post tasks

### Reputation System

- **Task Completion**: +5 reputation
- **Positive Rating (4-5 stars)**: +3 reputation
- **Negative Rating (1-2 stars)**: -2 reputation
- **Reputation is non-spendable** and affects level progression

## 🔐 Security Features

- **Rate Limiting**: Prevents API abuse
- **Cooldowns**: 30-minute cooldown between task posts
- **Point Farming Prevention**: Max 5 tasks between same two users per 24 hours
- **JWT Authentication**: Secure token-based auth
- **Server-side Validation**: All inputs validated on server

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Tasks
- `GET /api/tasks` - List tasks (with filters)
- `POST /api/tasks` - Create task
- `GET /api/tasks/[id]` - Get task details
- `DELETE /api/tasks/[id]` - Delete task
- `POST /api/tasks/[id]/accept` - Accept task
- `POST /api/tasks/[id]/complete` - Complete task
- `POST /api/tasks/[id]/cancel` - Cancel task

### Messages
- `GET /api/messages?taskId=xxx` - Get messages for task
- `POST /api/messages` - Send message
- `POST /api/messages/[id]/read` - Mark message as read

### Ratings
- `POST /api/ratings` - Create rating

### Leaderboard
- `GET /api/leaderboard?type=all-time|weekly|department` - Get leaderboard

### Departments
- `GET /api/departments` - List all departments

## 🚢 Deployment

### Build for Production

```bash
npm run build
```

### Run Production Server

```bash
npm start
```

### Database Migrations

For production, use migrations instead of `db push`:

```bash
npx prisma migrate dev --name init
```

## 🧩 Database Schema

Key models:
- **User**: Authentication, points, reputation, level
- **Profile**: User profile information
- **Task**: Task details, status, location
- **Message**: Chat messages
- **Rating**: User ratings
- **PointTransaction**: Points ledger
- **ReputationHistory**: Reputation changes
- **Department**: University departments

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Verify database exists

### Socket.IO / Real-time Chat Not Connecting
Real-time only works when the **custom server** is used. Do **not** run `next dev`; use:

```bash
npm run dev
```

This runs `server.ts`, which starts both Next.js and Socket.IO on the same HTTP server. If you run `next dev`, Socket.IO never starts and the client will stay on "Connecting…" (chat still works via REST polling).

- **Server path**: Socket.IO is served at `/socket.io` (default). The server skips this path so Next.js does not handle it.
- **Check terminal**: When a client connects you should see `[Server] Request to /socket.io` and `[Socket] Connection attempt` in the server log. If you never see these, the app is not using the custom server.
- **Browser console**: On connection failure you’ll see `[Chat] Socket connect_error: <message>`; the UI will switch to "Chat (polling)" and messages will work via REST.
- **Env**: Ensure `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`) matches the URL you open in the browser.

### Authentication Issues
- Clear browser localStorage
- Check JWT_SECRET is set
- Verify token expiration

## 📝 License

This project is built as an MVP for educational/demonstration purposes.

## 🤝 Contributing

This is a production-ready MVP. For production deployment:
1. Use environment-specific configurations
2. Set up proper logging and monitoring
3. Configure Redis for rate limiting (currently in-memory)
4. Set up CI/CD pipeline
5. Add comprehensive error handling
6. Implement proper backup strategies

## 📞 Support

For issues or questions, please refer to the project documentation or contact the development team.

---

**Built with ❤️ for campus communities**
