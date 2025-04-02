'use client'

export const policyAsset = '6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d';
export const tether = 'ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2';

export class Metadata {
    stablecoin: boolean = false;
    weight: number = 0;
}
export class Asset {
    id!: string;
    domain: string | undefined;
    ticker: string | undefined;
    name: string | undefined;
    precision: number | undefined;
    icon: string | undefined;
    metadata: Metadata | undefined;
}

export async function fetchAssets(): Promise<Asset[]> {
    const res = await fetch("./assets/assets.minimal.json")
    const text = await res.json();
    const res_metadata = await fetch("./assets/assets_metadatas.json")
    const metadatas: Map<string,(Metadata|null)> = await res_metadata.json() as Map<string,(Metadata|null)>;
    const assets: Map<string,(string|number|null)[]> = text as unknown as Map<string,(string|number|null)[]>;
    const list: Asset[] = [];
    for (const a of Object.entries(assets)) {
        const asset = new Asset();
        asset.id = a[0]
        asset.domain = a[1][0] as string || undefined
        asset.ticker = a[1][1] as string || undefined
        asset.name = a[1][2] as string || undefined
        asset.precision = a[1][3] as number || undefined
        for (const m of Object.entries(metadatas)) {
            if (m[0] == a[0]) {
                asset.metadata = m[1] as Metadata
            }
        }
        list.push(asset)
    }
    return list;
  }
