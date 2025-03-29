'use client'

import { rejects } from "assert";

export class AssetPair {
  base!: string;
  quote!: string;

  constructor(base: string, quote: string) {
    this.base = base;
    this.quote = quote;
  }
}
export class Market {
  asset_pair!: AssetPair;
  fee_asset!: string;
  type!: string;  
}

export class Quote {
  close!: number;
  high!: number;
  low!: number;
  open!: number;
  time!: string;
  asset_pair: AssetPair | undefined;
}
let index = 0;

const ws = new WebSocket('wss://api.sideswap.io/json-rpc-ws');
  ws.onopen = () => {
    console.log('Connected to WebSocket');
  };
  ws.onclose = () => {
    console.log('WebSocket connection closed');
  };


async function wsSendWaitRecv(request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    ws.onmessage = (event) => {
      console.log('Message received:', event.data);
      const pkg = JSON.parse(event.data);
      if (pkg.id != index) {
        reject("Error")
        return
      }
      index += 1;
      resolve(pkg);
    };
    if (ws.readyState === WebSocket.OPEN) {
        console.log('Message send:', request);
        ws.send(JSON.stringify(request));
    } else {
      ws.onopen = () => {
        console.log('Connected to WebSocket');
        console.log('Message send:', request);
        ws.send(JSON.stringify(request));
      };
    }
  });
  }
  
  async function fetchSideswapMarkets(): Promise<Market[]>  {
    const request = {
      "id": index,
      "method": "market",
      "params": {
        "list_markets": {}
      }
    };
    const res = await wsSendWaitRecv(request);
    return res.result.list_markets.markets as Market[];
  }
  
  async function fetchSideswapMarket(base: string, quote: string): Promise<Quote> {
    const request = {
      "id": index,
      "method": "market",
      "params": {
        "chart_sub": {
          "asset_pair": {
            "base": base,
            "quote": quote
          }
        }
      }
    };
    const res = await wsSendWaitRecv(request);
    return res.result.chart_sub.data.reverse()[0] as Quote;
  }

  
export const getSideswapMarkets =
async (): Promise<Market[]> => {
  // Fetch from the API or cache
  try {
    return await fetchSideswapMarkets();
  } catch {
    return Promise.resolve([])
  }
};

export const getSideswapMarket =
async (base: string, quote: string): Promise<Quote | undefined> => {
  // Fetch from the API or cache
  try {
    const market = await fetchSideswapMarket(base, quote);
    if (market === undefined) {
      return undefined;
    }
    market.asset_pair = new AssetPair(base, quote);
    return market;
  } catch {
    return Promise.resolve(undefined)
  }
};
