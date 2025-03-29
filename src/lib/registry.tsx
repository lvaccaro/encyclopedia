'use client'

import assets from '../assets/liquid_assets.minimal.json';
import icons from '../assets/liquid_icons.json';
import metadatas from '../assets/liquid_metadatas.json';

export const policyAsset = '6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d';

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
    //const allAssets: Map<string,(string|number|null)[]> = assets as unknown as Map<string,(string|number|null)[]>;
    //const allIcons: Map<string,(string|null)> = icons as unknown as Map<string,(string|null)>;
    //const allMetadatas: Map<string,(Metadata|null)> = metadatas as unknown as Map<string,(Metadata|null)>;
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
        }for (const i of Object.entries(icons)) {
            if (i[0] == a[0]) {
                asset.icon = i[1] as string
            }
        }
        list.push(asset)
    }
    //for (const a of Object.entries(allIcons)) {
    //    asset.icon = allIcons.get(a[0]) as string || undefined 
    //    asset.metadata = allMetadatas.get(a[0]) as Metadata || undefined 
    //}
    return list;
  }
