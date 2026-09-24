# MASCO Election Portal

A web-based election management and live result publication system designed for managing internal organizational elections efficiently through a centralized platform.

The system provides an **Admin Panel** for election management and a **Live Election Dashboard** for publishing and displaying election results.

---

## 🔗 Live Access

| Service | Access |
| --- | --- |
| 🖥️ **Election Dashboard** | [Open Dashboard](https://sojib11111.github.io/Masco-Election-portal/) |
| 🔐 **Admin Panel** | [Open Admin Panel](https://sojib11111.github.io/Masco-Election-portal/admin.html) |
| ⚙️ **API Health Check** | [Check API Status](https://masco-election-portal.onrender.com/api/health) |

> **System Architecture:** The frontend is hosted on **GitHub Pages** and communicates with the **Node.js backend hosted on Render** through REST APIs.

---

## 📌 Project Overview

**MASCO Election Portal** is a centralized web application developed to simplify and digitize the election management process.

The system supports the complete election workflow, including election configuration, section management, candidate management, symbol allocation, vote entry, result calculation, and live result publication.

The application is designed with a responsive interface so that election information and results can be accessed from different screen sizes and devices.

---

## ✨ Key Features

- Secure Admin Login
- Election Configuration
- Branch Management
- Section Management
- Candidate Management
- Candidate Photo Management
- Symbol Management
- Manual Symbol Allocation
- Spin Wheel Symbol Allocation
- Duplicate Symbol Prevention
- Vote Entry
- General Seat Management
- Reserved Women Seat Management
- Automatic Result Calculation
- Tie Result Handling
- Result Preview
- Result Publication
- Live Election Dashboard
- Section-wise Result View
- Voter Turnout Information
- Responsive User Interface
- Automatic Dashboard Refresh
- Data Export
- Centralized Election Data Management
- JSON Data Backup
- REST API Integration

---

## 🏗️ System Architecture

```text
              Admin / User
                   │
                   ▼
          GitHub Pages Frontend
                   │
                   │ HTTPS / REST API
                   ▼
           Node.js Backend API
             Hosted on Render
                   │
                   ▼
             Election Data
            data/election.json
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
     Admin Panel      Election Dashboard
```

---

## 🛠️ Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Fetch API
- CSS Grid
- Flexbox
- Responsive Media Queries
- Canvas / JavaScript
- Browser Session Storage

### Backend

- Node.js
- REST API
- JSON Data Storage
- Authentication
- CORS Configuration
- Automatic Data Backup

### Deployment & Version Control

- Git
- GitHub
- GitHub Pages
- Render

---

## 🖥️ Election Dashboard

The Election Dashboard provides a clear and responsive view of published election results.

### Dashboard Information

- Election Title
- Election Date
- Section-wise Results
- Candidate Name
- Candidate Photo
- Election Symbol
- Received Votes
- General Seat Winners
- Reserved Women Seat Winners
- Total Candidates
- Total Winners
- Voter Turnout
- Published Result Status

The dashboard automatically retrieves the latest election information from the backend API.

---

## 🔐 Admin Panel

The Admin Panel provides centralized control over election configuration and management.

### Admin Functions

- Election Setup
- Branch Setup
- Section Setup
- Candidate Management
- Candidate Photo Management
- Symbol Management
- Symbol Allocation
- Spin Wheel
- Vote Entry
- Result Preview
- Result Publication
- Data Export
- Election Data Management

Administrative operations are protected through backend authentication.

> Admin credentials are intentionally not included in this public repository documentation.

---

## 🎯 Symbol Allocation

The system supports both **Manual Symbol Allocation** and **Spin Wheel Symbol Allocation**.

### Allocation Flow

```text
Select Section
      │
      ▼
Select Candidate
      │
      ▼
Load Available Symbols
      │
      ▼
Spin / Manual Selection
      │
      ▼
Allocate Symbol
      │
      ▼
Save Election Data
```

### Allocation Rules

```text
One Candidate = One Active Symbol
```

Once a symbol has been allocated, the system prevents the same allocated symbol from appearing as available according to the configured allocation scope.

An allocated symbol can also be changed or released through the administrative management interface when required.

---

## 🗳️ Vote Management

The system provides centralized vote entry and result management.

Supported seat categories include:

- সাধারণ আসন
- সংরক্ষিত নারী আসন

The Admin Panel can update candidate vote information, which is then stored through the backend API.

---

## 🏆 Result Management

Election results are calculated and displayed based on the configured election rules and recorded votes.

The result system supports:

- Candidate Vote Ranking
- General Seat Winners
- Reserved Women Seat Winners
- Tie Handling
- Result Preview
- Final Result Publication
- Section-wise Result Display

Published results are displayed through the Election Dashboard.

---

## 📊 Voter Turnout

The dashboard can display voter participation information separately from candidate vote totals.

This is important because a voter may be allowed to vote for multiple candidates depending on the number of available seats.

Therefore, voter turnout is based on actual voter participation rather than simply adding all candidate votes.

---

## 🔄 Data Flow

### Admin Data Update

```text
Admin Panel
     │
     ▼
Frontend JavaScript
     │
     ▼
REST API Request
     │
     ▼
Node.js Backend
     │
     ▼
Election Data Storage
```

### Dashboard Data Flow

```text
Election Dashboard
       │
       ▼
REST API Request
       │
       ▼
Node.js Backend
       │
       ▼
Election Data
       │
       ▼
Updated Dashboard
```

---

## 🌐 Frontend & Backend Integration

The project uses a separated frontend and backend architecture.

### Frontend

Hosted using:

```text
GitHub Pages
```

The frontend contains:

- HTML
- CSS
- JavaScript
- Dashboard UI
- Admin UI
- Client-side election logic

### Backend

Hosted using:

```text
Render
```

The backend handles:

- Election Data API
- Admin Authentication
- Data Read Operations
- Data Write Operations
- JSON Data Management
- Data Backup
- CORS
- API Health Monitoring

---

## 🔌 REST API

The application communicates with the backend using REST APIs.

### Health Check

```http
GET /api/health
```

Used to verify that the backend service is online and responding correctly.

### Election Data

```http
GET /api/data
```

Retrieves the latest election data.

```http
POST /api/data
```

Saves updated election information.

Write operations require valid administrative authentication.

### Authentication

```http
POST /api/auth/login
```

Authenticates an administrator.

```http
GET /api/auth/check
```

Validates the current administrative session/token.

```http
POST /api/auth/logout
```

Ends the current administrative session.

---

## ⚙️ API Configuration

Frontend API configuration is maintained in:

```text
assets/js/api-config.js
```

This configuration allows the frontend hosted on GitHub Pages to communicate with the backend hosted on Render.

Application flow:

```text
GitHub Pages
      │
      ▼
api-config.js
      │
      ▼
Render Backend
      │
      ▼
REST API
```

---

## 📁 Project Structure

```text
Masco-Election-portal/
│
├── index.html
├── admin.html
├── unit-result.html
│
├── server.js
├── package.json
├── render.yaml
│
├── assets/
│   │
│   ├── css/
│   │   └── ...
│   │
│   └── js/
│       ├── api-config.js
│       ├── store.js
│       ├── admin.js
│       ├── result.js
│       └── unit-result.js
│
└── data/
    ├── election.json
    └── backups/
```

---

## 💾 Data Storage

Election information is currently maintained using JSON-based storage.

Main data file:

```text
data/election.json
```

The data structure can contain information such as:

- Election Configuration
- Branches
- Sections
- Candidates
- Candidate Photos
- Symbols
- Symbol Allocations
- Votes
- Booth Information
- Result Configuration
- Published Results

---

## 🛡️ Data Backup

The backend includes a backup mechanism for election data.

Backup files can be maintained under:

```text
data/backups/
```

This provides an additional recovery option if election information is accidentally modified.

---

## 🔒 Security

The project follows several basic security practices:

- Administrative operations require authentication.
- Admin passwords are not documented in the public README.
- Sensitive authentication logic is handled by the backend.
- Election data write operations are protected.
- CORS controls frontend-to-backend communication.
- Production communication uses HTTPS.
- Administrative tokens are validated by the backend.

---

## 📱 Responsive Design

The portal is designed to support different screen sizes.

Responsive technologies include:

- CSS Grid
- Flexbox
- Media Queries
- Responsive Cards
- Responsive Tables
- Adaptive Navigation
- Dynamic Content Layout

The interface can therefore be used from desktops, laptops, tablets, and supported mobile displays.

---

## 🚀 Deployment Architecture

```text
                GitHub Repository
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
        GitHub Pages          Render
          Frontend            Backend
              │                 │
              └────────┬────────┘
                       │
                       ▼
                 Election System
```

GitHub is also used for source-code version control and deployment management.

---

## 🔧 Local Development

### Requirements

- Node.js
- npm
- Git
- Modern Web Browser

### Clone Repository

```bash
git clone https://github.com/Sojib11111/Masco-Election-portal.git
```

Enter the project directory:

```bash
cd Masco-Election-portal
```

Install dependencies:

```bash
npm install
```

Start the Node.js server:

```bash
npm start
```

or:

```bash
node server.js
```

For the standard local configuration, the application can then be accessed through:

```text
http://localhost:8080
```

---

## 📤 Updating the Project

After making changes:

```bash
git add .
```

Commit:

```bash
git commit -m "Update MASCO Election Portal"
```

Push:

```bash
git push
```

The deployment services can then publish the latest version from the GitHub repository.

---

## ⚠️ Production Storage Note

The current version uses:

```text
data/election.json
```

as its primary election data storage.

For testing, development, and demonstration this architecture is simple and effective.

For a critical production election environment, persistent database storage is recommended.

Possible future architecture:

```text
GitHub Pages
      │
      ▼
Node.js / ORDS REST API
      │
      ▼
Oracle Database
```

Possible persistent storage options include:

- Oracle Database
- PostgreSQL
- Managed Cloud Database
- Persistent Server Storage

---

## 🔮 Future Development

Potential future improvements include:

- Oracle Database Integration
- ORDS REST API Integration
- Advanced Role-Based Access Control
- Audit Log
- Admin Activity History
- Election Data Versioning
- Database Backup & Recovery
- Advanced Election Analytics
- Additional Export Reports
- Improved Monitoring
- Centralized Production Deployment

---

## 📋 System Summary

| Component | Technology |
| --- | --- |
| **Frontend** | HTML, CSS, JavaScript |
| **Backend** | Node.js |
| **Communication** | REST API / Fetch API |
| **Current Data Storage** | JSON |
| **Frontend Hosting** | GitHub Pages |
| **Backend Hosting** | Render |
| **Version Control** | Git & GitHub |
| **Authentication** | Backend Admin Authentication |
| **Responsive UI** | CSS Grid, Flexbox & Media Queries |

---

## 👨‍💻 Project

### MASCO Election Portal

**Web-Based Election Management & Live Result Publication System**

Designed to provide a centralized, responsive, and efficient platform for managing election activities from candidate and symbol management through vote entry and final result publication.

---

> **Note:** This project is intended for authorized organizational election management and administrative use.