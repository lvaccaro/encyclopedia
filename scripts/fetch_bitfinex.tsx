import { promises } from 'fs'
import { bitfinex_securities_file, bitfinex_tickers_file, fetchBitfinexSecurities, fetchBitfinexTickers} from '../src/libs/bitfinex.tsx'

async function fetch_securities() {
    const file = "./public/" + bitfinex_securities_file;
    console.log(`fetch assets in ${file}`);
    const assets = await fetchBitfinexSecurities(true);
    const text = JSON.stringify(assets);
    await promises.writeFile(file, text);
}
async function fetch_tickers() {
    const file = "./public/" + bitfinex_tickers_file;
    console.log(`fetch assets in ${file}`);
    const assets = await fetchBitfinexTickers(true);
    const text = JSON.stringify(assets);
    await promises.writeFile(file, text);
}
async function main() {
    await fetch_securities();
    await fetch_tickers();
}
main()