import fs from "node:fs";
import path from "node:path";
import semver from "semver";

const STATUS_ICONS = {
  PASS: "✅",
  WARNING: "⚠️",
  ERROR: "❌",
  INFO: "ℹ️",
};

function addDiagnostic(diagnostics, status, title, message, suggestion) {
  diagnostics.push({
    status,
    title,
    message,
    suggestion,
  });
}

function detectFramework(packageData) {
  const dependencies = {
    ...packageData.dependencies,
    ...packageData.devDependencies,
  };

  if (dependencies.next) return "Next.js";
  if (dependencies["@angular/core"]) return "Angular";
  if (dependencies.nuxt) return "Nuxt.js";
  if (dependencies.vue) return "Vue.js";
  if (dependencies.react) return "React";

  return "Unknown";
}

function checkNodeVersion(packageData) {
  const requiredVersion = packageData.engines?.node;

  if (!requiredVersion) {
    return {
      status: "INFO",
      title: "Node.js requirement not specified",
      message: `Current version: ${process.version}. No engines.node requirement was found.`,
      suggestion:
        "Specify engines.node in package.json if your project requires a particular Node.js version.",
    };
  }

  if (!semver.validRange(requiredVersion)) {
    return {
      status: "WARNING",
      title: "Invalid Node.js requirement",
      message: `The engines.node value "${requiredVersion}" is not a valid version range.`,
      suggestion: "Use a valid semver range, such as >=20 or ^20.0.0.",
    };
  }

  const compatible = semver.satisfies(process.version, requiredVersion);

  if (compatible) {
    return {
      status: "PASS",
      title: "Node.js version compatible",
      message: `Current version ${process.version} satisfies the requirement "${requiredVersion}".`,
    };
  }

  return {
    status: "WARNING",
    title: "Node.js version incompatible",
    message: `Current version ${process.version} does not satisfy the requirement "${requiredVersion}".`,
    suggestion:
      "Install a compatible Node.js version and check the project's engines.node requirement.",
  };
}

function detectPackageManager(projectPath) {
  const lockfiles = [
    { file: "package-lock.json", name: "npm" },
    { file: "pnpm-lock.yaml", name: "pnpm" },
    { file: "yarn.lock", name: "Yarn" },
    { file: "bun.lock", name: "Bun" },
    { file: "bun.lockb", name: "Bun" },
  ];

  return lockfiles.filter(({ file }) =>
    fs.existsSync(path.join(projectPath, file)),
  );
}

function printReport(diagnostics) {
  console.log("\n📋 Diagnostic Report\n");

  for (const diagnostic of diagnostics) {
    const icon = STATUS_ICONS[diagnostic.status];

    console.log(`${icon} [${diagnostic.status}] ${diagnostic.title}`);
    console.log(`   ${diagnostic.message}`);

    if (diagnostic.suggestion) {
      console.log(`   💡 ${diagnostic.suggestion}`);
    }

    console.log("");
  }

  const summary = diagnostics.reduce(
    (counts, diagnostic) => {
      counts[diagnostic.status]++;
      return counts;
    },
    { PASS: 0, WARNING: 0, ERROR: 0, INFO: 0 },
  );

  console.log("─".repeat(40));
  console.log(
    `Summary: ${summary.PASS} passed, ` +
      `${summary.WARNING} warnings, ` +
      `${summary.ERROR} errors, ` +
      `${summary.INFO} info`,
  );
  console.log("─".repeat(40));
}

export function checkProject(projectPath = process.cwd()) {
  const packagePath = path.join(projectPath, "package.json");
  const diagnostics = [];

  console.log("\n🩺 Devnix");
  console.log("Checking your project...\n");

  // 1. Check package.json
  if (!fs.existsSync(packagePath)) {
    addDiagnostic(
      diagnostics,
      "ERROR",
      "package.json missing",
      "No package.json was found in the current directory.",
      "Run the check command from your project root.",
    );

    printReport(diagnostics);
    return diagnostics;
  }

  addDiagnostic(
    diagnostics,
    "PASS",
    "package.json found",
    "The project configuration file exists.",
  );

  // 2. Read and parse package.json
  let packageData;

  try {
    const content = fs.readFileSync(packagePath, "utf8");
    packageData = JSON.parse(content);

    if (
      packageData === null ||
      typeof packageData !== "object" ||
      Array.isArray(packageData)
    ) {
      throw new Error("package.json must contain a JSON object.");
    }
  } catch {
    addDiagnostic(
      diagnostics,
      "ERROR",
      "Invalid package.json",
      "The file could not be parsed as a valid JSON object.",
      "Check its JSON syntax and try again.",
    );

    printReport(diagnostics);
    return diagnostics;
  }

  addDiagnostic(
    diagnostics,
    "INFO",
    "Project information",
    `Name: ${packageData.name ?? "Not specified"}`,
  );

  // 3. Detect framework
  const framework = detectFramework(packageData);

  if (framework === "Unknown") {
    addDiagnostic(
      diagnostics,
      "INFO",
      "Framework not detected",
      "No supported frontend framework was detected from dependencies.",
      "This may be a Node.js tool or a project using another framework.",
    );
  } else {
    addDiagnostic(
      diagnostics,
      "PASS",
      "Framework detected",
      `Detected framework: ${framework}.`,
    );
  }

  // 4. Node.js runtime
  addDiagnostic(
    diagnostics,
    "INFO",
    "Node.js runtime",
    `Current version: ${process.version}.`,
  );

  // 5. Check Node.js version requirement
  const nodeVersionDiagnostic = checkNodeVersion(packageData);

  addDiagnostic(
    diagnostics,
    nodeVersionDiagnostic.status,
    nodeVersionDiagnostic.title,
    nodeVersionDiagnostic.message,
    nodeVersionDiagnostic.suggestion,
  );

  // 6. Package manager
  const managers = detectPackageManager(projectPath);

  if (managers.length === 0) {
    addDiagnostic(
      diagnostics,
      "WARNING",
      "Lockfile missing",
      "No supported package-manager lockfile was found.",
      "Verify the package manager and regenerate its lockfile if appropriate.",
    );
  } else {
    const managerNames = [...new Set(managers.map((manager) => manager.name))];

    if (managerNames.length > 1) {
      addDiagnostic(
        diagnostics,
        "WARNING",
        "Multiple package managers detected",
        `Found lockfiles for: ${managerNames.join(", ")}.`,
        "Verify which package manager this project uses before installing dependencies.",
      );
    } else {
      addDiagnostic(
        diagnostics,
        "PASS",
        "Package manager detected",
        `Detected package manager: ${managerNames[0]}.`,
      );
    }
  }

  // 7. Dependencies directory
  const modulesPath = path.join(projectPath, "node_modules");

  if (fs.existsSync(modulesPath)) {
    addDiagnostic(
      diagnostics,
      "PASS",
      "Dependencies directory found",
      "The node_modules directory exists. Installed packages have not been validated.",
    );
  } else {
    addDiagnostic(
      diagnostics,
      "WARNING",
      "Dependencies directory missing",
      "The node_modules directory was not found.",
      "Install dependencies using the project's intended package manager.",
    );
  }

  // 8. Scripts
  const scripts = packageData.scripts ?? {};
  const scriptNames = Object.keys(scripts);

  if (scriptNames.length === 0) {
    addDiagnostic(
      diagnostics,
      "WARNING",
      "No scripts configured",
      "No scripts were found in package.json.",
      "Add the scripts your project needs.",
    );
  } else {
    addDiagnostic(
      diagnostics,
      "PASS",
      "Project scripts found",
      `Available scripts: ${scriptNames.join(", ")}.`,
    );
  }

  printReport(diagnostics);

  return diagnostics;
}
