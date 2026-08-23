# 🚀 SmartCareer AI — Resume Optimizer & Adaptive Mock Interview Platform

SmartCareer AI is an enterprise-grade resume intelligence portal designed to help candidates structure their experience, evaluate applicant tracking system (ATS) compatibility, and prepare for job interviews through real-time adaptive mock assessments.

The application leverages React 19 and Vite to provide an ultra-responsive, highly interactive user experience utilizing modern glassmorphism UI components, fluid micro-animations, and dynamic dashboards.

---

## ✨ Key Features

- 📂 **Resume Upload & Multi-Format Parsing**:
  - Drag-and-drop file interface for PDFs and document structures.
  - Real-time simulation of parsing logs and metadata extraction (skills, projects, experience, education).
- 📊 **ATS Match Indexing & Score Analysis**:
  - Semantic alignment check against target job descriptions.
  - Detailed score breakdown across Keyword Match, Formatting, and Impact.
- 🎯 **Interactive Skill Gap Analyzer**:
  - Lists missing high-priority and medium-priority skills from job descriptions.
  - Interactive skill checklist to mark items off as you learn.
- 🎙️ **Adaptive AI Mock Interviews**:
  - Dynamically generated behavioral and technical questions based on scanned resume content and skill gaps.
  - Instant score feedback with key strengths and improvement suggestions.
- 🗺️ **Personalized Learning Roadmaps**:
  - Custom step-by-step career path guides mapping out resources to acquire missing technologies.
- 📂 **Workspace & History Management**:
  - Complete history logs tracking match scores, recent parses, and interview results.
  - Settings panel to customize profile names, contact emails, and professional targets.

---

## 📂 Project Structure

The project follows a modular, feature-based directory structure for easy maintainability:

```text
├── .gitignore               # Standard git exclusions (logs, build assets, local env)
├── .oxlintrc.json           # Oxlint configuration for lightning-fast lint rules
├── index.html               # Main application entry HTML layout
├── package.json             # NPM dependencies, scripts, and build configurations
├── vite.config.js           # Vite server & build configurations
└── src/                     # Application source code
    ├── main.jsx             # React client-side initialization entrypoint
    ├── App.jsx              # Core app controller and route dispatcher
    ├── App.css              # Global styles & document resets
    ├── index.css            # Base design system variables (HSL palettes, dark theme, resets)
    ├── assets/              # Static SVG symbols, vectors, and icons
    ├── pages/               # Top-level screen components
    │   ├── Auth.jsx         # Sign Up & Log In screens (interactive form state)
    │   ├── LandingPage.jsx  # Interactive product landing page & live simulator
    │   └── DashboardLayout.jsx # Core portal structure with sidebars and view router
    ├── components/          # Reusable UI widgets
    │   ├── Header.jsx       # Global app header showing currently active view
    │   ├── Footer.jsx       # Semantic footer layout
    │   ├── Sidebar.jsx      # Navigation drawer with 11 responsive portal links
    │   ├── ResumeUploader.jsx # PDF dropzone with progress counters
    │   ├── ATSAnalysis.jsx  # ATS parsing diagnostics list
    │   ├── ResumeScore.jsx  # Circular alignment rating and breakdown charts
    │   ├── SkillChecklist.jsx # Checklist component with category trackers
    │   ├── SkillGapAnalysis.jsx # List of missing skills compared against target JDs
    │   ├── AIMockInterview.jsx # Step-by-step mock test module
    │   ├── InterviewResults.jsx # Scorecard analytics for mock runs
    │   ├── LearningRoadmap.jsx  # Career growth tree with steps
    │   ├── RecentScans.jsx  # Compact list view of uploaded docs
    │   └── ProfileSettings.jsx  # User details updating forms
    └── styles/              # Dedicated CSS stylesheet matching each component
        ├── LandingPage.css
        ├── DashboardLayout.css
        ├── Sidebar.css
        ├── ... (individual styling modules)
```

---

## 🛠️ Technology Stack

- **Core Library**: [React 19.2](https://react.dev/) (Functional components with hooks)
- **Bundler & Server**: [Vite 8.1](https://vite.dev/) (HMR and fast bundling)
- **Linter**: [Oxlint 1.69](https://oxc.rs/) (Next-generation high performance linter)
- **Styling**: Vanilla CSS3 (Custom design system variables, CSS Grid, flex layouts, keyframe animations)

---

## 🚀 Quick Start Guide

Follow these commands to get a local copy up and running:

### 1. Prerequisite
Ensure you have [Node.js](https://nodejs.org/) installed (version 18+ recommended).

### 2. Clone & Setup Directory
Navigate to the directory of the project:
```bash
cd "ai_resume and mock interview plateform"
```

### 3. Install Dependencies
Install packages listed in `package.json`:
```bash
npm install
```

### 4. Run Development Server
Start the local server with hot-module reloading:
```bash
npm run dev
```
Open your browser and navigate to the address shown in the terminal (usually `http://localhost:5173`).

### 5. Build for Production
To bundle the project into optimized static files for deployment:
```bash
npm run build
```
The output files will be created in the `dist/` directory.

---

## 📤 Uploading to GitHub

Follow these steps to publish this repository to your personal GitHub account:

### Step 1: Create a Repository on GitHub
1. Log in to [GitHub](https://github.com/).
2. Click the **"+"** icon in the top-right corner and select **New repository**.
3. Set your repository name (e.g. `ai-resume-mock-interview-platform`).
4. **Important**: Leave "Add a README file", "Add .gitignore", and "Choose a license" **unchecked** (to avoid merge conflicts).
5. Click **Create repository**.

### Step 2: Push Your Local Code to GitHub
Open your terminal in this project directory and execute:

```bash
# Initialize git repository
git init

# Add all files to staging index
git add .

# Create the initial commit
git commit -m "feat: initial commit - resume builder & mock interview platform"

# Rename current branch to 'main'
git branch -M main

# Add the remote link (replace with your GitHub URL)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git

# Push the code
git push -u origin main
```
*Note: Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPOSITORY_NAME` with your actual GitHub username and repository name created in Step 1.*
