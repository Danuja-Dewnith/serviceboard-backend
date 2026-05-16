# ServiceBoard — Backend

An Express.js REST API with MongoDB for the ServiceBoard mini service request board.

Built as part of the Full-Stack Developer Intern assessment for GlobalTNA.

---

## 🌐 Live Demo

| | URL |
|---|---|
| **API Base** | [https://serviceboard-backend-production.up.railway.app/api](https://serviceboard-backend-production.up.railway.app/api) |
| **Health Check** | [https://serviceboard-backend-production.up.railway.app/api/test](https://serviceboard-backend-production.up.railway.app/api/test) |
| **Frontend** | [https://serviceboard-frontend.vercel.app](https://serviceboard-frontend.vercel.app) |

---

## ✨ Features

- Full CRUD for job requests
- JWT authentication (register / login)
- Role-based access — homeowner vs service provider
- Category and status filtering
- Keyword search
- Email notifications on job acceptance / completion
- Seed script for sample data

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Web framework |
| MongoDB Atlas | Cloud database |
| Mongoose | ODM |
| JSON Web Token | Authentication |
| bcryptjs | Password hashing |
| Nodemailer | Email notifications |
| CORS | Cross-origin requests |
| dotenv | Environment config |
| nodemon | Dev auto-restart |

---

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js
├── models/
│   ├── JobRequest.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── jobRoutes.js
│   └── userRoutes.js
├── services/
│   └── emailService.js
├── scripts/
│   └── seed.js
├── .env
├── server.js
└── package.json
```

---

## 📊 Database Schema

### JobRequest

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | String | Yes | |
| `description` | String | Yes | |
| `category` | String | Yes | Plumbing, Electrical, Painting, Joinery, etc. |
| `location` | String | Yes | |
| `contactName` | String | Yes | |
| `contactEmail` | String | Yes | Valid email |
| `status` | Enum | No | `Open` \| `In Progress` \| `Closed` — default: `Open` |
| `user` | ObjectId | Yes | Ref → User who posted |
| `acceptedBy` | ObjectId | No | Ref → Provider who accepted |
| `acceptedAt` | Date | No | |
| `completedBy` | ObjectId | No | Ref → Provider who completed |
| `completedAt` | Date | No | |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

### User

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | String | Yes | |
| `email` | String | Yes | Unique, lowercase |
| `password` | String | Yes | Min 6 chars, hashed |
| `role` | Enum | No | `homeowner` \| `provider` — default: `homeowner` |
| `isActive` | Boolean | No | Default: `true` |
| `createdAt` | Date | Auto | |
| `updatedAt` | Date | Auto | |

---

## 🔌 API Endpoints

### Jobs

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/jobs` | No | List all jobs — supports `?category` and `?status` query params |
| GET | `/api/jobs/:id` | No | Get single job |
| POST | `/api/jobs` | Yes | Create new job |
| PATCH | `/api/jobs/:id` | No | Update job status |
| DELETE | `/api/jobs/:id` | Yes | Delete job |
| GET | `/api/jobs/my-jobs` | Yes | Jobs posted by current user |
| GET | `/api/jobs/provider-jobs` | Yes | Jobs accepted by current provider |

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login, returns JWT |
| GET | `/api/auth/me` | Yes | Get current user info |

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | No | List all users |
| GET | `/api/users/:id` | No | Get single user |
| PUT | `/api/users/:id` | No | Update user |
| DELETE | `/api/users/:id` | No | Delete user |

---

## 💡 Example Requests

**Register**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"123456","role":"homeowner"}'
```

**Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'
```

**Create a job**
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"title":"Fix Leaking Tap","description":"Kitchen tap is leaking","category":"Plumbing","location":"Colombo","contactName":"John","contactEmail":"john@example.com"}'
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root of this directory. **Never commit this file to GitHub.**

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/serviceboard?retryWrites=true&w=majority

# Auth
JWT_SECRET=your_long_random_secret_key_here

# Email (optional — for notifications bonus feature)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com
```

> **Note:** For `EMAIL_PASS`, use a Gmail App Password (not your account password). Generate one at Google Account → Security → 2-Step Verification → App Passwords.

> **Important:** Make sure `.env` is listed in your `.gitignore` so credentials are never pushed to GitHub.

---

## 🚀 Running Locally

### Prerequisites

- Node.js v18+
- MongoDB Atlas account (free tier) or local MongoDB

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/Danuja-Dewnith/serviceboard-backend.git
cd serviceboard-backend

# 2. Install dependencies
npm install

# 3. Add environment variables
# Create a .env file and fill in your values (see Environment Variables above)

# 4. Start the server
npm run dev      # development — auto-restarts with nodemon
npm start        # production — runs node server.js directly
```

> `npm run dev` uses `nodemon`, which is installed as a dev dependency via `npm install` — no global install needed.

API runs at `http://localhost:5000`

### Seed Sample Data (optional)

```bash
node scripts/seed.js
```

Inserts 5–10 sample jobs into the database.

---

## 🚢 Deployment (Railway)

1. Push this repository to GitHub (must be **public**)
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select this repository
4. Add all environment variables from `.env` in the Railway dashboard
5. Click Deploy

---

## 🔗 Related

- **Frontend Repository:** [serviceboard-frontend](https://github.com/Danuja-Dewnith/serviceboard-frontend)

---

## 👨‍💻 Author

**Danuja Dewnith**
- Email: danujadewnith@gmail.com
- GitHub: [@Danuja-Dewnith](https://github.com/Danuja-Dewnith)

---

## 📅 Submission

- **Assessment:** Full-Stack Developer Intern — GlobalTNA
- **Submission Date:** 18 May 2026