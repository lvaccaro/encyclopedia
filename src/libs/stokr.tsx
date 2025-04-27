'use client'

export class StokrAsset {
  _id!: string;
  link?: string;
  description?: string;
  name?: string;
  category?: string;
  status?: string;
  openingTime?: string;
  tokenPrice?: string;
  tokenName?: string;
  tokenSymbol?: string;
  primaryAssetId?: string;
  secondaryAssetId?: string;
  totalSold?: number;
  totalTokenAmount?: number;
  token_issuance_type?: string;
};

const baseurl = 'https://stokr.io/api-gateway-no-auth/project/public/get';
export const stokr_file = '/assets/stokr.json';

export const fetchStokrAssets = async (remote: boolean): Promise<any> => {
  if (remote) {
    return await (await fetch(baseurl, { method: 'POST' })).json();
  } else {
    const res = await fetch(stokr_file)
    return await res.json();
  }
};

export const loadStokrAssets = async (): Promise<StokrAsset[]> => {
  const res = await fetchStokrAssets(false);
  const projects = res.projects as StokrAsset[];
  return projects.filter((p) => p.token_issuance_type === 'liquid');
};