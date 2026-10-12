# 🚀 Devnix

[![npm version](https://img.shields.io/npm/v/devnix)](https://www.npmjs.com/package/devnix)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-green)](https://nodejs.org/)

**Devnix** is a developer-friendly command-line tool for creating frontend projects and diagnosing common project configuration issues.

It helps developers get started with new projects, identify configuration problems, and understand potential solutions through clear diagnostic messages and suggested next steps.

## ✨ Features

- Creates new projects using official framework CLIs.
- Detects supported frontend frameworks.
- Checks `package.json` and reports invalid configuration files.
- Checks Node.js version compatibility with `engines.node`.
- Detects package manager lockfiles.
- Checks whether `node_modules` and project scripts exist.
- Provides diagnostic messages and suggested next steps.

## 🧰 Supported Frameworks

- React
- Next.js
- Angular
- Vue.js
- Nuxt.js

## 📦 Requirements

- Node.js 20 or later
- npm

## 📥 Installation

Install Devnix globally using npm:

```bash
npm install -g devnix
```

Verify the installation:

```bash
devnix --version
```

## 🚀 Usage

### Check a project

Navigate to your project's root directory and run:

```bash
devnix check
```

Devnix checks the project configuration and reports detected information, warnings, errors, and suggested next steps.

### Create a new project

Run:

```bash
devnix init
```

Choose a supported framework and enter a project name to get started.

### View available commands

```bash
devnix --help
```

### Check the installed version

```bash
devnix --version
```

## 🛠️ Development

Clone the repository:

```bash
git clone https://github.com/Asmaa-AbdElkhalek209/devnix.git
```

Navigate to the project directory:

```bash
cd devnix
```

Install dependencies:

```bash
npm install
```

Run the test suite:

```bash
npm test
```

Run the CLI locally:

```bash
node src/index.js check
```

## ⚠️ Current Limitations

- Devnix diagnoses configuration issues but does not automatically repair them.
- Configuration checks do not guarantee that all dependencies or application code are valid.
- Project creation requires an internet connection and the relevant framework's official CLI.
- Framework detection and diagnostics currently focus primarily on frontend project configurations.

## 🗺️ Roadmap

- Expand diagnostic checks for more project types.
- Add backend project configuration checks.
- Improve error explanations and recommended solutions.
- Expand automated test coverage.
- Explore optional automated fixes with user confirmation.
- Improve project health reporting.

## 🔗 Links

- **npm Package:** https://www.npmjs.com/package/devnix
- **GitHub Repository:** https://github.com/Asmaa-AbdElkhalek209/devnix

## 📄 License

This project is licensed under the [ISC License](LICENSE).
