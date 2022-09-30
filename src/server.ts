"use strict";

import { CLogger, clog, levels } from "mxw-libs-clogger";
import CoreService from "./core-service";

CoreService.init()
  .run()
  .catch(async () => {
    await CoreService.term().catch(() => {});
    process.exit(-1);
  });

async function exitHandler(cleanup = false) {
  if (cleanup) {
    await CoreService.term().catch(() => {});
  }
}

//do something when app is closing
process.on("exit", exitHandler.bind(null, false));

//catches ctrl+c event
process.on("SIGINT", exitHandler.bind(null, true));

//catches SIGHUP (1) event to increase log depth (circled)
process.on("SIGHUP", () => {
  CLogger.Instance.depth = null;
  clog(levels.CRITICAL, "Logger depth:", CLogger.Instance.depth);
});

//catches SIGUSR1 (10) event to increase log width (circled)
process.on("SIGUSR1", () => {
  CLogger.Instance.width = null;
  clog(levels.CRITICAL, "Logger width:", CLogger.Instance.width);
});

//catches SIGUSR2 (12) event to increase log severity (circled)
process.on("SIGUSR2", () => {
  CLogger.Instance.level = null;
  clog(levels.CRITICAL, "Logger level:", CLogger.Instance.level);
});

//catches uncaught exceptions
process.on("uncaughtException", error => {
  exitHandler.bind(null, true);
});

//catches unhandled rejection
process.on("unhandledRejection", reason => {
  if (process.stderr.writable) {
    process.stderr.write(`unhandledRejection: ${reason}`);
  }
});

// listen for TERM signal .e.g. kill
process.on("SIGTERM", exitHandler.bind(null, true));
