import concurrently from "concurrently";

const { result } = concurrently(
  [
    {
      command: "bun run dev:server",
      name: "server",
      prefixColor: "blue",
    },
    {
      command: "cd apps/web && bun run desktop:dev",
      name: "tauri",
      prefixColor: "magenta",
    },
  ],
  {
    prefix: "name",
    killOthersOn: "failure",
    restartTries: 3,
  },
);

result.then(
  () => {
    console.log("All processes completed successfully");
  },
  (error) => {
    console.error("One or more processes failed:", error);
    process.exit(1);
  },
);
