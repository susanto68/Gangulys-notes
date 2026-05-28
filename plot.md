# Project Plot and Architecture Rules

This file serves as a source of truth for **AI Assistants (like Antigravity)** and future developers working on this codebase. It documents the architecture of the project and outlines strict rules to prevent regression.

---

## 🚨 CRITICAL ARCHITECTURAL POLICY

> [!IMPORTANT]
> This repository is dedicated **strictly** to the **Classic Notes Project** (`sirganguly.com`). 
> The site is a pure, lightweight static HTML, CSS, and JS web application.
> 
> **ALL CLASSIC NOTES CODE MUST LIVE AT THE REPOSITORY ROOT.**

### 1. What Happened (The History)
Previously, a Next.js framework project (`ai.sirganguly.com`) was accidentally merged into the root of this repository. This created duplicate file names (like `index.html` inside `public/` and Next.js assets), broke routing, and caused broken local and remote builds. 

To fix this mess:
- The modern Next.js AI project has been fully moved and archived inside the `_modern_ai_project_archive/` directory.
- The Classic Notes website has been restored back to the repository root directory as its primary source code.

### 2. Mandatory Rules for Developers & AI Coding Assistants
* **DO NOT** attempt to move Next.js folders or files (such as `pages/`, `components/`, `package.json`, `next.config.js`, etc.) from `_modern_ai_project_archive/` back into the repository root.
* **DO NOT** initialize Next.js, React, or any other web frameworks at the root directory of this repository.
* **DO NOT** delete the archived `_modern_ai_project_archive/` folder unless explicitly directed by the repository owner.
* **DO** edit static files directly at the root (like `index.html`, `styles.css`, `scripts.js`, and pages like `class10.html`, etc.) for any Classic Notes updates.
* **DO** use a simple static web server (such as `npx serve` or `python -m http.server`) to run the project locally.

---

## Repository File Layout (Root)

```
/ (Root)
│
├── _modern_ai_project_archive/    <-- Next.js AI project files (Preserved/Archived)
│
├── assets/                        <-- Static assets
├── audio/                         <-- Audio elements
├── c-lab/                         <-- C program compiler lab
├── cpp-lab/                       <-- C++ compiler lab
├── java-lab/                      <-- Java compiler lab
├── pdf/                           <-- Syllabus and homework PDFs
├── python-lab/                    <-- Python compiler lab
│
├── index.html                     <-- Primary entrypoint of the Classic Notes site
├── styles.css                     <-- Primary stylesheet
├── scripts.js                     <-- Primary logic
├── sw.js / service-worker.js      <-- PWA service workers
├── manifest.json                  <-- PWA app manifest
├── favicon.ico                    <-- Site favicon
├── README.md                      <-- Project README with warnings
└── plot.md                        <-- THIS FILE (Architecture & AI guidelines)
```
