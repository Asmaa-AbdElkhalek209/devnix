import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { checkProject } from "../src/commands/check.js";

function createTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "project-doctor-"));
}

function runSilently(callback) {
  const originalLog = console.log;
  console.log = () => {};

  try {
    return callback();
  } finally {
    console.log = originalLog;
  }
}

function writePackageJson(projectPath, packageData) {
  fs.writeFileSync(
    path.join(projectPath, "package.json"),
    JSON.stringify(packageData),
  );
}

function withTempProject(callback) {
  const projectPath = createTempProject();

  try {
    callback(projectPath);
  } finally {
    fs.rmSync(projectPath, {
      recursive: true,
      force: true,
    });
  }
}

test("reports an error when package.json is missing", () => {
  withTempProject((projectPath) => {
    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some((item) => item.title === "package.json missing"),
    );
  });
});

test("detects React in package.json", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-react-project",
      dependencies: {
        react: "^19.0.0",
      },
      scripts: {
        dev: "vite",
      },
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Framework detected" && item.message.includes("React"),
      ),
    );
  });
});

test("reports invalid package.json", () => {
  withTempProject((projectPath) => {
    fs.writeFileSync(
      path.join(projectPath, "package.json"),
      "{ invalid json }",
    );

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some((item) => item.title === "Invalid package.json"),
    );
  });
});

test("detects Angular in package.json", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-angular-project",
      dependencies: {
        "@angular/core": "^20.0.0",
      },
      scripts: {
        start: "ng serve",
      },
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Framework detected" &&
          item.message.includes("Angular"),
      ),
    );
  });
});

test("detects Next.js instead of React", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-next-project",
      dependencies: {
        next: "^16.0.0",
        react: "^19.0.0",
        "react-dom": "^19.0.0",
      },
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Framework detected" &&
          item.message.includes("Next.js"),
      ),
    );
  });
});

test("passes when the current Node.js version satisfies engines.node", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-node-compatible",
      engines: {
        node: ">=0.0.0",
      },
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Node.js version compatible" && item.status === "PASS",
      ),
    );
  });
});

test("warns when the current Node.js version is incompatible", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-node-incompatible",
      engines: {
        node: ">=999.0.0",
      },
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Node.js version incompatible" &&
          item.status === "WARNING",
      ),
    );
  });
});

test("warns when engines.node contains an invalid range", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-invalid-node-range",
      engines: {
        node: "not-a-version",
      },
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Invalid Node.js requirement" &&
          item.status === "WARNING",
      ),
    );
  });
});

test("warns when no lockfile is found", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-no-lockfile",
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Lockfile missing" && item.status === "WARNING",
      ),
    );
  });
});

test("detects npm when package-lock.json exists", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-npm-project",
    });

    fs.writeFileSync(path.join(projectPath, "package-lock.json"), "{}");

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Package manager detected" &&
          item.message.includes("npm") &&
          item.status === "PASS",
      ),
    );
  });
});

test("warns when multiple package managers are detected", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-multiple-managers",
    });

    fs.writeFileSync(path.join(projectPath, "package-lock.json"), "{}");

    fs.writeFileSync(
      path.join(projectPath, "pnpm-lock.yaml"),
      "lockfileVersion: '9.0'",
    );

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Multiple package managers detected" &&
          item.status === "WARNING" &&
          item.message.includes("npm") &&
          item.message.includes("pnpm"),
      ),
    );
  });
});

test("warns when node_modules is missing", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-missing-modules",
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Dependencies directory missing" &&
          item.status === "WARNING",
      ),
    );
  });
});

test("passes when node_modules exists", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-installed-modules",
    });

    fs.mkdirSync(path.join(projectPath, "node_modules"));

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Dependencies directory found" &&
          item.status === "PASS",
      ),
    );
  });
});

test("warns when package.json has no scripts", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-no-scripts",
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "No scripts configured" && item.status === "WARNING",
      ),
    );
  });
});

test("detects scripts configured in package.json", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-with-scripts",
      scripts: {
        dev: "vite",
        build: "vite build",
      },
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Project scripts found" &&
          item.status === "PASS" &&
          item.message.includes("dev") &&
          item.message.includes("build"),
      ),
    );
  });
});

test("detects Vue.js in package.json", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-vue-project",
      dependencies: {
        vue: "^3.5.0",
      },
      scripts: {
        dev: "vite",
      },
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Framework detected" &&
          item.message.includes("Vue.js") &&
          item.status === "PASS",
      ),
    );
  });
});

test("detects Nuxt.js instead of Vue.js", () => {
  withTempProject((projectPath) => {
    writePackageJson(projectPath, {
      name: "test-nuxt-project",
      dependencies: {
        nuxt: "^3.0.0",
        vue: "^3.5.0",
      },
      scripts: {
        dev: "nuxt dev",
      },
    });

    const diagnostics = runSilently(() => checkProject(projectPath));

    assert.ok(
      diagnostics.some(
        (item) =>
          item.title === "Framework detected" &&
          item.message.includes("Nuxt.js") &&
          item.status === "PASS",
      ),
    );
  });
});
