(function (global, factory) {
  if (typeof define === "function" && define.amd) {
    define(["exports", "azure-storage"], factory);
  } else if (typeof exports !== "undefined") {
    factory(exports, require("azure-storage"));
  } else {
    var mod = {
      exports: {}
    };
    factory(mod.exports, global.azureStorage);
    global.index = mod.exports;
  }
})(typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : this, function (_exports, _azureStorage) {
  "use strict";

  Object.defineProperty(_exports, "__esModule", {
    value: true
  });
  _exports.default = void 0;
  _azureStorage = _interopRequireDefault(_azureStorage);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function Queue(queue_name, params = {}) {
    //
    const queue = queue_name;
    const config = { ...params
    };
    var timingPromise;
    var threads = 0;
    var service;

    if (params.connection) {
      service = _azureStorage.default.createQueueService(params.connection);
    } // ---------------------------------------------------------------------------

    /**
     * Inicializador de conexão e criação de fila
     */


    this.init = function () {
      //
      if (this.tableExists) {
        return;
      }

      if (this.createQueuePromise == null) {
        this.createQueuePromise = this.createQueue();
      }

      return this.createQueuePromise;
    }; // ---------------------------------------------------------------------------

    /**
     * Configura o componente
     */


    this.config = function (params) {
      Object.assign(config, params);
    };
    /**
     * Encrementa o número de threads abertas para limitar o número de processos
     * simultâneos
     */


    function openThread() {
      threads++;
    }
    /**
     * Decrementa o número de threads abertas
     */


    function closeThread() {
      threads--;
    } // ---------------------------------------------------------------------------

    /**
     * Adiciona um item à fila para processar
     * @param {Object} data Dados da mensagem
     */


    this.add = async function (data) {
      //
      await this.init();
      this.emit("add", data);
      const message = JSON.stringify(data);
      await new Promise((resolve, reject) => {
        //
        service.createMessage(queue, message, (err, results, response) => {
          if (err) {
            this.emit("add.fail", err);
            return reject(err);
          }

          this.emit("add.ok", {
            results,
            response
          });
          resolve({
            results,
            response
          });
        });
      });
    }; // ---------------------------------------------------------------------------


    const timing = ms => {
      timingPromise = new Promise(resolve => {
        setTimeout(x => {
          timingPromise = null;
          resolve();
        }, ms || config.query_interval || 3000);
      });
      return timingPromise;
    };

    this.process = function (handler) {
      //
      this.emit("process");
      return new Promise(async resolve => {
        //
        await this.init();

        if (this.__stoped) {
          return resolve();
        }

        threads = 0;

        while (!this.__stoped) {
          // TIMING
          await timing();

          if (this.__stoped) {
            break;
          } // READING QUEUE ---------------------


          let messages = await this.readQueue();

          if (this.__stoped) {
            break;
          }

          for (let i in messages) {
            callHandler(handler, messages[i]);
          }
        }

        resolve();
      });
    }; // ---------------------------------------------------------------------------


    const callHandler = (handler, message) => {
      //
      this.emit("before-handler", message);
      openThread();
      return new Promise(async (resolve, reject) => {
        try {
          // HANDLER
          await handler(JSON.parse(message.messageText), message);
          this.emit("after-handler", message); // DELETE MESSAGE

          await this.deleteMessage(message); //
        } catch (e) {
          closeThread();
          return reject();
        }

        closeThread();
        resolve();
      });
    }; // ---------------------------------------------------------------------------


    this.stop = function () {
      if (timingPromise instanceof Promise) {
        timingPromise.resolve();
      }

      this.__stoped = true;
      this.emit("stop");
    }; // ---------------------------------------------------------------------------


    this.readQueue = function () {
      //
      this.emit("reading-queue");
      const thread_limit = config.thread_limit || 5;

      if (threads >= thread_limit) {
        return;
      }

      const params = {
        numOfMessages: thread_limit - threads,
        visibilityTimeout: config.visibility_timeout || 20
      };
      return new Promise((resolve, reject) => {
        service.getMessages(queue, params, (err, results, res) => {
          if (err) {
            this.emit("reading-queue.fail", err);
            reject(err);
          } else {
            this.emit("reading-queue.ok", results);
            resolve(results);
          }
        });
      });
    }; // ---------------------------------------------------------------------------


    const events = {};

    this.emit = function (key, params) {
      if (events.hasOwnProperty(key)) {
        events[key].map(e => e(params));
      }
    };

    this.on = function (key, cb) {
      if (!events.hasOwnProperty(key)) {
        events[key] = [];
      }

      events[key].push(cb);
    };

    this.unbind = function (key, cb) {
      if (!events.hasOwnProperty(key)) {
        return;
      }

      for (let i in events[key]) {
        if (events[key][i] == cb) {
          events[key].splice(i, 1);
          break;
        }
      }
    }; // ---------------------------------------------------------------------------


    this.createQueue = function () {
      return new Promise((resolve, reject) => {
        this.emit("create-queue");
        service.createQueueIfNotExists(queue, (err, results, res) => {
          this.createQueuePromise = false;
          this.tableExists = true;

          if (err) {
            this.emit("create-queue.fail", err);
            reject(err);
          } else {
            this.emit("create-queue.ok", res);
            resolve(res);
          }
        });
      });
    }; // ---------------------------------------------------------------------------


    this.deleteMessage = function (message) {
      const {
        messageId,
        popReceipt
      } = message;
      return new Promise(async (resolve, reject) => {
        await this.init();
        this.emit("delete-message", message);
        service.deleteMessage(queue, messageId, popReceipt, (err, res) => {
          if (err) {
            this.emit("delete-message.fail", err);
            reject(err);
          } else {
            this.emit("delete-message.ok", res);
            resolve(res);
          }
        });
      });
    }; // ---------------------------------------------------------------------------


    this.deleteQueue = function () {
      return new Promise(async (resolve, reject) => {
        await this.init();
        this.emit("delete-queue", queue);
        service.deleteQueue(queue, (err, res) => {
          if (err) {
            this.emit("delete-queue.fail", err);
            reject(err);
          } else {
            this.emit("delete-queue.ok", res);
            resolve(res);
          }
        });
      });
    };
  }

  var _default = Queue;
  _exports.default = _default;
});