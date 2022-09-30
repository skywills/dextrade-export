import { throwError, errors, describeError } from "mxw-libs-errors";
import {
  allowNullOrEmpty,
  checkFormat,
  checkNumber,
  checkString,
  isUndefinedOrNullOrEmpty,
  notAllowNullOrEmpty,
  sortObject,
} from "mxw-libs-utils";
import {
  ApiConfig,
  DTLimitOrderRequest,
} from "./bot-interfaces";
import BigNumber from "bignumber.js";
import * as crypto from "crypto";
import Axois from "axios";
import CommonUtils from "../utils/common-utils";

export class BotRestManager {
  private static self: BotRestManager;

  private env: ApiConfig;

  public static get Instance() {
    return (
      this.self ||
      throwError(
        errors.NOT_INITIALIZED,
        "BotRestManager initialization is required",
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

  public getSymbols() {
    return this.get("/v1/public/symbols", {}).then(res => {
      return res.map(item => {
        return {
          id: item.id,
          pair: item.pair,
          base: item.base,
          quote: item.quote,
        }
      });
    });
  }

  public async getSymbolDetail(symbol: string): Promise<{
    id: number,
    pair: string,
    base: string,
    quote: string,
  }> {
    const symbols = await this.getSymbols();
    const sym = symbols.find(item => item.pair === symbol);
    return sym ? sym : null;
  }

  public getTicker(symbol: string) {
    return this.get("/v1/public/ticker", { pair: symbol }).then(res => {
      return {
        id: res.id,
        pair: res.pair,
        last: new BigNumber(res.last),
        open: new BigNumber(res.open),
        close: new BigNumber(res.close),
        high: new BigNumber(res.high),
        low: new BigNumber(res.low),
        minTrade: new BigNumber(res.min_trade),
      }
    });
  }

  public getOrderBook(symbol: string): Promise<{ buy: any[], sell: any[] }> {
    return this.get("/v1/public/book", { pair: symbol }).then(res => {
      return {
        buy: res.buy || [],
        sell: res.sell || [],
      }
    });
  }

  public getTradeHistory(symbol: string) {
    return this.get("/v1/public/trades", { pair: symbol }).then(res => {
      return res;
    });
  }

  public async getLastTrade(symbol: string) {
    const trades = await this.getTradeHistory(symbol);
    const trade = trades.length > 0 ? trades[0] : { volume: 0, rate: 0, price: 0, timestamp: 0 };

    return {
      price: trade.rate,
      size: trade.volume,
      // to miliseconds
      timestamp: trade.timestamp * 1000,
    }
  }

  public async getBestBidAsk(symbol: string): Promise<any> {
    const orderBooks = await this.getOrderBook(symbol);
    return CommonUtils.getBestBidAskFromOrderBook(orderBooks);
    // const { buy, sell } = orderBooks || { buy: [], sell: [] };

    // const bestBid = buy.length > 0 ? buy[0] : { volume: 0, rate: 0, count: 0 };
    // const bestAsk = sell.length > 0 ? sell[0] : { volume: 0, rate: 0, count: 0 };

    // return {
    //   bestBid: bestBid.rate,
    //   bestBidSize: bestBid.volume,
    //   bestAsk: bestAsk.rate,
    //   bestAskSize: bestAsk.volume,
    // }
  }

  public getOrder(id: string) {
    return this.post("/v1/private/get-order", {
      order_id: id,
    });

  }

  public getActiveOrders(symbol?: string) {
    return this.post("/v1/private/orders", {});
  }

  public getOrdersHistory(symbol?: string) {
    return this.post("/v1/private/history", {});
  }

  public async cancelOrder(id: string) {
    const res = await this.post("/v1/private/delete-order", {
      order_id: id,
    });
    return res;
  }

  public async getBalances() {
    const res = await this.post("/v1/private/balances", {
    });
    return res;
  }

  public get(method: string, params?: any, overrides?: any): Promise<any> {
    let url = this.env.BASE_API + method;
    if (params) {
      url += "?";
      Object.keys(params).forEach(key => {
        const keyValue = `${key}=${encodeURIComponent(params[key])}`;
        url += keyValue + "&";
      })
      url = url.substring(0, url.length - 1);
    }

    let headers = {};
    // Support custom headers
    if (overrides && overrides.headers) {
      headers = overrides.headers;
    }

    const timeout = overrides?.timeout || this.env.REQUEST_TIMEOUT;

    let client = Axois.create({
      timeout,
      headers
    });
    return client.get(url).then((response) => {
      return this.responseHandler(undefined, response, url, timeout, params);
    }).catch(error => {
      return this.responseHandler(error, undefined, url, timeout, params);
    });
  }


  public post(method: string, params?: any, overrides?: any): Promise<any> {
    if (!params.request_id) {
      params.request_id = new Date().getTime().toString();
    }
    const url = this.env.BASE_API + method;

    let headers = {};
    // Support custom headers
    if (overrides && overrides.headers) {
      headers = overrides.headers;
    }

    if (!headers["login-token"]) {
      headers["login-token"] = this.env.API_KEY;
    }

    if (!headers["X-Auth-Sign"]) {
      const signature = this.generateSignature(params);
      headers["X-Auth-Sign"] = signature;
    }

    const timeout = overrides?.timeout || this.env.REQUEST_TIMEOUT;

    let client = Axois.create({
      timeout,
      headers
    });
    return client.post(url, params).then((response) => {
      return this.responseHandler(undefined, response, url, timeout, params);
    }).catch(error => {
      return this.responseHandler(error, undefined, url, timeout, params);
    });
  }

  private generateSignature(params: any) {
    const sortedParams = sortObject(params);
    let values = "";
    Object.keys(sortedParams).forEach(key => {
      values += sortedParams[key] + "";
    });
    values += this.env.API_SECRET;
    const hash = crypto.createHash("sha256").update(values);
    return hash.digest("hex");
  }

  private responseHandler(error: any, response: any, url: string, timeout: number, params?: any) {
    return new Promise((resolve, reject) => {
      // request fauled with status code 409 == maintanance?
      if (error || !response) {
        console.log("error", JSON.stringify(error.response.data))
        const errorMessage = error.response?.data ? error.response.data.error : "Connection error - " + error.message;
        return reject(errors.createError(errors.CONNECTION_ERROR, errorMessage, { url, timeout: timeout, response: (null != response) ? response.data : null, error: error }));
      }
      if (200 != response.status) {
        return reject(errors.createError(errors.INVALID_RESPONSE, "Invalid response - " + response.status, { url, timeout: this.env.REQUEST_TIMEOUT }));
      }
      let result = response.data;
      if (!result.status) {
        const message = result.msg || result.message || "Failed response - " + result.ret
        return reject(errors.createError(result.ret ? result.ret : errors.FAILED, message, { status: result.status, message: result.msg ? result.msg : undefined, params, url, timeout: this.env.REQUEST_TIMEOUT }));
      }
      return resolve(result.data);
    });
  }

}