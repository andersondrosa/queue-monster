require("dotenv/config");

import Queue from "./src/index.js";

const queue = new Queue("integration-events", {
  connection: process.env.CONNECTION_STRING,
  query_interval: 5000,
  thread_limit: 4,
  visibility_timeout: 20,
  async: false,
});

queue.on("add", () => console.log("add"));
queue.on("add.ok", () => console.log("add.ok"));
queue.on("add.fail", () => console.log("add.fail"));
queue.on("process", () => console.log("process"));
queue.on("no-results", () => console.log("no-results"));
queue.on("before-handler", () => console.log("before-handler"));
queue.on("after-handler", () => console.log("after-handler"));
queue.on("stop", () => console.log("stop"));
queue.on("reading-queue", () => console.log("reading-queue"));
queue.on("create-queue", () => console.log("create-queue"));
queue.on("create-queue.ok", () => console.log("create-queue.ok"));
queue.on("create-queue.fail", () => console.log("create-queue.fail"));
queue.on("delete-message", () => console.log("delete-message"));
queue.on("delete-message.ok", () => console.log("delete-message.ok"));
queue.on("delete-message.fail", () => console.log("delete-message.fail"));
queue.on("delete-queue", () => console.log("delete-queue"));
queue.on("delete-queue.ok", () => console.log("delete-queue.ok"));
queue.on("delete-queue.fail", () => console.log("delete-queue.fail"));

queue.on("handler-error", (err) => console.log("catching error:", err.message));

queue.process(async (data, m) => {
  console.log("PROCESSANDO...", data, m);
  await new Promise((resolve) => {
    setTimeout((x) => {
      resolve();
    }, 2000);
  });
  // throw Error("Test ERROR");
});
