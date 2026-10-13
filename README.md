# CodeArena

**CodeArena** is a full-stack online coding platform for practicing problems, competing in live contests, and engaging with a developer community. It features a modern React frontend, a Node.js/Express backend, and a secure compiler server for code execution in multiple languages.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Key Functionality](#key-functionality)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- **User Authentication**: Secure login/signup with session management.
- **Practice Problems**: Browse, filter, and solve coding problems with a built-in code editor and real-time code execution.
- **Contests**: Participate in live contests, submit solutions, and view real-time leaderboards.
- **AI Assistance**: Get AI-powered code reviews and debugging suggestions.
- **Discussion Forums**: Engage in problem and contest discussions.
- **Admin Panel**: Create/edit problems and contests (admin only).
- **Profile & Submissions**: Track your progress, view past submissions, and see your contest history.

---

## Project Structure

```
Code Arena/
  ├── Backend/                # Node.js/Express backend API
  │   ├── app.js
  │   ├── Models/             # Mongoose models (User, Problem, Contest, Submission, etc.)
  │   ├── Controller/         # Route controllers (User, Problem, Contest, AI, etc.)
  │   ├── Routes/             # Express route definitions
  │   ├── validators/         # Input validation logic
  │   ├── Database/           # DB connection logic
  │   └── package.json
  ├── Compiler Server/        # Isolated code execution server (Node.js, Dockerized)
  │   ├── app.js
  │   ├── executeC.js, executeCpp.js, executeJava.js, executePython.js
  │   ├── generateFile.js, generateInputFile.js, generateJavaFile.js
  │   ├── Dockerfile
  │   └── package.json
  └── Frontend/               # React frontend (Vite)
      ├── src/
      │   ├── components/     # UI components (Problems, Contests, Auth, AI, etc.)
      │   ├── contexts/       # React context (Auth)
      │   ├── AppRoutes.jsx   # Main route definitions
      │   └── main.jsx
      ├── public/
      ├── index.html
      └── package.json
```

---

## Tech Stack

- **Frontend**: React, Vite, MUI, React Router, Axios, Monaco Editor, React Markdown
- **Backend**: Node.js, Express, MongoDB (Mongoose), Passport.js, Joi, CORS, dotenv
- **Compiler Server**: Node.js, Express, Docker, language-specific runners (C, C++, Java, Python)
- **AI Integration**: Google Gemini API (for code review/debug)
- **Authentication**: Sessions (express-session, passport-local, connect-mongo)
- **Security**: Helmet, CORS, rate limiting

---

## Setup & Installation

### 1. **Clone the repository**
```bash
git clone <your-repo-url>
cd Code\ Arena
```

### 2. **Environment Variables**

Create `.env` files in `Backend/` and `Compiler Server/` with the following variables:

#### Backend/.env
- `PORT`: The port for the backend server to listen on.
- `MONGOOSE_URL`: MongoDB connection string for the backend database.
- `FRONTEND_URL`: The URL where the frontend is hosted (for CORS).
- `FRONTEND_URL_LOCAL`: Localhost URL for frontend (for CORS during development).
- `COMPILER_URL`: The URL where the compiler server is running.
- `Gemini_api`: API key for Google Gemini (AI code review/debug).
- `SESSION_SECRET`: Secret string for session encryption.

#### Compiler Server/.env
- `PORT`: The port for the compiler server to listen on.
- `MONGOOSE_URL`: MongoDB connection string for the compiler server (if needed).

> **Note:** Adjust variable names and values as needed for your deployment environment.

### 3. **Install dependencies**

```bash
cd Backend
npm install

cd ../Compiler\ Server
npm install

cd ../Frontend
npm install
```

### 4. **Start the servers**

- **Backend**:  
  ```bash
  cd Backend
  npm run dev
  ```
- **Compiler Server** (recommended: use Docker):  
  ```bash
  cd Compiler\ Server
  docker build -t codearena-compiler .
  docker run -p <your-compiler-port>:<your-compiler-port> codearena-compiler
  ```
  Or run locally:
  ```bash
  npm start
  ```
- **Frontend**:  
  ```bash
  cd Frontend
  npm run dev
  ```

---

## Usage

- Visit your frontend URL in your browser.
- Sign up or log in.
- Practice problems, join contests, and use AI features.
- Admins can create/edit problems and contests.

---

## Key Functionality

- **Problems**:  
  - View, filter, and solve problems.
  - Code editor with C++, Java, Python support.
  - Run code with custom input/output.
  - Submit solutions and get verdicts.
  - AI review and debug for code.

- **Contests**:  
  - Live timer, leaderboard, and submissions.
  - Points and ranking based on first accepted submissions.
  - All submissions tracked for each problem.

- **Leaderboard**:  
  - Points are calculated as the sum of the points array (per problem).
  - For each problem, the last accepted submission is shown.
  - Ranks are determined by total points and earliest last submission.

- **AI Features**:  
  - Code review and debugging using Google Gemini API.

- **Admin**:  
  - Create/edit problems and contests.
  - Manage users and content.

---

## Development

- **Frontend**:  
  - Located in `/Frontend`
  - Uses Vite for fast development.
  - Main entry: `src/main.jsx`, routes in `src/AppRoutes.jsx`.

- **Backend**:  
  - Located in `/Backend`
  - Main entry: `app.js`
  - REST API for users, problems, contests, submissions, AI.

- **Compiler Server**:  
  - Located in `/Compiler Server`
  - Handles code execution in a secure, isolated environment.

---

## Seeding Problems

`Backend/seed/` holds 127 ready-made problems (41 easy, 67 medium, 19 hard) covering arrays, strings, DP, graphs, trees, linked lists, binary search and more. Test-case outputs are generated by running reference solutions, so they always match the statements.

```bash
cd Backend
npm run seed -- --dry                      # build and validate only, no database access
npm run seed                               # insert problems that don't exist yet (author = first admin user)
npm run seed -- --email=you@example.com    # choose the author
npm run seed -- --update                   # also overwrite existing problems with the same name
npm run seed:verify                        # cross-check the reference solutions against independent implementations
```

The first two test cases of each seeded problem are public (shown as examples); the rest are hidden.

## Password reset email

"Forgot password?" emails a one-time link that is valid for 30 minutes. Emails are sent over an HTTPS API (Render's free tier blocks SMTP), so set **one** provider on the **backend** service:

| Variable | Brevo | Resend |
| --- | --- | --- |
| `EMAIL_PROVIDER` | `brevo` | `resend` |
| API key | `BREVO_API_KEY` | `RESEND_API_KEY` |
| `MAIL_FROM` | a sender you verified in Brevo, e.g. `CodeArena <you@gmail.com>` | `CodeArena <onboarding@resend.dev>` (only delivers to your own address until you verify a domain) |

Also required: `FRONTEND_URL` (the public site URL, used to build the link in the email).

Brevo's free plan (300 emails/day) lets you verify a single sender address and send to anyone, which is the easiest option for a personal project.

With no provider configured nothing is sent. In development the email, including the link, is printed to the server log so you can try the flow locally; in production it is never logged.

The endpoints are `POST /forgot-password` (5 requests / 15 min / IP) and `POST /reset-password` (10 / 15 min / IP). Only a SHA-256 hash of the token is stored, a link works once, and resetting a password signs the account out everywhere.

## Light / dark theme

The navbar has a sun/moon switch. With no saved choice the site follows the operating system's setting; once you pick one it is remembered in this browser (`localStorage` key `ca_theme`). The theme is applied as `data-theme="light|dark"` on `<html>`, set by a tiny script in `index.html` before React renders so there is no flash.

How the colours work:

- `src/theme/theme-colors.css` (generated) holds one CSS variable per colour used in the stylesheets, named by role: `--bg-…` (backgrounds), `--bd-…` (borders) and `--tx-…` (text). The `:root` value is the original light colour; the `[data-theme='dark']` value is derived from it. Component CSS uses `var(--bg-ffffff)` etc. instead of raw hex codes.
- `src/theme/theme-overrides.css` holds hand-written dark/light fixes (translucent panels, inverse chips, input fills).
- `src/theme/ThemeContext.jsx` provides `useTheme()`; Monaco and the MUI components read it.

When you add UI, reuse an existing token (search `theme-colors.css` for a close colour) instead of a new hex code. If you do add a new colour, add it to both blocks of `theme-colors.css` and check it in both themes; plain text on a coloured surface should keep at least a 4.5:1 contrast ratio.

## Contributing

1. Fork the repo and create your branch.
2. Make your changes and add tests if needed.
3. Submit a pull request with a clear description.

---

## License

This project is licensed under the MIT License.

---

**Enjoy coding and competing on CodeArena!** 