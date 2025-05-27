'use client'

export const policyAsset = '6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d';
export const tether = 'ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2';

export class Asset {
  id!: string;
  domain: string | undefined;
  ticker: string | undefined;
  name: string | undefined;
  precision: number | undefined;
  icon: string | undefined;
}
export class Issuance {
  block!: number;
  datetime!: number
  asset!: string;
  amount!: number;
  txid!: string;
  txindex!: number;
  token?: string;
  tokenamount?: number;
}
export async function fetchAssets(): Promise<Map<string, Asset>> {
  const res = await fetch("/assets/assets.minimal.json")
  const json = await res.json();
  const assets: Map<string,(string|number|null)[]> = json as unknown as Map<string,(string|number|null)[]>;
  const list = new Map<string, Asset>();
  for (const a of Object.entries(assets)) {
    const asset = new Asset();
    const id = a[0] as string;
    asset.id = id
    asset.domain = a[1][0] as string || undefined
    asset.ticker = id == policyAsset ? 'LBTC' : a[1][1] as string || undefined
    asset.name = a[1][2] as string || undefined
    asset.precision = a[1][3] as number || undefined
    list.set(id, asset)
  }
  return list;
}

export async function fetchPriorityAssets(): Promise<string[]> {
  return await (await fetch('/assets/priority_assets.json')).json();
}

export async function fetchIssuancesFor(asset: string): Promise<Issuance[]> {
  const res = await fetch(`/issuances/${asset}.json`);
  if (!res.ok) {
    throw new Error(`Failed to fetch issuances for asset ${asset}: ${res.statusText}`);
  }
  const json = await res.json();
  const issuances: (string|number|null)[] = json as unknown as (string|number|null)[];
  const list: Issuance[] = [];
  for (const issuance of issuances) {
    if (Array.isArray(issuance)) {
      list.push({
        block: issuance[0] as number,
        datetime: issuance[1] as number,
        asset: issuance[2] as string,
        amount: issuance[3] as number,
        txid: issuance[4] as string,
        txindex: issuance[5] as number,
        token: issuance[6] as string || undefined,
        tokenamount: issuance[7] as number || undefined
      });
    }
  }
  return list;
}