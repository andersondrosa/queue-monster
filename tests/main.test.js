import "dotenv/config";
import Queue from "../dist";
import { ItemFaker } from "./fakers";
import faker from "faker";

const queue_name = "test-" + Date.now();

describe("Funcionamento geral", () => {
  //
  test("Deve adicionar ouvinte, executar e removêlo", async () => {
    //
    const $queue = new Queue("", { connection: "" });

    let value;

    let callback1 = () => {
      value = "callback1";
    };
    let callback2 = () => {
      value = "callback2";
    };

    $queue.on("event", callback1);
    $queue.on("event", callback2);

    $queue.emit("event");

    expect(value).toBe("callback2");

    $queue.unbind("event", callback2);

    $queue.emit("event");

    expect(value).toBe("callback1");
  });

  test("Deve criar as filas que não existem", async () => {
    //
    const $queue = new Queue(queue_name, {
      connection: process.env.CONNECTION_STRING,
    });

    $queue.on("add", () => console.log("add"));
    $queue.on("add.ok", () => console.log("add.ok"));
    $queue.on("add.fail", () => console.log("add.fail"));
    $queue.on("process", () => console.log("process"));
    $queue.on("queue.empty", () => console.log("queue.empty"));
    $queue.on("before-handler", () => console.log("before-handler"));
    $queue.on("after-handler", () => console.log("after-handler"));
    $queue.on("stop", () => console.log("stop"));
    $queue.on("reading-queue", () => console.log("reading-queue"));
    $queue.on("create-queue", () => console.log("create-queue"));
    $queue.on("create-queue.ok", () => console.log("create-queue.ok"));
    $queue.on("create-queue.fail", () => console.log("create-queue.fail"));
    $queue.on("delete-message", () => console.log("delete-message"));
    $queue.on("delete-message.ok", () => console.log("delete-message.ok"));
    $queue.on("delete-message.fail", () => console.log("delete-message.fail"));
    $queue.on("delete-queue", () => console.log("delete-queue"));
    $queue.on("delete-queue.ok", () => console.log("delete-queue.ok"));
    $queue.on("delete-queue.fail", () => console.log("delete-queue.fail"));

    const fakers = ItemFaker(4);

    await Promise.all(fakers.map((item) => $queue.add(item)));

    const results = [];

    $queue.on("reading-queue.ok", (messages) => {
      if (messages.length == 0) {
        console.log("Empty QUEUE, stoping...");
        $queue.stop();
      }
    });

    $queue.config({
      query_interval: 1000,
      thread_limit: 4,
      visibility_timeout: 20,
    });

    await $queue.process((data) => {
      setTimeout((x) => {
        results.push({
          name: data.name,
          email: data.email,
        });
      }, 100);
    });

    console.log(results);

    try {
      await $queue.deleteQueue();
    } catch (e) {}

    // expect("ok").toBe("ok");
    expect(results.length).toBe(fakers.length);
    //
  }, 10000);
});
