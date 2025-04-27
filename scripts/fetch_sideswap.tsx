import { promises, existsSync, mkdirSync } from 'fs'
import { Asset, Market, fetchSideswapAssets, fetchSideswapMarkets, connectSideswap, closeSideswap } from '../src/libs/sideswap.tsx'

async function fetch_assets() {
    const file = "./public/assets/sideswap_assets.json";
    console.log(`fetch assets in ${file}`);
    const assets: Asset[] = await fetchSideswapAssets();
    //let map = {};
    //assets.forEach(item => map[item.asset_id] = item);
    const text = JSON.stringify(assets);
    await promises.writeFile(file, text);
}

async function fetch_markets() {
    const file = "./public/assets/sideswap_markets.json";
    console.log(`fetch markets in ${file}`);
    const markets: Market[] = await fetchSideswapMarkets();
    const text = JSON.stringify(markets);
    await promises.writeFile(file, text);
}

async function main() {
    await connectSideswap();
    await fetch_assets();
    await fetch_markets();
    await closeSideswap();
}
main()