"use strict";
// for local development only
if (process.env.NODE_ENV == "local") require("dotenv").config();
import { CLogger, clog, levels } from "mxw-libs-clogger";
import { errors, throwError } from "mxw-libs-errors";
import { isUndefinedOrNull } from "mxw-libs-utils";
import { Exporter } from "./bot/exporter";

const { name, version } = require("../package.json");

const exportName = "export"

export default class CoreService {
  private static self: CoreService;

  private entryPoint: string;

  public static get Instance() {
    return this.self || throwError(errors.NOT_INITIALIZED, "CoreService initialization is required");
  }

  public static get isEnabled() {
    return this.self ? true : false;
  }

  public static init(logLevel?: string) {
    const self = new this();


    CLogger.Instance.init(levels.CRITICAL);
    // First argv is module name
    self.entryPoint = process.argv[2];

    for (let i = 3; process.argv.length > i; i++) {
      const argv = process.argv[i];

      switch (argv) {
        case "logLevel": logLevel = process.argv[++i]; break;
      }
    }

    if (isUndefinedOrNull(logLevel)) {
      for (const [index, argv] of process.argv.entries()) {
        if ("logLevel" == argv) logLevel = process.argv[index + 1];
      }
    }

    if (!isUndefinedOrNull(levels[logLevel])) {
      CLogger.Instance.level = levels[logLevel];
    }

    this.self = self;
    return self;
  }

  public static async term() {
    try {
      clog(levels.WARNING, "Service is terminating...");

      if (this.self) {
        this.self = undefined;
      }

      clog(levels.WARNING, "Service is terminated");
    } catch (error) {
      clog(levels.CRITICAL, "Service failed to terminate:", error);
      throw error;
    }
  }

  public async run() {
    try {
      clog(levels.WARNING, "Starting entrypoint:", this.entryPoint);

      switch (this.entryPoint) {
        case exportName:
          clog(levels.WARNING, `Starting ${this.entryPoint} (${version})...`);

          await Exporter.init({
            BASE_API: process.env.DEXTRADE_BASE_API,
            API_KEY: process.env.DEXTRADE_API_KEY,
            API_SECRET: process.env.DEXTRADE_API_SECRET,
          });
          await Exporter.Instance.run();
          break;

        default:
          throwError(errors.INVALID_REQUEST, `The supported module is ${exportName}`, { entryPoint: this.entryPoint });
      }

      return this;
    }
    catch (error) {
      clog(levels.CRITICAL, "Failed to start:", error);
      throw error;
    }
  }
}
