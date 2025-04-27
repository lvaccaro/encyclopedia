'use client'
import { loadPersisted, fullScanAndApply, jadeStandardDerivations } from './lwk';
import * as lwk from "lwk_wasm"

export const policyAsset = '6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d';

const DESCRIPTORS = "DESCRIPTORS_1234_";
const NETWORK = lwk.Network.mainnet()

export class Wallet {

  network = NETWORK
  // Device state
  jade?: lwk.Jade // lwk.Jade instance
  //ledger?: lwk.LedgerWeb, // lwk.LedgerWeb instance
  standardDerivations?: Map<string, string> // {String: String} mapping bip to xpub
  xpub?: lwk.Xpub // String - master xpub from Jade
  // Wallet state
  wollets?: lwk.Wollet[] // lwk.Wollet instance
  // Multisig state
  multiWallets?: string[] // Array of registered multisig wallet names
  // Signer state (testnet only)
  swSigner?: lwk.Signer // lwk.Signer instance
  descriptors?: lwk.WolletDescriptor[]

  public static read(): Wallet | undefined {
    const descriptorsText = localStorage.getItem(DESCRIPTORS);
    if (descriptorsText == undefined) {
      return undefined;
    }
    const descriptors: string[] = JSON.parse(descriptorsText);
    const wallet = new Wallet();
    wallet.setDescriptors(descriptors);
    return wallet
  }
  public async setDescriptors(descriptors: string[]) {
    console.log("setDescriptors", descriptors);
    this.descriptors = []
    this.wollets = []
    for (const descriptor of descriptors) {
      const desc = new lwk.WolletDescriptor(descriptor)
      this.descriptors?.push(desc);
      this.wollets?.push(new lwk.Wollet(NETWORK, desc));
    }
  }

  public async load() {
    for (const wollet of this.wollets ?? []) {
      await loadPersisted(wollet);
    }
  }
  public async sync() {
    for (const wollet of this.wollets ?? []) {
      await loadPersisted(wollet);
      await fullScanAndApply(wollet);
    }
  }
  public write() {
    const txt = JSON.stringify(this.descriptors?.map((d)=> d.toString()));
    localStorage.setItem(DESCRIPTORS, txt);
  }
  public static remove() {
    localStorage.removeItem(DESCRIPTORS);
  }
  public static exist(): boolean {
    return localStorage.getItem(DESCRIPTORS) != undefined
  }
  public async getBalances(): Promise<Map<string,bigint>> {
    const balances = new Map<string,bigint>();
    for (const wollet of this.wollets ?? []) {
      const balance = await wollet.balance();
      console.log("balance",balance);
      for (const b of balance.entries()) {
        console.log("asset: ", b[0], ", value: ", b[1]);
        balances.set(b[0], (balances.get(b[0]) ?? BigInt(0)) + b[1]);
      }
    }
    return balances;
  }

  public async newAddress(): Promise<lwk.Address> {
    // TODO: support multiple wollets
    return await this.wollets![0].address().address();
  }

  public static async connectJade(): Promise<Wallet | undefined> {
    const wallet = new Wallet();
    const jade = await new lwk.Jade(NETWORK, true)
    // Initialize jade and collect all related data
    wallet.xpub = await jade.getMasterXpub() // asking something that requires unlock
    wallet.multiWallets = await jade.getRegisteredMultisigs()
    wallet.standardDerivations = await jadeStandardDerivations(jade)
    const descriptors: lwk.WolletDescriptor[] = []
    descriptors.push(await jade.wpkh())
    descriptors.push(await jade.shWpkh())
    for (const multiName of wallet.multiWallets ?? []) {
      descriptors.push(await jade.multi(multiName))
    }
    wallet.descriptors = descriptors
    wallet.wollets = descriptors.map((d) => new lwk.Wollet(NETWORK, d))
    return wallet
  }
}