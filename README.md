# 🎓 Joineazy - Student Group & Assignment Management System

> A full-stack web application that enables students to form groups, manage members, and confirm assignment submissions while professors track progress through an analytics dashboard.

![Tech Stack](https://img.shields.io/badge/React-18.x-blue)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Usage Guide](#usage-guide)
- [Design Decisions](#design-decisions)
- [Deployment](#deployment)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)

---

## 🌟 Overview

Joineazy is a role-based collaboration platform designed for academic institutions where:

- **Students** can create groups, invite members, view assignments, and submit work via OneDrive links with two-step confirmation
- **Professors** can create assignments, assign them to all students or specific groups, and track submission progress through analytics

This project was built as part of a full-stack development assignment to demonstrate proficiency in:
- Modular system design
- Complex data relationships
- Secure API development
- Responsive UI/UX design
- Role-based access control

---

## ✨ Features

### 👨‍🎓 Student Features

- **Account Management**
  - Register with auto-generated Student ID (STU001, STU002...)
  - JWT-based authentication
  - Role-based dashboard

- **Group Management**
  - Create new groups (automatic owner assignment)
  - Invite members via email or Student ID
  - Accept/reject group invitations
  - Direct add members (owner only)
  - View group members with roles

- **Assignment Handling**
  - View assignments assigned to user's groups
  - Access OneDrive submission links
  - Two-step submission confirmation:
    - Step 1: "I have submitted"
    - Step 2: Final confirmation
  - Track submission status per group
  - Visual progress indicators

### 👨‍🏫 Professor/Admin Features

- **Assignment Management**
  - Create assignments with:
    - Title, description, due date
    - OneDrive submission link
    - Target selection (all students OR specific groups)
  - Edit/delete assignments
  - View assignment details

- **Tracking & Analytics**
  - Group-wise submission tracking
  - Student-wise confirmation details
  - Completion rates and statistics
  - Recent activity logs
  - Visual progress bars

---

## 🛠️ Tech Stack

### **Frontend**
- **React.js** (18.x) - UI framework
- **Tailwind CSS** - Styling & responsive design
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Context API** - State management
- **Vite** - Build tool & dev server

### **Backend**
- **Node.js** (18.x) - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** (15.x) - Relational database
- **JWT** - Authentication & authorization
- **bcrypt.js** - Password hashing
- **pg** - PostgreSQL client

### **Development Tools**
- **Git** - Version control
- **Docker** (optional) - Containerization
- **Postman** - API testing
- **dotenv** - Environment configuration

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Dashboard  │  │    Groups    │  │  Assignments │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│         │                   │                   │           │
│         └───────────────────┼───────────────────┘           │
│                             │                               │
│                     ┌───────▼────────┐                     │
│                     │   API Client   │                     │
│                     │    (Axios)     │                     │
│                     └───────┬────────┘                     │
└─────────────────────────────┼──────────────────────────────┘
                              │
                              │ HTTP/JSON
                              │
┌─────────────────────────────▼──────────────────────────────┐
│                         SERVER                              │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Auth Routes  │  │ Group Routes │  │ Admin Routes │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                   ┌────────▼─────────┐                     │
│                   │   Middleware     │                     │
│                   │  (Auth, CORS)    │                     │
│                   └────────┬─────────┘                     │
│                            │                                │
│                   ┌────────▼─────────┐                     │
│                   │     Models       │                     │
│                   │  (Business Logic)│                     │
│                   └────────┬─────────┘                     │
└────────────────────────────┼────────────────────────────────┘
                             │
                             │ SQL Queries
                             │
┌────────────────────────────▼────────────────────────────────┐
│                      DATABASE                               │
│                    (PostgreSQL)                             │
│                                                             │
│  ┌────────┐  ┌────────┐  ┌─────────────┐  ┌───────────┐  │
│  │ Users  │  │ Groups │  │ Assignments │  │Submissions│  │
│  └───┬────┘  └───┬────┘  └──────┬──────┘  └─────┬─────┘  │
│      │           │               │               │         │
│  ┌───▼────────────▼───────────────▼───────────────▼─────┐  │
│  │          Relationships & Constraints                  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ Database Schema

### **Entity Relationship Diagram**

```
┌─────────────────┐
│     USERS       │
├─────────────────┤
│ id (PK)         │
│ name            │
│ email (UNIQUE)  │
│ password_hash   │
│ role            │
│ student_id      │
│ created_at      │
└────────┬────────┘
         │
         │ 1:N (owner)
         │
         ├──────────────────────────────┐
         │                              │
┌────────▼────────┐            ┌────────▼────────────┐
│     GROUPS      │            │   ASSIGNMENTS       │
├─────────────────┤            ├─────────────────────┤
│ id (PK)         │            │ id (PK)             │
│ name            │            │ title               │
│ owner_id (FK)   │            │ description         │
│ created_at      │            │ due_date            │
└────────┬────────┘            │ onedrive_link       │
         │                      │ created_by (FK)     │
         │ N:M                  │ created_at          │
         │                      └──────────┬──────────┘
┌────────▼────────────┐                   │
│  GROUP_MEMBERS      │                   │ 1:N
├─────────────────────┤                   │
│ group_id (FK, PK)   │         ┌─────────▼──────────────┐
│ user_id (FK, PK)    │         │ ASSIGNMENT_TARGETS     │
│ role                │         ├────────────────────────┤
└─────────────────────┘         │ id (PK)                │
                                │ assignment_id (FK)     │
┌─────────────────────┐         │ target_type            │
│ GROUP_INVITATIONS   │         │ group_id (FK)          │
├─────────────────────┤         └────────────────────────┘
│ id (PK)             │
│ group_id (FK)       │         ┌────────────────────────┐
│ invited_user_id (FK)│         │    SUBMISSIONS         │
│ invited_by_user_id  │         ├────────────────────────┤
│ status              │         │ id (PK)                │
│ invited_at          │         │ assignment_id (FK)     │
│ responded_at        │         │ group_id (FK)          │
└─────────────────────┘         │ confirmed_by_user_id   │
                                │ status                 │
                                │ confirmation_step      │
                                │ first_click_at         │
                                │ first_click_by_user_id │
                                │ confirmed_at           │
                                └────────────────────────┘
```

### **Key Relationships**

1. **Users → Groups**: One-to-Many (owner relationship)
2. **Users ↔ Groups**: Many-to-Many (via `group_members`)
3. **Users → Assignments**: One-to-Many (creator)
4. **Groups ↔ Assignments**: Many-to-Many (via `assignment_targets`)
5. **Groups + Assignments → Submissions**: Composite relationship

---

## 🚀 Installation & Setup

### **Prerequisites**

- Node.js (v18.x or higher)
- PostgreSQL (v15.x or higher)
- npm or yarn
- Git

### **1. Clone Repository**

```bash
git clone https://github.com/yourusername/joineazy.git
cd joineazy
```

### **2. Database Setup**

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE joineazy;
\q
```

### **3. Backend Setup**

```bash
cd backend
npm install

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/joineazy
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=4000
NODE_ENV=development
EOF

# Start backend server
npm run dev
```

**Expected Output:**
```
Connected to PostgreSQL ✅
Initializing database tables...
Database tables initialized ✅
🚀 Server running on http://localhost:4000
```

### **4. Frontend Setup**

```bash
cd frontend
npm install

# Start development server
npm run dev
```

**Access Application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

---

## 📡 API Documentation

### **Base URL:** `http://localhost:4000/api`

### **Authentication Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |

### **Group Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/groups` | Get user's groups | Yes |
| POST | `/groups` | Create new group | Yes |
| GET | `/groups/available-students` | Get all students for dropdown | Yes |
| GET | `/groups/invitations/pending` | Get pending invitations | Yes |
| POST | `/groups/:id/invite` | Send invitation | Yes |
| POST | `/groups/:id/add-member` | Direct add member (owner only) | Yes |
| POST | `/groups/invitations/:id/respond` | Accept/reject invitation | Yes |

### **Assignment Endpoints (Student)**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/assignments` | Get assignments for student | Yes |
| GET | `/assignments/:id` | Get assignment details | Yes |
| POST | `/assignments/:id/confirm-step1` | First confirmation step | Yes |
| POST | `/assignments/:id/confirm-step2` | Final confirmation | Yes |

### **Admin Endpoints**

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/admin/assignments` | Create assignment | Yes (Admin) |
| GET | `/admin/assignments` | Get all assignments | Yes (Admin) |
| GET | `/admin/assignments/:id` | Get assignment with submissions | Yes (Admin) |
| PUT | `/admin/assignments/:id` | Update assignment | Yes (Admin) |
| DELETE | `/admin/assignments/:id` | Delete assignment | Yes (Admin) |
| GET | `/admin/submissions` | Get all submissions | Yes (Admin) |
| GET | `/admin/analytics` | Get analytics dashboard | Yes (Admin) |

### **Example Request/Response**

#### **Register User**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "Rahul Kumar",
  "email": "rahul@example.com",
  "password": "password123",
  "role": "student"
}
```

**Response:**
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "name": "Rahul Kumar",
    "email": "rahul@example.com",
    "role": "student",
    "student_id": "STU001"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 📖 Usage Guide

### **For Students**

#### **1. Register & Login**
- Register with name, email, password
- Automatic Student ID assigned (STU001, STU002...)
- Login with credentials

#### **2. Create a Group**
- Navigate to Groups page
- Enter group name
- Automatically become owner

#### **3. Add Members**
- **Option A: Send Invitation**
  - Select group
  - Choose student from dropdown
  - Student receives invitation
  - Student accepts/rejects

- **Option B: Direct Add (Owner Only)**
  - Select group
  - Choose student
  - Instantly added to group

#### **4. Submit Assignment**
- View assignments on Assignments page
- Click OneDrive link to upload work
- Step 1: Click "I have submitted"
- Step 2: Click "Confirm" to finalize

### **For Professors/Admins**

#### **1. Create Assignment**
- Go to Admin Panel → Create Assignment
- Fill in details:
  - Title, description, due date
  - OneDrive submission link
- Select target:
  - All students OR specific groups
- Submit

#### **2. Track Submissions**
- View Submissions page
- Select assignment
- See group-wise progress
- View who submitted and when
- Check analytics dashboard

---

## 🎨 Design Decisions

### **1. Two-Step Submission Confirmation**

**Why?**
- Prevents accidental submissions
- Ensures student intent
- Tracks submission process

**Implementation:**
```
Step 0 → Step 1 (First click) → Step 2 (Confirmed)
```

### **2. Invitation System vs Direct Add**

**Invitation System:**
- Respects user autonomy
- Professional approach
- Standard in collaboration tools

**Direct Add (Owner only):**
- Faster group formation
- Reduces friction for trusted groups

### **3. Auto-Generated Student IDs**

**Format:** `STU001`, `STU002`, `STU003`...

**Benefits:**
- Unique identifier
- Easy to remember
- Professional look
- Searchable

### **4. Dropdown Student Selection**

**Better UX than manual typing:**
- No typos
- Visual confirmation
- Shows all registered students
- Filters out existing members

### **5. Role-Based Access Control**

```javascript
Student Access:
- Create groups
- Invite members
- View/submit assignments

Admin Access:
- All student features
- Create assignments
- View analytics
- Track submissions
```

---

## 🚢 Deployment

### **Option 1: Traditional Hosting**

#### **Frontend (Vercel/Netlify)**
```bash
cd frontend
npm run build
# Deploy dist/ folder
```

#### **Backend (Render/Railway)**
```bash
cd backend
# Set environment variables on hosting platform
# Deploy from GitHub
```

#### **Database (Supabase/Neon)**
- Create PostgreSQL instance
- Update DATABASE_URL in backend

### **Option 2: Docker**

```dockerfile
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: joineazy
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/joineazy
    ports:
      - "4000:4000"
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    depends_on:
      - backend
```

**Run:**
```bash
docker-compose up
```

---

## 📸 Screenshots

### **Student Dashboard**
![Dashboard](docs/screenshots/dashboard.png)

### **Group Management**
![Groups](docs/screenshots/groups.png)

### **Assignment Submission**
![Assignments](docs/screenshots/assignments.png)

### **Admin Analytics**
![Analytics](docs/screenshots/analytics.png)

---

## 🔮 Future Enhancements

- [ ] Real-time notifications (Socket.io)
- [ ] File upload directly to server
- [ ] Email notifications for invitations
- [ ] Assignment comments/feedback
- [ ] Group chat functionality
- [ ] Mobile app (React Native)
- [ ] Export analytics to PDF/Excel
- [ ] Assignment grading system
- [ ] Calendar view for due dates
- [ ] Dark mode theme

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@Vansh160205](https://github.com/Vansh160205)
- LinkedIn: [Vansh Vagadia](https://linkedin.com/in/vansh-vagadia)
- Email: vanshvagadia1602@gmail.com

---

## 🙏 Acknowledgments

- Built as part of Joineazy Full-Stack Assignment
- Inspired by modern collaboration platforms (Slack, Teams, Google Classroom)
- Thanks to all open-source contributors

---

## 📞 Support

For support, email support@joineazy.com or open an issue on GitHub.


<div align="center">
  <strong>⭐ Star this repository if you find it helpful!</strong>
</div>

