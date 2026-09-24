# MASCO Election Portal

A web-based election management, symbol allocation, vote entry, and live result publication system for internal organizational elections.

The system uses a **GitHub Pages frontend** with a **Node.js backend deployed on Render**. Election data is managed centrally through the backend API and displayed on the public result dashboard.

---

## Live Links

| Service | Link |
|---|---|
| **Result Dashboard** | https://sojib11111.github.io/Masco-Election-portal/index.html?branch=branch-concept |
| **Admin Panel** | https://sojib11111.github.io/Masco-Election-portal/admin.html |
| **Render Backend** | https://masco-election-portal.onrender.com |
| **API Health Test** | https://masco-election-portal.onrender.com/api/health |
| **Render Result Dashboard** | https://masco-election-portal.onrender.com/index.html?branch=branch-concept |
| **Render Admin Panel** | https://masco-election-portal.onrender.com/admin.html |

> The GitHub Pages frontend communicates with the Render backend through REST API calls.

---

## Project Overview

MASCO Election Portal is designed to manage the complete election workflow from a central web interface.

Main features include:

- Election setup
- Branch management
- Section management
- Candidate management
- Candidate photo support
- Symbol master management
- Manual symbol allocation
- Spin-wheel symbol allocation
- Duplicate symbol prevention
- One-candidate-one-symbol rule
- Vote entry
- General seat result
- Reserved women seat result
- Winner calculation
- Result publication
- Live result dashboard
- Voter turnout summary
- Section-wise result view
- Excel-compatible export
- Admin authentication
- Central JSON data storage
- Automatic JSON backup
- Responsive desktop and mobile interface

---

## System Architecture

```text
                USER / ADMIN
                     |
                     v
          GitHub Pages Frontend
     sojib11111.github.io/...
                     |
                     | HTTPS REST API
                     v
             Render Node.js API
   masco-election-portal.onrender.com
                     |
                     v
             data/election.json
                     |
          +----------+----------+
          |                     |
          v                     v
     Admin Panel          Result Dashboard
```

---

## Technology Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- Fetch API
- CSS Grid
- Flexbox
- Responsive Media Queries
- Canvas/JavaScript Spin Wheel
- Session Storage

### Backend

- Node.js
- HTTP REST API
- File-based JSON storage
- Authentication token handling
- CORS support
- Automatic data backup

### Deployment

- GitHub
- GitHub Pages
- Render Web Service
- Git version control

---

## Main Pages

### Result Dashboard

```text
index.html
```

Live:

https://sojib11111.github.io/Masco-Election-portal/index.html?branch=branch-concept

The dashboard displays:

- Election title
- Election date
- Section-wise results
- Candidate photos
- Candidate symbols
- Received votes
- General seat winners
- Reserved women seat winners
- Total sections
- Total candidates
- Total winners
- Total received candidate votes
- Voter turnout
- Result publication status

The dashboard automatically reloads updated server data at a configured interval.

---

### Admin Panel

```text
admin.html
```

Live:

https://sojib11111.github.io/Masco-Election-portal/admin.html

Admin functions include:

- Dashboard
- Branch setup
- Election configuration
- Section management
- Candidate management
- Symbol management
- Symbol allocation
- Spin wheel
- Vote entry
- Result preview
- Result publication
- Export
- Data management

> Admin credentials should never be written in this public README or committed as plain text in frontend JavaScript.

---

### Section / Unit Result

```text
unit-result.html
```

This page displays detailed election results for an individual section/unit.

---

## Backend API

Backend base URL:

```text
https://masco-election-portal.onrender.com
```

### Health Check

```http
GET /api/health
```

Live test:

https://masco-election-portal.onrender.com/api/health

A healthy backend should return a successful JSON response similar to:

```json
{
  "ok": true
}
```

### Election Data

```http
GET /api/data
```

Loads the latest election data from the Node.js backend.

```http
POST /api/data
```

Saves updated election data. The POST operation is protected by admin authentication.

### Authentication

```http
POST /api/auth/login
GET  /api/auth/check
POST /api/auth/logout
```

---

## API Configuration

Frontend API configuration is stored in:

```text
assets/js/api-config.js
```

Current production configuration:

```javascript
window.MASCO_API_BASE =
  'https://masco-election-portal.onrender.com';
```

The helper is used to generate backend URLs:

```javascript
window.MascoApiUrl('/api/data');
```

Result:

```text
https://masco-election-portal.onrender.com/api/data
```

This allows the GitHub Pages frontend to use the Render backend instead of trying to access `/api/data` from GitHub Pages.

---

## Data Flow

### Admin Update Flow

```text
Admin Panel
    |
    v
Frontend JavaScript
    |
    v
POST /api/data
    |
    v
Render Node.js Server
    |
    v
data/election.json
```

### Result Dashboard Flow

```text
Result Dashboard
    |
    v
GET /api/data
    |
    v
Render Node.js Server
    |
    v
data/election.json
    |
    v
Updated Dashboard
```

---

## Project Structure

```text
Masco-Election-portal/
|
|-- index.html
|-- admin.html
|-- unit-result.html
|
|-- server.js
|-- package.json
|-- render.yaml
|
|-- assets/
|   |
|   |-- css/
|   |   `-- ...
|   |
|   `-- js/
|       |-- api-config.js
|       |-- store.js
|       |-- admin.js
|       |-- result.js
|       `-- unit-result.js
|
`-- data/
    |-- election.json
    `-- backups/
```

---

## Local Development

### Requirements

Install Node.js 18 or later.

Check:

```bash
node --version
npm --version
```

### Install

Clone the repository:

```bash
git clone https://github.com/Sojib11111/Masco-Election-portal.git
```

Enter the project folder:

```bash
cd Masco-Election-portal
```

Install dependencies:

```bash
npm install
```

Start the server:

```bash
npm start
```

or:

```bash
node server.js
```

The local server normally becomes available at:

```text
http://localhost:8080
```

Admin:

```text
http://localhost:8080/admin.html
```

Result:

```text
http://localhost:8080/index.html?branch=branch-concept
```

---

## GitHub Deployment

Push changes to the existing repository:

```bash
git add .
git commit -m "Update election portal"
git push
```

GitHub Pages hosts the static frontend.

Repository:

```text
https://github.com/Sojib11111/Masco-Election-portal
```

---

## Render Deployment

The same GitHub repository is connected to Render as a Node.js Web Service.

Recommended settings:

```text
Branch        : main
Build Command : npm install
Start Command : node server.js
```

Render automatically provides the `PORT` environment variable.

Production backend:

```text
https://masco-election-portal.onrender.com
```

---

## Symbol Allocation Logic

The portal supports both manual allocation and spin-wheel allocation.

Current business rules include:

```text
One Candidate = One Active Symbol
```

and:

```text
An already allocated symbol must not appear as available
for another candidate according to the configured allocation scope.
```

Management users can release or change an allocation when required.

---

## Vote and Result Management

The election result module supports:

- General seat candidates
- Reserved women seat candidates
- Vote entry
- Ranking
- Winner display
- Tie handling
- Result preview
- Public result publication
- Section-wise details

Voter turnout is calculated from voter participation, not from the sum of candidate votes.

---

## Backup

Before election data is overwritten, the Node server can create backup copies under:

```text
data/backups/
```

This helps restore previous election data if an accidental change occurs.

---

## Security Notes

- Do not store admin passwords in this README.
- Do not commit plain-text passwords to frontend JavaScript.
- Admin write operations should remain protected by backend authentication.
- Keep the Render backend URL configured through `api-config.js`.
- Do not expose unnecessary internal files through the web server.
- Use HTTPS for public deployments.

---

## Important Production Note

The current system stores election data in:

```text
data/election.json
```

Render free instances use an ephemeral filesystem. A redeploy, restart, or replacement instance may reset runtime file changes.

For testing and demonstration, the current setup is suitable.

For critical production use, migrate election data to persistent storage such as:

- Oracle Database
- PostgreSQL
- Render persistent disk
- Another managed database

Recommended future architecture:

```text
GitHub Pages
      |
      v
REST API / ORDS
      |
      v
Oracle Database
```

---

## Quick Test Checklist

After every deployment, verify:

```text
1. Open the API Health Test.
2. Confirm that the response contains "ok": true.
3. Open the Admin Panel.
4. Login successfully.
5. Update a test value.
6. Save the update.
7. Open the Result Dashboard.
8. Confirm the updated value appears.
9. Test on another browser/device.
10. Confirm no /api/data 404 error appears.
```

---

## Live System Summary

**Frontend**  
https://sojib11111.github.io/Masco-Election-portal/

**Admin**  
https://sojib11111.github.io/Masco-Election-portal/admin.html

**Result Dashboard**  
https://sojib11111.github.io/Masco-Election-portal/index.html?branch=branch-concept

**Backend**  
https://masco-election-portal.onrender.com

**API Health**  
https://masco-election-portal.onrender.com/api/health

---

## Author / Project

**MASCO Election Portal**

Internal election management and result publication system.

---

## License

Internal / organizational use unless otherwise specified.
