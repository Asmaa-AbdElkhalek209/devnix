# 🚀 Devnix

A developer-friendly command-line tool for creating frontend projects and diagnosing common project configuration issues.

Devnix helps developers get started with new projects and identify configuration problems through clear diagnostic messages and suggested next steps.

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

## 🚀 Usage

### Check a project

Navigate to your project's root directory and run:

```bash
devnix check
```

Devnix reports detected configuration details, warnings, errors, and suggested actions.

### Create a new project

Run:

```bash
devnix init
```

Choose a supported framework and enter a project name.

### View available commands

```bash
devnix --help
```

### Check the installed version

```bash
devnix --version
```

## 🛠️ Development

Clone the repository and install dependencies:

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
- Current framework detection and diagnostics focus primarily on frontend project configurations.

## 🗺️ Roadmap

- Expand diagnostic checks for more project types.
- Add backend project configuration checks.
- Improve error explanations and recommended solutions.
- Expand automated test coverage.
- Explore optional automated fixes with user confirmation.
- Improve project health reporting.

## 📄 License

ISC
