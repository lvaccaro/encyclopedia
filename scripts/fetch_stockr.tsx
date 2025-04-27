import { promises } from 'fs'
import { stokr_file, fetchStokrAssets} from '../src/libs/stokr.tsx'

async function fetch_assets() {
    const file = "./public/" + stokr_file;
    console.log(`fetch assets in ${file}`);
    const assets = await fetchStokrAssets(true);
    const text = JSON.stringify(assets);
    await promises.writeFile(file, text);
}
async function main() {
    await fetch_assets();
}
main()