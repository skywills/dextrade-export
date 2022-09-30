import { throwError, errors, describeError } from "mxw-libs-errors";
import {
  allowNullOrEmpty,
  checkFormat,
  checkNumber,
  checkString,
  isUndefinedOrNullOrEmpty,
  notAllowNullOrEmpty,
} from "mxw-libs-utils";
import {
  ApiConfig,
} from "./bot-interfaces";
import { BotRestManager } from "./bot-rest-manager";
import * as json2csv from 'json-2-csv';
import fs from 'fs';
import CommonUtils from "../utils/common-utils";

export class Exporter {
  private static self: Exporter;

  private env: ApiConfig;

  public static get Instance() {
    return (
      this.self ||
      throwError(
        errors.NOT_INITIALIZED,
        "Exporter initialization is required",
      )
    );
  }

  public static async init(env: ApiConfig) {
    env = checkFormat(
      {
        BASE_API: notAllowNullOrEmpty(checkString),
        API_KEY: notAllowNullOrEmpty(checkString),
        API_SECRET: notAllowNullOrEmpty(checkString),
        REQUEST_TIMEOUT: allowNullOrEmpty(checkNumber, 60000),
      },
      env,
    );

    try {
      if (isUndefinedOrNullOrEmpty(this.self)) this.self = new this();

      this.self.env = env;
      BotRestManager.init(this.self.env)


    } catch (error) {
      const { message } = describeError(error);
      throwError(
        errors.NOT_CONFIGURED,
        "Initializing BotRestManager failed. Environment: " + message,
        { error },
      );
    }
    return Promise.resolve(this.self);
  }

  public async run() {
    const symbol = process.env.DEXTRADE_EXPORT_SYMBOL
    await this.exportOpenOrders(symbol)
    await this.exportOrderHistory(symbol)
    console.log("export completed")
  }

  public async exportOpenOrders(symbol?: string, output?: string) {
    console.log("exporting Open Order")
    const outputPath = output || "open_orders.csv"
    let res = await BotRestManager.Instance.getActiveOrders()
    let result = isUndefinedOrNullOrEmpty(symbol) ? res.list : res.list.filter(item => item.pair == symbol)
    result = result.map(data => {
      const date = new Date(data.time_create * 1000)
      return {
        "id": data.id,
        "Category": data.type == 0 ? "buy" : "sell",
        "Pair": data.pair,
        "Vol": data.volume,
        "Executed Vol": data.volume_done,
        "Order Price": data.rate,
        "Order Amount": data.price,
        "Executed Amount": data.price_done,
        "Order Date": `${date.toLocaleDateString("en-US")} ${date.toLocaleTimeString("en-US")}`,
      }
    })

    if (result.length > 0) {
      await this.exportCsv(result, outputPath);
    } else {
      console.log("no open orders founds")
    }
  }

  public async exportOrderHistory(symbol?: string, output?: string) {
    console.log("exporting Order History")
    const outputPath = output || "order_history.csv"
    let res = await BotRestManager.Instance.getOrdersHistory()
    let result = isUndefinedOrNullOrEmpty(symbol) ? res.list : res.list.filter(item => item.pair_name == symbol)
    result = result.map(data => {
      const date = new Date(data.time_create * 1000)
      const doneDate = new Date(data.time_done * 1000)
      return {
        "id": data.id,
        "Category": data.type == 0 ? "buy" : "sell",
        "Pair": data.pair_name,
        "Vol": CommonUtils.parseAmount(data.volume).toNumber(),
        "Executed Vol": CommonUtils.parseAmount(data.volume_done).toNumber(),
        "Order Price": CommonUtils.parseAmount(data.rate).toNumber(),
        "Order Amount": CommonUtils.parseAmount(data.price).toNumber(),
        "Executed Amount": CommonUtils.parseAmount(data.price_done).toNumber(),
        "Order Date": `${date.toLocaleDateString("en-US")} ${date.toLocaleTimeString("en-US")}`,
        "Completed Date": `${doneDate.toLocaleDateString("en-US")} ${doneDate.toLocaleTimeString("en-US")}`,
      }
    })

    if (result.length > 0) {
      await this.exportCsv(result, outputPath);
    } else {
      console.log("no order history founds")
    }
  }


  private async exportCsv(data: any[], outputPath: string) {
    const csv = await json2csv.json2csvAsync(data)
    fs.writeFileSync(outputPath, csv);
  }

}