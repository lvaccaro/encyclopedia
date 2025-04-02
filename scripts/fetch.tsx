import { promises, existsSync, mkdirSync } from 'fs'

const testnet = false;
const repo = testnet ? "asset_registry_testnet_db" : "asset_registry_db";
const github = "https://github.com/Blockstream/" + repo;
const icon = github + "/raw/master/icons.json"
const assets_minimal = github + "/raw/master/index.minimal.json"

async function fetch_icons() {
    console.log("icon: ", icon);
    if (!existsSync("./public/icons/")){
        mkdirSync("./public/icons/");
    }
    const res =  await fetch(icon);
    const icons = await res.json();
    for (const id in icons) {
        var bitmap = new Buffer(icons[id], 'base64');
        await promises.writeFile("./public/icons/" + id + ".png", bitmap);
    }
}

async function fetch_assets() {
    console.log("assets_minimal: ", assets_minimal)
    const res =  await fetch(assets_minimal);
    const text = await res.text();
    await promises.writeFile("./public/assets.minimal.json", text);

}

fetch_icons()
fetch_assets()