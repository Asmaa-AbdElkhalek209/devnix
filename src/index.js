#!/usr/bin/env node
import { Command } from "commander";
import inquirer from "inquirer";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { checkProject } from "./commands/check.js";

const program = new Command();

program
  .name("devnix")
  .description("Create projects and diagnose project configuration issues")
  .version("1.0.0");
program
  .command("init")
  .description("Create a new frontend project")
  .action(async () => {
    try {
      const { framework } = await inquirer.prompt([
        {
          type: "select",
          name: "framework",
          message: "Which framework do you want to use?",
          choices: [
            { name: "React", value: "react" },
            { name: "Next.js", value: "next" },
            { name: "Angular", value: "angular" },
            { name: "Vue.js", value: "vue" },
            { name: "Nuxt.js", value: "nuxt" },
          ],
        },
      ]);

      const { projectName } = await inquirer.prompt([
        {
          type: "input",
          name: "projectName",
          message: "Enter your project name:",
          validate(value) {
            if (!/^[a-z0-9][a-z0-9._-]*$/.test(value)) {
              return "Use lowercase letters, numbers, dots, hyphens or underscores.";
            }

            return true;
          },
        },
      ]);

      const targetPath = path.resolve(projectName);

      if (fs.existsSync(targetPath)) {
        console.log("❌ This folder already exists.");
        return;
      }

      let command = "npm";
      let args = [];

      if (framework === "react") {
        const { language } = await inquirer.prompt([
          {
            type: "select",
            name: "language",
            message: "Choose your language:",
            choices: [
              { name: "JavaScript", value: "react" },
              { name: "TypeScript", value: "react-ts" },
            ],
          },
        ]);

        args = [
          "create",
          "vite@latest",
          projectName,
          "--",
          "--template",
          language,
        ];
      } else if (framework === "next") {
        args = ["exec", "--yes", "--", "create-next-app@latest", projectName];
      } else if (framework === "angular") {
        args = [
          "exec",
          "--yes",
          "--",
          "@angular/cli@latest",
          "new",
          projectName,
        ];
      } else if (framework === "vue") {
        args = ["create", "vue@latest", projectName];
      } else if (framework === "nuxt") {
        args = ["create", "nuxt@latest", projectName];
      }

      console.log(`\n🚀 Creating ${framework} project...\n`);

      const child = spawn(command, args, {
        stdio: "inherit",
        shell: process.platform === "win32",
      });

      child.on("error", (error) => {
        console.error("\n❌ Failed to start the CLI:", error.message);
        process.exitCode = 1;
      });

      child.on("close", (code) => {
        if (code === 0) {
          console.log(`\n✅ Project created: ${projectName}`);
          console.log("\nNext steps:");
          console.log(`  cd ${projectName}`);
          console.log(
            framework === "angular" ? "  npm start" : "  npm run dev",
          );
        } else {
          console.error(`\n❌ Project creation failed (exit code: ${code}).`);
          process.exitCode = 1;
        }
      });
    } catch (error) {
      console.error("\n❌ An unexpected error occurred:", error.message);
      process.exitCode = 1;
    }
  });

program
  .command("check")
  .description("Check the current project")
  .action(() => {
    checkProject();
  });

program.parseAsync().catch((error) => {
  console.error("❌ Command failed:", error.message);
  process.exitCode = 1;
});
