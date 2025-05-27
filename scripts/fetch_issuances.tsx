
import Database from 'better-sqlite3';
import { promises, existsSync, mkdirSync } from 'fs'

const db_file = '/Users/luca/Downloads/liquid.db';
const priority_file = './public/assets/priority_assets.json';

const db = new Database(db_file, { readonly: true });
db.pragma("journal_mode = WAL")

async function main() {
    console.log("fetch issuances");
    if (!existsSync("./public/issuances/")){
        mkdirSync("./public/issuances/");
    }
    await fetch_assets();
}

async function fetch_assets() { 
    let res = await promises.readFile(priority_file);
    let assets = JSON.parse(res);
    for (const asset of assets) {
        await fetch_issuances_for(asset);
    }
}

async function fetch_issuances_for(asset: string) {
    console.log("fetch issuances for: ", asset);
    const stmt = db.prepare(`select * from issuances where asset = '${asset}'`).all();
    //console.log(JSON.stringify(stmt));
    let issuances:unknown[] = [];
    for (const entry of stmt) {
        let item = Object.values(entry);
        issuances.push(item);
    }
    console.log(JSON.stringify(issuances));
    await promises.writeFile("./public/issuances/" + asset + ".json",JSON.stringify(issuances));
}
//fetch_issuances_for('ffffff18b8dcec0157cfff9dd61d0dd8cd2b0ed33dd518e1d4fdc12f64071261')
main()