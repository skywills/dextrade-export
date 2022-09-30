import BigNumber from "bignumber.js";

export default class CommonUtils {

  public static parseAmount(raw: BigNumber | number): BigNumber {
    return new BigNumber(raw).div(new BigNumber(10).pow(8));
  }

  public static toRawAmount(value: BigNumber | number): BigNumber {
    return new BigNumber(value).multipliedBy(new BigNumber(10).pow(8));
  }

  public static getBestBidAskFromOrderBook(orderBooks: any) {
    const { buy, sell } = orderBooks || { buy: [], sell: [] };

    const bestBid = buy.length > 0 ? buy[0] : { volume: 0, rate: 0, count: 0 };
    const bestAsk = sell.length > 0 ? sell[0] : { volume: 0, rate: 0, count: 0 };

    return {
      bestBid: bestBid.rate,
      bestBidSize: bestBid.volume,
      bestAsk: bestAsk.rate,
      bestAskSize: bestAsk.volume,
    }
  }
}
