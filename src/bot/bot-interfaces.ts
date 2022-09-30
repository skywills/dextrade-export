import BigNumber from "bignumber.js";

export enum APIResponse {
  OK = "200000",
  Error = "1001",
}

export enum OrderStatus {
  Pending = 0,
  Completed = 1,
  Cancelled = 2,
  Failed = 3,
}

export enum OrderCategory {
  FREQUENCY_ORDER = 1,
  SPREAD_MAINTAIN = 2,
}

export enum ExchangeSource {
  KUCOIN = 1,
  DEXTRADE = 2,
}

export enum ExecutedLiquidity {
  TAKER = 1,
  MAKER = 2,
}

export enum SideType {
  BUY = 0,
  SELL = 1,
}

export enum OrderType {
  LIMIT = 0,
  MARKET = 1,
  STOP_LIMIT = 2,
  QUICK_MARKET = 3,
}

export interface ApiConfig {
  BASE_API: string;
  API_KEY: string;
  API_SECRET: string;
  REQUEST_TIMEOUT?: number;
}

export interface OrderRequest {
  clientOid?: string;

  side: SideType;

  symbol: string;

  type?: OrderType;

  remark?: string;

  stp?: string;
}

export interface LimitOrderRequest extends OrderRequest {
  price: string;

  size: string;

  timeInForce?: string;

  cancelAfter?: number;

  postOnly?: boolean;

  hidden?: boolean;

  iceberg?: boolean;

  visibleSize?: string;
}

export interface DTOrderRequest {

  type: SideType;

  pair: string;

  type_trade: OrderType;

}

export interface DTLimitOrderRequest extends DTOrderRequest {
  rate: string;

  volume: string;

}

export interface OrderResponse {
  orderId: string;
}

export interface CancelOrderResponse {
  orderId: string;
  clientOid?: string;
}

export interface TickerResponse {
  symbol?: string;
  sequence: string;
  bestAsk: BigNumber;
  size: BigNumber;
  price: BigNumber;
  bestBidSize: BigNumber;
  bestBid: BigNumber;
  bestAskSize: BigNumber;
  timestamp: number;
}

export interface LastTrade {
  price: BigNumber;
  timestamp: number;
}

export interface TradeOrderEvent {
  symbol: string;

  orderType: OrderType;

  side: SideType;

  orderId: string;

  liquidity: ExecutedLiquidity;

  type: string;

  orderTime: number;

  size: BigNumber;

  filledSize: BigNumber;

  price: BigNumber;

  matchPrice: BigNumber;

  matchSize: BigNumber;

  tradeId: string;

  clientOid: string;

  remainSize: BigNumber;

  status: string;

  ts: number;
}


export interface MarketTradeStats {
  marketId: number;

  marketSymbol: string;

  buyVol: BigNumber;

  buyAmount: BigNumber;

  sellVol: BigNumber;

  sellAmount: BigNumber;

  accVol: BigNumber;

  accAmount: BigNumber;

  accAvgPrice: BigNumber;
}