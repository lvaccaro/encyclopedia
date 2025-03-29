'use client'
/*import {useRef} from "react"
import * as esbuild from "esbuild-wasm"

const ref=useRef()
ref.current=await esbuild.startService({
    worker:true,
    // we are pointing to the public directory
    wasmURL:"https://unpkg.com/esbuild-wasm@0.8.42/esbuild.wasm"});
 
import { loadAsync } from '@algoasaurujs/wasm-loader'; 

async function main() { 
    const wasmModule = await loadAsync({ filename: 'https://liquidwebwallet.org/5b1f617d2ccd6eb1688c.module.wasm' }); 
    // use wasmModule.exports to call functions in your module 
  }
  
  main();
*/
import {Network, Wollet, WolletDescriptor, EsploraClient, Update} from 'lwk_wasm';
// ct(slip77(d32b6708e2860346bb8c8596c20e8b9f0dd55e97a13ed29f4b287a4fd0cf22d4),elwpkh([592c3c28/84h/1776h/0h]xpub6CxDvyb6KgStRcvPhCKjQ4wa5A7uQ8pEjZociAATn6vpPafttjoj1WAgDMNaHHxNCP1uXCSA9CCoWWE4WwBnsGzrmqrbE1jHfwYCXRRYqUA/<0;1>/*))#yt2z30r8
// ct(slip77(a8f5c7be6fbf3eaccf80f907c20e677b3e33223b4f86699991522fbcb0a0381d),elsh(wpkh([9869f387/49'/1776'/0']xpub6BemYiVNp19a1FtHjoMnJ9FE8VkSPQpFRMs6NjqbJi7zybqBCyXwGnZv97vqxK2YmduqFF4jJCPhvxFAKpCKFGKvDxz4h65no6jzDBJjVWZ/0/*)))#6vuxatvy
// ct(slip77(a8f5c7be6fbf3eaccf80f907c20e677b3e33223b4f86699991522fbcb0a0381d),elsh(wpkh([9869f387/49'/1776'/0']xpub6BemYiVNp19a1FtHjoMnJ9FE8VkSPQpFRMs6NjqbJi7zybqBCyXwGnZv97vqxK2YmduqFF4jJCPhvxFAKpCKFGKvDxz4h65no6jzDBJjVWZ/1/*)))#22khdmea

const network = Network.mainnet();

export async function createWallet(descr: string): Promise<Wollet> {
  const descriptor = new WolletDescriptor(descr);
  const wollet = new Wollet(network, descriptor);
  return wollet;
}
  /*
  function esploraClient() {
    var client = network.defaultEsploraClient();
    return client;
  };
  */
export async function esploraClient(): Promise<EsploraClient> {
    const mainnetUrl = "https://waterfalls.liquidwebwallet.org/liquid/api"
    const testnetUrl = "https://waterfalls.liquidwebwallet.org/liquidtestnet/api"
    const url = network.isMainnet() ? mainnetUrl : testnetUrl
    const client = new EsploraClient(network, url, true)
    client.set_waterfalls_server_recipient("age1xxzrgrfjm3yrwh3u6a7exgrldked0pdauvr3mx870wl6xzrwm5ps8s2h0p");
    return client
}
  
export async function loadPersisted(wolletLocal: Wollet) {
    const descriptor = wolletLocal.descriptor()
    var loaded = false
    var precStatus
    while (true) {
        const walletStatus = wolletLocal.status()
        const retrievedUpdate = localStorage.getItem(walletStatus.toString())
        if (retrievedUpdate) {
            if (precStatus === walletStatus) {
                // FIXME this prevents infinite loop in case the applied update doesn't change anything
                return loaded
            }
            console.log("Found persisted update, applying " + walletStatus)
            const update = Update.deserializeDecryptedBase64(retrievedUpdate, descriptor)
            wolletLocal.applyUpdate(update)
            loaded = true
            precStatus = walletStatus
        } else {
            return loaded
        }
    }
  }
  export async function fullScanAndApply(wolletLocal: Wollet) {
    let client = await esploraClient();
    let update = await client.fullScan(wolletLocal);
    const walletStatus = wolletLocal.status()
    if (update == undefined) {
        return
    }
    wolletLocal.applyUpdate(update)
                  if (update.onlyTip()) {
                      // this is a shortcut, the restored from persisted state UI won't see "updated at <most recent scan>" but "updated at <most recent scan with tx>".
                      // The latter is possible by deleting the previous update if both this and the previous are `onlyTip()` but the
                      // more complex logic is avoided for now
                      console.log("avoid persisting only tip update")
                  } else {
                      console.log("Saving persisted update " + walletStatus)
                      update.prune(wolletLocal)
                      const base64 = update.serializeEncryptedBase64(wolletLocal.descriptor())
  
                      try {
                          localStorage.setItem(walletStatus.toString(), base64)
                      } catch {
                          console.log("Saving persisted update " + walletStatus + " failed, too big")
                      }
                  }
  }
  