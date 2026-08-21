# CODE BLUE

CODE BLUE is a polished, static healthcare-education game in which players classify **fictional** patient scenarios as Stable, Urgent, or Emergency. It was designed as an AP Computer Science demonstration and works on GitHub Pages with no build step, framework, account, or backend.

Made by **Team Armadillo** for **BCA ATCS 2030**.

## Important educational disclaimer

This is a fictional simulation only. It is not medical advice, a diagnostic tool, a clinical reference, or a substitute for professional medical judgment. All cases are invented for teaching gameplay.

## Features

- 25 hand-written fictional cases, with a 10-case shift and three difficulty labels
- Scoring, response-time bonus, streaks, letter grade, and saved best progress
- Keyboard controls: `1` Stable, `2` Urgent, `3` Emergency
- Animated ECG, responsive dashboard, accessible focus behavior, reduced-motion support, and generated Web Audio sounds
- A clearly commented simplified educational urgency-score function
- Optional local Ollama enhancement for Case Analysis, questions, and experimental dynamic cases; built-in explanations always remain the fallback

## Computer science concepts

The project demonstrates variables, conditional statements, arrays, objects, functions, event listeners, randomization, sorting, state management, JSON, API requests, input validation, error handling, and local browser storage.

## Project structure

```
code-blue/
├── index.html
├── README.md
├── css/styles.css
├── js/app.js
├── js/patients.js
├── js/triage.js
├── js/ai.js
├── js/audio.js
├── js/storage.js
└── assets/
```

## Deploy to GitHub Pages

1. Create a GitHub repository and upload the contents of `code-blue`.
2. In **Settings → Pages**, choose **Deploy from a branch**.
3. Select the branch and the `/ (root)` folder, then save.
4. Open the published URL. All file paths are relative, so it also works from a repository subfolder.

## Optional local AI setup

The core simulation works fully without Ollama.

1. Install [Ollama](https://ollama.com/).
2. Download a suitable small model, such as `ollama pull llama3.2:3b`.
3. Start Ollama.
4. If needed for a live demonstration, configure Ollama's permitted browser origin according to its documentation.
5. Open the GitHub Pages site.
6. AI-enhanced case explanations become available automatically when browser access to local Ollama is permitted.

The browser may block HTTPS-page-to-localhost requests unless the demonstration machine is configured to allow that origin. CODE BLUE fails quietly and uses its built-in educational analysis in that situation.
