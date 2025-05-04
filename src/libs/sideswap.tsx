
// MODELS

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
  volume!: number;
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

export type DelegatePrice = (price: Price) => (void);

// WEBSOCKET

  const wsUrl = 'wss://api.sideswap.io/json-rpc-ws';
  var isConnected = false;
  var messageCallbacks: Record<string, (message: any) => void> = {};
  var subscribeCallbacks: Record<string, (message: any) => void> = {};
  var nextMessageId = 0;

  const websocket = new WebSocket(wsUrl);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      isConnected = true;
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      isConnected = false;
      // Consider adding reconnection logic here
    };

    websocket.onmessage = (event: any) => {
      try {
        const message = JSON.parse(event.data);
        // Assuming the server includes a 'correlationId' in the response
        if (message && message.id && messageCallbacks[message.id]) {
          messageCallbacks[message.id](message);
          delete messageCallbacks[message.id]; // Clean up the callback
        } else if (message && subscribeCallbacks[message.method]){
          subscribeCallbacks[message.method](message);
        } else {
          console.log('Received unhandled message:', message);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    websocket.onerror = (error: any) => {
      console.error('WebSocket error:', error);
    };

const sendMessage = async (method: string, params: any) => {
  if (!isConnected || !websocket || websocket.readyState !== WebSocket.OPEN) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return sendMessage(method, params);
  }
    return new Promise((resolve, reject) => {
      const messageId = `${nextMessageId++}`;
      const messageToSend = JSON.stringify({
        method: method,
        params: params,
        id: messageId, // Include a correlation ID
      });

      messageCallbacks[messageId] = resolve; // Store the resolve function

      try {
        websocket.send(messageToSend);
      } catch (error) {
        delete messageCallbacks[messageId]; // Clean up on send error
        reject(error);
      }
    });
  };

const subscribe = async (method: string, params: any, callback:(message: any) => void) => {
  if (!isConnected || !websocket || websocket.readyState !== WebSocket.OPEN) {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return subscribe(method, params, callback);
  }
    const messageId = `${nextMessageId++}`;
    const subscribeMessage = JSON.stringify({  
        id: messageId, // Include a correlation ID
        method: method,
        params: params 
    });
    subscribeCallbacks[method] = callback; // Store the resolve function
    try {
      websocket.send(subscribeMessage);
    } catch (error) {
      delete subscribeCallbacks[method]; // Clean up on send error
    }
  };

const unsubscribe = (method: string, params: any) => {
    if (!isConnected || !websocket || websocket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected. Cannot unsubscribe.');
      return;
    }
    const messageId = `${nextMessageId++}`;
    const unsubscribeMessage = JSON.stringify({
        id: messageId, // Include a correlation ID 
        method: method, 
        params: params });
    delete subscribeCallbacks[method]; // Clean up on send error
    websocket.send(unsubscribeMessage);
  };


// SIDESWAP METHODS\

export const fetchSideswapAssets = async (): Promise<Asset[]> => {
  const res = await sendMessage('assets', { "all_assets": true, "embedded_icons": false }) as { result: { assets: Asset[] }};
  console.log('Data Response:', res);
  return res.result.assets;
};
export const fetchSideswapMarkets = async (): Promise<Market[]> => {
  const res = await sendMessage('market', {"list_markets": {}}) as { result: { list_markets: {markets: Market[] }}};
  console.log('Data Response:', res);
  return res.result.list_markets.markets as Market[];
};
export const fetchSideswapMarket = async (base: string, quote: string): Promise<Quote[]> => {
  const res = await sendMessage('market', {"chart_sub": {"asset_pair": {"base":base,"quote":quote}}}) as { result: { chart_sub: {data: Quote[] }}};
  console.log('Data Response:', res);
  return res.result.chart_sub.data as Quote[];
};

export const fetchSideswapSubscribePrice = async (base: string, quote: string, callback: DelegatePrice) => {
    const params = {
      "subscribe": {
          "asset_pair": {
            "base": base,
            "quote": quote
          }
        }
      };
    subscribe("market", params, (msg) => {
      console.log('msg');
      console.log(msg);
      if (msg.params?.market_price) {
        callback(msg.params?.market_price as Price)
      }
    });
 };

/*
  return (
    <div>
      <p>WebSocket Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {isConnected && (
        <div>
          <button onClick={() => sendMessage('assets', { "all_assets": true, "embedded_icons": false }).then(response => console.log('Data Response:', response)).catch(error => console.error('Send Error:', error))}>
          fetch Sideswap Assets
          </button>
          <button onClick={() => sendMessage('market', { "list_markets": {} }).then(response => console.log('Data Response:', response)).catch(error => console.error('Send Error:', error))}>
          fetch Sideswap Markets
          </button>
          <button onClick={() => sendMessage('market', { "chart_sub": { "asset_pair": {"base":base,"quote":quote}} }).then(response => console.log('Data Response:', response)).catch(error => console.error('Send Error:', error))}>
          fetch Sideswap Market lbtc/usdt
          </button>
          <button onClick={() => subscribe('market', {"subscribe": {"asset_pair": {"base":base,"quote":quote}}})}>
            Subscribe to Notifications
            </button>
          <button onClick={() => unsubscribe('market', {"subscribe": {"asset_pair": {"base":base,"quote":quote}}})}>
            Unsubscribe from Price
        </button>
        </div>
      )}
    </div>
  );
*/