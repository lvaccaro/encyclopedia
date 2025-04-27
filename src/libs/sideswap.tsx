'use client'

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
};

export class Asset {
  asset_id!: string;
  name!: string;
  precision!: number;
  ticker!: string;
  market_type!: string;
  always_show!: boolean;
  instant_swaps!: boolean;
};

export class Price {
  asset_pair!: AssetPair;
  ind_price: number | undefined;
  last_price: number | undefined;
}
let index = 0;

type DelegatePrice = (price: Price) => (void);
const WebSock = global.WebSocket || global.MozWebSocket || require('ws');
const ws = new WebSock('wss://api.sideswap.io/json-rpc-ws');

async function wsSubscribe(request: any, subscribe: DelegatePrice) {
  if (ws.readyState !== WebSock.OPEN) {
    return
  }
  ws.onmessage = (event:any) => {
    console.log('Message received:', event.data);
    const pkg = JSON.parse(event.data.toString());
    const price = pkg.params?.market_price as Price;
    if (price != null) {
      subscribe(price);
    }
  };
  console.log('Message send:', request);
  ws.send(JSON.stringify(request));
};


async function wsSendWaitRecv(request: any): Promise<any> {
  return new Promise((resolve, reject) => {
    if (ws.readyState !== WebSock.OPEN) {
      reject("WebSocket not connected")
      return
    }
    ws.onmessage = (event:any) => {
      console.log('Message received:', event.data);
      const pkg = JSON.parse(event.data.toString());
      if (pkg.id != index) {
        reject("Error");
        return
      }
      index += 1;
      resolve(pkg);
    };
    console.log('Message send:', request);
    ws.send(JSON.stringify(request));
  });
}
  
export const connectSideswap = async (): Promise<void> => {
  console.log('Connecting WebSocket connection');
  return new Promise((resolve, reject) => {
    if (ws.readyState === WebSock.OPEN) {
      console.log('WebSocket already connected');
      resolve();
      return;
    }
    ws.onopen = () => {
      console.log('Connected to WebSocket');
      resolve();
    };
    ws.onerror = (error:any) => {
      console.error('WebSocket error:', error);
      reject(error);
    };
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
  });
}

export const closeSideswap = async (): Promise<void> => {
  console.log('Closing WebSocket connection');
  ws.close();
}

export const fetchSideswapAssets = async (): Promise<Asset[]> => {
  const request = {
    "id": index,
    "method": "assets",
    "params": {
      "all_assets": true,
      "embedded_icons": false,
    }
  };
  console.log('request:', request);
  const res = await wsSendWaitRecv(request);
  return res.result.assets as Asset[];
};

export const fetchSideswapMarkets = async (): Promise<Market[]> => {
  const request = {
    "id": index,
    "method": "market",
    "params": {
      "list_markets": {}
    }
  };
  console.log('request:', request);
  const res = await wsSendWaitRecv(request);
  return res.result.list_markets.markets as Market[];
};
  
export const fetchSideswapMarket = async (base: string, quote: string): Promise<Quote> => {
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
  console.log('request:', request);
  const res = await wsSendWaitRecv(request);
  const quotes = res.result.chart_sub.data.reverse()[0] as Quote;
  if (quotes == null) {
    console.log("Error: no quotes");
    return quotes;
  }
  quotes.asset_pair = new AssetPair(base, quote);
  return quotes;
};

export const subscribeSideswapPrice = async (base: string, quote: string, delegate: DelegatePrice) => {
  const request = {
    "id": index,
    "method": "market",
    "params": {
      "subscribe": {
        "asset_pair": {
          "base": base,
          "quote": quote
        }
      }
    }
  };
  const res = await wsSubscribe(request, delegate)
}

export const localSideswapAssets = async (): Promise<Asset[]> => {
  const res = await fetch("/assets/sideswap_assets.json")
  return await res.json() as Asset[];
};
  
export const localSideswapMarkets = async (): Promise<Market[]> => {
  const res = await fetch("/assets/sideswap_markets.json")
  return await res.json() as Market[];
};
