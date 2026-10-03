# Southeast Studios

> Student-led gaming solutions built with passion and creativity.

Southeast Studios is a student-run initiative focused on game development, UI/UX design, and creative digital solutions. This repository hosts the official website of the studio.

## 🌐 Live Website
[https://poorvanshdpsgn-prog.github.io/southeaststudios/](https://poorvanshdpsgn-prog.github.io/southeaststudios/)

## 🚀 Features
- Fully responsive design (mobile, tablet, desktop)
- Neon / cyberpunk theme
- Interactive project showcase
- Customer support & request form (EmailJS integrated)
- Team section
- Robotics and AI project portfolio (coming soon)

## 🛠️ Built With
- HTML5, CSS3, JavaScript
- Deployed on Netlify (auto-deploy from GitHub)

## 📁 Project Structure
- `pages/` — all website and BotForge HTML pages
- `index.html` — root redirect to `pages/index.html` for the existing site URL
- `style.css`, `botforge-pages.css`, and `botforge-pages.js` — shared styles and page behavior
- `google*.html` — verification files kept at the root so their existing verification URLs continue to work
- `main.js` — Electron entry point, loads `pages/index.html`

## 👥 Team
Founded and built by students of Class 9, with a passion for gaming, robotics, and AI.

## 📬 Contact
For inquiries or collaboration:  
[studiossouteast@gmail.com](mailto:studiossouteast@gmail.com)

---

*Built by teens, for the teens.*

## BotForge Game Engine

The authenticated BotForge dashboard now creates and opens editable 2D projects. The editor supports six starter templates, scenes, canvas object editing, image/audio assets, object behaviors, global/scene/object variables, event rules, playable preview, autosave, undo/redo, and JSON import/export.

Project data is stored locally in IndexedDB (with a localStorage fallback) for the current browser origin. Projects are not synchronized to Firebase or shared between browsers. Uploaded assets are limited to 8 MB each in this prototype. Project export is JSON; a standalone playable-game export is not provided yet.

To run the desktop app, install the existing npm dependencies with `npm install`, then launch with `npm start`. The Electron shell serves the site from `http://localhost:4173` so browser modules and Firebase authentication can load correctly. To run the browser version without Electron, use `npm run serve` and open `http://localhost:4173/pages/index.html`. For deployment, use the repository's regular static hosting URL and sign in through the existing Firebase login page.
