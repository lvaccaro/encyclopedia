
export class EsploraAssetChainStats {
  issued_amount: number | undefined;
  burned_amount: number | undefined;
  peg_in_amount: number | undefined;
  peg_out_amount: number | undefined;
  has_blinded_issuances: boolean | undefined;
}
export class EsploraAsset {
  asset_id!: string
  chain_stats?: EsploraAssetChainStats;
  precision?: number;
  name?: string;
  ticker?: string;
}
export class EsploraAssetTxStatus {
  confirmed!: boolean
  block_height!: number
  block_hash!: string
  block_time!: number
}
export class EsploraAssetTxIssuance {
  asset_id!: string
  is_reissuance!: boolean
  assetamount!: number
}
export class EsploraAssetTxVin {
  txid!: string
  vout!: number
  scriptsig?: string
  is_coinbase?: boolean
  is_pegin?: boolean
  sequence?: number
  issuance?: EsploraAssetTxIssuance
}
export class EsploraAssetTxVout {
  scriptpubkey!: string
  scriptpubkey_type!: string
  scriptpubkey_address?: string
  value?: number
  asset?: string
}
export class EsploraAssetTx {
  txid!: string
  version!: number
  locktime!: number
  size!: number
  weight!: number
  fee!: number
  vin!: EsploraAssetTxVin[]
  vout!: EsploraAssetTxVout[]
  status!: EsploraAssetTxStatus

}

const base_url = "https://blockstream.info/liquid/api/asset/"

export const fetchEsploraAssets = async (remote: boolean, asset: string): Promise<any> => {
  if (remote) {
    return await (await fetch(`${base_url}/${asset}`)).json();
  } else {
    return await (await fetch("")).json();
  }
};

export const fetchEsploraAssetTxs = async (remote: boolean, asset: string): Promise<any> => {
  if (remote) {
    return await (await fetch(`${base_url}/${asset}/txs/chain`)).json();
  } else {
    return await (await fetch("")).json();
  }
};
export async function loadEsploraAsset(assetId: string): Promise<EsploraAsset> {
  if (localStorage.getItem(assetId) === null) {
    console.log("Cache miss for asset: ", assetId);
    const asset = await fetchEsploraAssets(true, assetId);
    if (asset !== null && asset !== undefined) {
      console.log("Fetch asset: ", asset);
      localStorage.setItem(assetId, JSON.stringify(asset));
      return asset as EsploraAsset;
    }
    console.log("Error fetching asset: ", assetId);
    return Promise.reject("Error fetching asset");
  } else {
    console.log("Cache hit for asset: ", JSON.parse(localStorage.getItem(assetId)!));
    return Promise.resolve(JSON.parse(localStorage.getItem(assetId)!));
  }
}
export async function loadEsploraAssets(assetIds: string[]): Promise<Map<string, EsploraAsset>> {
  const assets = new Map<string, EsploraAsset>();
  for (const assetId of assetIds) {
    const asset = await loadEsploraAsset(assetId);
    if (asset !== null && asset !== undefined) {
      assets.set(assetId, asset);
    }
  }
  return assets;
}
export async function loadEsploraAssetTxs(assetId: string): Promise<EsploraAssetTx[]> {
  if (localStorage.getItem(`txs-${assetId}`) === null) {
    console.log("Cache miss for asset: ", assetId);
    const asset = await fetchEsploraAssetTxs(true, assetId);
    if (asset !== null && asset !== undefined) {
      console.log("Fetch asset: ", asset);
      localStorage.setItem(`txs-${assetId}`, JSON.stringify(asset));
      return asset as EsploraAssetTx[];
    }
    console.log("Error fetching asset: ", assetId);
    return Promise.reject("Error fetching asset");
  } else {
    console.log("Cache hit for asset: ", JSON.parse(localStorage.getItem(`txs-${assetId}`)!));
    return Promise.resolve(JSON.parse(localStorage.getItem(`txs-${assetId}`)!));
  }
}