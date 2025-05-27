
import Database from 'better-sqlite3';
import { promises, existsSync, mkdirSync } from 'fs'

const file = '/Users/luca/Downloads/liquid.db';

const db = new Database(file, { readonly: true });
db.pragma("journal_mode = WAL")


async function main() {
    console.log("fetch issuances");
    if (!existsSync("./public/issuances/")){
        mkdirSync("./public/issuances/");
    }
    await fetch_assets();
}

async function fetch_assets() { 
    const stmt = db.prepare('select distinct(asset) from issuances').all();
    for (const entry of stmt) {
        //console.log("asset: ", entry.asset);
        await fetch_issuances_for(entry.asset)
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
    //console.log(JSON.stringify(issuances));
    await promises.writeFile("./public/issuances/" + asset + ".json",JSON.stringify(issuances));
}
//fetch_issuances_for('ffffff18b8dcec0157cfff9dd61d0dd8cd2b0ed33dd518e1d4fdc12f64071261')
main()