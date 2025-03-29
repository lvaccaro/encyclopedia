'use client'
//import { unstable_cache } from 'next/cache'; // Ensure you have this import
import { Wollet } from 'lwk_wasm';
import {createWallet, loadPersisted, fullScanAndApply} from './lwk';

export const policyAsset = '6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d';

const DESCRIPTOR = "descriptor"


export function getDescriptor(): string | null {
  return localStorage.getItem(DESCRIPTOR);
}
export function setDescriptor(descriptor: string) {
  localStorage.setItem(DESCRIPTOR, descriptor);
}
export function existDescriptor(): boolean {
  return getDescriptor() !== null && getDescriptor() !== undefined && getDescriptor() !== "";
}
export function removeDescriptor() {
  localStorage.removeItem(DESCRIPTOR);
}

 
export async function getWallet(): Promise<Wollet| undefined> {
  if (!existDescriptor()) {
    return undefined
  }
  const descriptor = getDescriptor()!;
  const wolletLocal = await createWallet(descriptor);
  await loadPersisted(wolletLocal);
  return wolletLocal;
}

export async function getBalances(): Promise<Map<string,number>> {
  const wolletLocal = await getWallet();
  if (wolletLocal === null || wolletLocal === undefined) {
    return new Map();
  }
  const balance = await wolletLocal.balance()
  for (const b of balance.entries()) {
    console.log("asset: ", b[0], ", value: ", b[1]);
  }
  return balance;
};

export async function sync() {
  const wolletLocal = await getWallet();
  if (wolletLocal === null || wolletLocal === undefined) {
    return;
  }
  await loadPersisted(wolletLocal);
  await fullScanAndApply(wolletLocal);
}

export class EsploraAssetChainStats {
  issued_amount: number | undefined;
  burned_amount: number | undefined;
  peg_in_amount: number | undefined;
  peg_out_amount: number | undefined;
}
export class EsploraAsset {
  asset_id!: string
  chain_stats: EsploraAssetChainStats | undefined;
  precision: number | undefined;
  name: string | undefined;
  ticker: string | undefined;
}

export async function fetchEsploraAsset(asset: string): Promise<EsploraAsset> {
  const url = "https://blockstream.info/liquid/api/asset/" + asset;
  const response = await fetch(url);
  return await response.json();
}