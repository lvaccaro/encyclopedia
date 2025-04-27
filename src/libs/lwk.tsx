'use client'

import * as lwk from "lwk_wasm"
// ct(slip77(d32b6708e2860346bb8c8596c20e8b9f0dd55e97a13ed29f4b287a4fd0cf22d4),elwpkh([592c3c28/84h/1776h/0h]xpub6CxDvyb6KgStRcvPhCKjQ4wa5A7uQ8pEjZociAATn6vpPafttjoj1WAgDMNaHHxNCP1uXCSA9CCoWWE4WwBnsGzrmqrbE1jHfwYCXRRYqUA/<0;1>/*))#yt2z30r8
// ct(slip77(a8f5c7be6fbf3eaccf80f907c20e677b3e33223b4f86699991522fbcb0a0381d),elsh(wpkh([9869f387/49'/1776'/0']xpub6BemYiVNp19a1FtHjoMnJ9FE8VkSPQpFRMs6NjqbJi7zybqBCyXwGnZv97vqxK2YmduqFF4jJCPhvxFAKpCKFGKvDxz4h65no6jzDBJjVWZ/0/*)))#6vuxatvy
// ct(slip77(a8f5c7be6fbf3eaccf80f907c20e677b3e33223b4f86699991522fbcb0a0381d),elsh(wpkh([9869f387/49'/1776'/0']xpub6BemYiVNp19a1FtHjoMnJ9FE8VkSPQpFRMs6NjqbJi7zybqBCyXwGnZv97vqxK2YmduqFF4jJCPhvxFAKpCKFGKvDxz4h65no6jzDBJjVWZ/1/*)))#22khdmea

const network = lwk.Network.mainnet();

export async function esploraClient(): Promise<lwk.EsploraClient> {
  const mainnetUrl = "https://waterfalls.liquidwebwallet.org/liquid/api"
  const testnetUrl = "https://waterfalls.liquidwebwallet.org/liquidtestnet/api"
  const url = network.isMainnet() ? mainnetUrl : testnetUrl
  const client = new lwk.EsploraClient(network, url, true)
  client.set_waterfalls_server_recipient("age1xxzrgrfjm3yrwh3u6a7exgrldked0pdauvr3mx870wl6xzrwm5ps8s2h0p");
  return client
}
  
export async function loadPersisted(wolletLocal: lwk.Wollet) {
  const descriptor = wolletLocal.descriptor()
  let loaded = false
  let precStatus
  while (true) {
    const walletStatus = wolletLocal.status()
    const retrievedUpdate = localStorage.getItem(walletStatus.toString())
    if (retrievedUpdate) {
      if (precStatus === walletStatus) {
        // FIXME this prevents infinite loop in case the applied update doesn't change anything
        return loaded
      }
      console.log("Found persisted update, applying " + walletStatus)
      const update = lwk.Update.deserializeDecryptedBase64(retrievedUpdate, descriptor)
      wolletLocal.applyUpdate(update)
      loaded = true
      precStatus = walletStatus
    } else {
      return loaded
    }
  }
}
export async function newAddress(wolletLocal: lwk.Wollet): Promise<string> {
  return await wolletLocal.address().address.toString()
}
export async function fullScanAndApply(wolletLocal: lwk.Wollet) {
  const client = await esploraClient();
  const update = await client.fullScan(wolletLocal);
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


export async function jadeStandardDerivations(jade: lwk.Jade): Promise<Map<string, string>> {
  // these are cached also on the Jade, but caching here allow to get rid of the async in keyoriginXpubUnified
  const derivations = new Map<string, string>()
  const bips = [lwk.Bip.bip49(), lwk.Bip.bip84(), lwk.Bip.bip87()];
  for (let i = 0; i < 3; i++) {
    try {
      const xpub = await jade.keyoriginXpub(bips[i]);
      if ((bips[0] as any).__wbg_ptr != 0) {
        derivations.set(bips[i].toString(), xpub);
      }
    } catch(err) {
      console.error("Error jade.keyoriginXpub:", err)
    } 
  }
  return derivations
}
