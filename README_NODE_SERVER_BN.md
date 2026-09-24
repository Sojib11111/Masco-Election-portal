# MASCO Election Portal - Node.js JSON Server

এই project-এ `data/election.json`-ই central writable data file। Admin page থেকে Save করলে browser `POST /api/data` করে এবং Node `server.js` atomicভাবে JSON file update করে। Result dashboard প্রতি 5 সেকেন্ডে `GET /api/data` করে নতুন data দেখায়।

## Run
1. Node.js 18+ install করুন।
2. `START.bat` double-click করুন অথবা terminal-এ `npm start` চালান।
3. Admin: `http://localhost:8080/admin.html`
4. Result: `http://localhost:8080/index.html?branch=branch-concept`
5. অন্য PC থেকে server console-এ দেখানো LAN URL ব্যবহার করুন। Windows Firewall-এ TCP 8080 allow করতে হতে পারে।

## Admin login
- Username: `admin`
- Password: project owner configured password

Password browser JavaScript-এ রাখা নেই। Node server hash verify করে এবং login token ছাড়া JSON write করা যায় না।

## Important: GitHub Pages
GitHub Pages Node.js চালায় না। তাই `https://sojib11111.github.io/...` URL-এ Admin Save কখনও JSON file write করতে পারবে না। GitHub repository-তে code রাখা যাবে, কিন্তু live writable site চালাতে Node-capable server/VPS/Windows server/Render/Railway ইত্যাদিতে এই project run করতে হবে।

## Data safety
- Main file: `data/election.json`
- Save-এর আগে backup: `data/backups/`
- Maximum 30 backup রাখা হয়।
- `data/` browser থেকে direct open করা blocked; public dashboard `/api/data` দিয়ে read করে।

## Useful URLs
- Health: `/api/health`
- Login: `POST /api/auth/login`
- Data read: `GET /api/data`
- Data save: `POST /api/data` (admin token required)

## Deployment
Production server-এ `npm start` দিয়ে Node run করুন। Always-on করার জন্য PM2/NSSM/Windows Service ব্যবহার করতে পারেন। Public internet deployment হলে HTTPS reverse proxy (IIS/Nginx) ব্যবহার করুন।
