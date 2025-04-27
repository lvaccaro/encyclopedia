'use client'

export class BitfinexTicker {
  pair!: string;
  price!: number;
  base!: string;
  quote!: string;
};

const baseurl = 'https://api-pub.bitfinex.com/v2';
const securities_url = `${baseurl}/conf/pub:map:category:securities`;
const tickers_url = `${baseurl}/tickers`;
const symbols = ["tALT11M2507:USD","tALT11M2507:UST","tALT11M250830:USD","tALT11M250830:UST","tALT11M251029:USD","tALT11M251029:UST","tALT2612:USD","tALT2612:UST","tHILSV:USD","tTITAN1:GBP","tTITAN1:USD","tTITAN2:GBP","tTITAN2:USD","tUSTBL:USD","tUSTBL:UST"];
export const bitfinex_securities_file = "/assets/bitfinex_securities.json";
export const bitfinex_tickers_file = "/assets/bitfinex_tickers.json";

export const fetchBitfinexSecurities = async (remote: boolean): Promise<any> => {
  if (remote) {
    return await (await fetch(securities_url)).json();
  } else {
    return await (await fetch(bitfinex_securities_file)).json();
  }
};
export const fetchBitfinexTickers = async (remote: boolean): Promise<any> => {
  if (remote) {
    return (await fetch(`${tickers_url}?symbols=${symbols.join(',')}`)).json();
  } else {
    return await (await fetch(bitfinex_tickers_file)).json();
  }
};
export const loadBitfinexSecurities = async (): Promise<string[]> => {
  const res = await fetchBitfinexSecurities(false);
  return res[0].map((s: any) => fix(s[0]) as string) as string[];
};
export const loadBitfinexTickers = async (): Promise<BitfinexTicker[]> => {
  const res = await fetchBitfinexTickers(false);
  const tickers: BitfinexTicker[] = [];
  for (const tick of res) {
    if (tick[0].startsWith("t")) {
      const ticker = new BitfinexTicker();
      ticker.pair = tick[0];
      ticker.price = tick[1];
      ticker.base = pairs(tick[0])[0];
      ticker.quote = pairs(tick[0])[1];
      tickers.push(ticker);
    }
  }
  return tickers;
};
function pairs(ticker: string): string[] {
  ticker = ticker.replace("t", "");
  const pairs = ticker.split(":");
  if (pairs.length != 2) {
    return [ticker];
  }
  const base = fix(pairs[0]);
  const quote = fix(pairs[1]);
  return [base, quote];
}
function fix(name: string): string {
  switch (name) {
    case "TITAN1": return "TitanI";
    case "TITAN2": return "TitanII";
    case "UST": return "USDt";
    default: return name;
  }
}
