import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigation } from 'react-router-dom';
import RiveComponent from '@rive-app/react-canvas';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import moment from 'moment';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Button from '@mui/material/Button';
import millify from "millify";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Typography,
  Box,
} from '@mui/material';

import { fetchAssets, policyAsset, Asset, tether } from '../libs/registry';
import { loadStokrAssets, StokrAsset } from '../libs/stokr';
import { loadBitfinexSecurities, loadBitfinexTickers, BitfinexTicker } from '../libs/bitfinex';
import { EsploraAsset, loadEsploraAssetTxs, loadEsploraAssets } from '../libs/esplora';
import { Wallet } from '../libs/wallet';
import { fetchSideswapAssets, fetchSideswapMarkets, fetchSideswapMarket, fetchSideswapSubscribePrice, Quote as SideswapQuote, Market as SideswapMarket, Asset as SideswapAsset, Price as SideswapPrice,} from '../libs/sideswap';

enum Screen {
  Home="Home",
  Wallet="Wallet",
  Jade="Jade"
}

class TimeValue {
  value!: number;
  time!: number;
  constructor (time: number, value: number) {
    this.time = time
    this.value = value
  }
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#22e1c9',
      // light: will be calculated from palette.primary.main,
      // dark: will be calculated from palette.primary.main,
      contrastText: '#FFFFFF'
    },
    secondary: {
      main: '#FFFFFF',
      light: '#F5EBFF',
      dark: '#F5EBFF',
      contrastText: '#FFFFFF',
    },
  },
});
function Details() {

  const [assets, setAssets] = useState(new Map<string, Asset>());
  const [sideswapAsset, setSideswapAsset] = useState<SideswapAsset>();
  const [sideswapMarkets, setSideswapMarkets] = useState<SideswapMarket[]>([]);
  const [sideswapQuotes, setSideswapQuotes] = useState<SideswapQuote[]>([]);
  const [sideswapPrices, setSideswapPrices] = useState<SideswapPrice[]>([]);
  const [stokrAssets, setStokrAssets] = useState<StokrAsset[]>([]);
  const [esploraAssets, setEsploraAssets] = useState(new Map<string, EsploraAsset>());
  const [progress, setProgress] = useState(false);
  const [addressText, setAddressText] = useState("");
  const [addressQrcode, setAddressQrcode] = useState("");
  const [balances, setBalances] = useState(new Map<string, number>());

  const [tlvCap, setTlvCap] = useState<TimeValue[]>([]);
  const [tlvPrice, setTlvPrice] = useState<TimeValue[]>([]);

  // bitfinex
  const [bitfinexsSecurities, setBitfinexSecurities] = useState<string[]>([]);
  const [bitfinexTickers, setBitfinexTickers] = useState<BitfinexTicker[]>([]);
  
  //  App Bar
  const {height, width } = useWindowDimensions();
  const [heightBar, setHeightBar ] = useState<number>(0);

  const assetId = useLocation().pathname.split('/')[2];
  console.log("assetId", assetId);


  // Updates UI State in a safe way
  
  function updateEsploraAssets(updates: Map<string, EsploraAsset>) {
    setEsploraAssets(resultMap => {
      const copy = new Map<string, EsploraAsset>();
      for (const [id, asset] of Array.from(resultMap.entries())) {
        copy.set(id, asset);
      }
      for (const [id, asset] of Array.from(updates.entries())) {
        copy.set(id, asset);
      }
      return copy
    });
  }
  
  function updateBalances(updates: Map<string, number>) {
    setBalances(resultMap => {
      const copy = new Map<string, number>();
      for (const [id, asset] of Array.from(resultMap.entries())) {
        copy.set(id, asset);
      }
      for (const [id, asset] of Array.from(updates.entries())) {
        copy.set(id, asset);
      }
      return copy
    });
  }
  
  function updateSideswapPrices(price: SideswapPrice) {
    setSideswapPrices(resultList => {
      const copy = [...resultList]
      const index = copy.findIndex((t) => t.asset_pair.base == price.asset_pair.base && t.asset_pair.quote == price.asset_pair.quote);
      if (index != -1) {
        copy[index] = price;
      } else {
        copy.push(price);
      }
      return copy
    });
  }
  function updateBitfinexTickers(tickers: BitfinexTicker[]) {
    setBitfinexTickers(resultList => {
      const copy = [...resultList]
      for (const ticker of tickers) {
        const index = copy.findIndex((t) => t.pair == ticker.pair);
        if (index != -1) {
          copy[index] = ticker;
        } else {
          copy.push(ticker);
        }
      }
      return copy
    });
  }
  function updateStokrAssets(assets: StokrAsset[]) {
    setStokrAssets(resultList => {
      const copy = [...resultList]
      for (const asset of assets) {
        const index = copy.findIndex((a) => a._id == asset._id);
        if (index != -1) {
          copy[index] = asset;
        } else {
          copy.push(asset);
        }
      }
      return copy
    });
  }

  // Loading functions
  async function login(wallet: Wallet) {
    setProgress(true)
    await wallet.sync();
    const totals = await wallet.getBalances();
    for (const [id, value] of Array.from(totals.entries())) {
      console.log("asset: ", id, ", value: ", value);
      const x = Number(value.toString());
      const y = x/(10**(assets.get(id)?.precision || 8));
      balances.set(id, y);
    }
    updateBalances(balances);
    const address = await wallet.newAddress();
    setAddressText(address.toString());
    setAddressQrcode(address.QRCodeUri());
    setProgress(false);
  }
  async function loadAssets() {
    const data = await fetchAssets();
    setAssets(data);
    const esploraPolicyAssets = await loadEsploraAssets([assetId, policyAsset]);
    updateEsploraAssets(esploraPolicyAssets);
  }
  async function loadStokr() {
    const data = await loadStokrAssets();
    updateStokrAssets(data);
  }

  async function loadBitfinex() {
    const securities = await loadBitfinexSecurities();
    console.log("bitfinex securities", securities);
    setBitfinexSecurities([...securities]);
    const tickers = await loadBitfinexTickers();
    console.log("bitfinex tickers", tickers);
    const asset = assets.get(assetId);
    updateBitfinexTickers(
      tickers
        .filter((t) => [t.base, t.quote].includes(asset?.ticker ?? ""))
    );
  }

  async function loadTlv() {
    const txs = await loadEsploraAssetTxs(assetId);
    console.log("tlv txs ",txs);
    var marketcap = 0;
    var tlv: TimeValue[] = [];
    for (const tx of txs.reverse()) {
      for (const vin of tx.vin) {
        if (vin.issuance && vin.issuance.asset_id == assetId) {
          marketcap += vin.issuance.assetamount
        }
      }
      for (const vout of tx.vout) {
        console.log("tlv vout",vout);
        if (vout && vout.scriptpubkey_type == "op_return") {
          console.log("tlv op_return",vout.value ?? 0);
          marketcap -= vout.value ?? 0
        }
      }
      tlv.push(new TimeValue(tx.status.block_time, marketcap))
    }
    console.log("tlv data",tlv);
    setTlvCap([...tlv]);
  }
  async function loadSideswap() {
    const asset = await fetchSideswapAssets();
    setSideswapAsset(asset.filter((asset) => asset.asset_id == assetId)[0]);
    console.log("sideswap asset", asset);
    const markets: SideswapMarket[] = await fetchSideswapMarkets();
    const filteredMarkets = markets.filter((m) => m.asset_pair.base == assetId || m.asset_pair.quote == assetId);
    setSideswapMarkets([...filteredMarkets]);
    console.log("sideswap markets", filteredMarkets);

    var assetTetherMarket = filteredMarkets.filter(m => m.asset_pair.base == tether || m.asset_pair.quote == tether)[0];
    var assetLbtcMarket = filteredMarkets.filter(m => m.asset_pair.base == policyAsset || m.asset_pair.quote == policyAsset)[0];
    if (assetTetherMarket) {
      const quotes: SideswapQuote[] = await fetchSideswapMarket(assetTetherMarket.asset_pair.base, assetTetherMarket.asset_pair.quote);
      setSideswapQuotes([...quotes]);
      console.log("sideswap quotes", quotes);
      const tlv = quotes.map(q => new TimeValue(moment(q.time).unix(), q.close));
      setTlvPrice([...tlv]);
      console.log("setTlvPrice", tlv);
    } else if (assetLbtcMarket) {
      const tetherQuotes: SideswapQuote[] = await fetchSideswapMarket(policyAsset, tether);
      const assetQuotes: SideswapQuote[] = await fetchSideswapMarket(assetLbtcMarket.asset_pair.base, assetLbtcMarket.asset_pair.quote);
      for (const i in assetQuotes) {
        const tether = tetherQuotes.filter(t => t.time == assetQuotes[i].time)[0];
        const direction = assetLbtcMarket.asset_pair.base == assetId ? 1 : 0;
        assetQuotes[i].close = assetQuotes[i].close * (direction ? tether.close : 1/tether.close);
      }
      setSideswapQuotes([...assetQuotes]);
      console.log("sideswap quotes", assetQuotes);
      const tlv = assetQuotes.map(q => new TimeValue(moment(q.time).unix(), q.close));
      setTlvPrice([...tlv]);
      console.log("setTlvPrice", tlv);
    }
    for (const market of sideswapMarkets) {
      const delegate = (price: SideswapPrice) => {
        if (price.asset_pair.base != assetId && price.asset_pair.quote != assetId) {
          return;
        }
        updateSideswapPrices(price);
        console.log("sideswap price", sideswapPrices);
      }
      fetchSideswapSubscribePrice(market.asset_pair.base, market.asset_pair.quote,delegate);
      const esploraAssets = await loadEsploraAssets([market.asset_pair.base, market.asset_pair.quote]);
      updateEsploraAssets(esploraAssets);
    }
  };

  const circulatingAmount = (esploraAsset: EsploraAsset, assetId: string) => {
    if (esploraAsset.chain_stats?.has_blinded_issuances == true) {
      return undefined;
    }
    if (assetId === policyAsset) {
      const amount = (esploraAsset.chain_stats?.peg_in_amount || 0) - (esploraAsset.chain_stats?.peg_out_amount || 0);
      return amount / (10**(8));
    } else {
      const amount = (esploraAsset.chain_stats?.issued_amount || 0) - (esploraAsset.chain_stats?.burned_amount || 0);
      return amount / (10**(esploraAsset.precision || 0));
    }
  };


  const minify = (value: any, params: any) => {
    if (value == undefined || value == '' || value == '-') {
      return "";
    }
    return millify(value, params);
  };
    // Rendering effects

  useEffect(() => {
    loadAssets();
  }, []);
  useEffect(() => {
    loadTlv();
  }, [assets]);
  useEffect(() => {
    loadStokr();
  }, [assets]);
  useEffect(() => {
    loadSideswap();
  }, [assets]);
  useEffect(() => {
    loadBitfinex();
  }, [assets]);
  useEffect(() => {
    if (Wallet.exist()) {
      const wallet = Wallet.read();
      if (wallet != undefined) {
        login(wallet);
      }
    }
  }, [assets]);

  // window dimension functions
  function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  }
  function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
    useEffect(() => {
      function handleResize() {
        //console.log("getWindowDimensions", getWindowDimensions());
        setWindowDimensions(getWindowDimensions());
      }
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    return windowDimensions;
  }//textfield customization

  useEffect(() => {
    const header = document.getElementById("header");
    //console.log("header", header?.getBoundingClientRect().height);
    setHeightBar(header?.getBoundingClientRect().height || 0);
  });

  const stokrAsset = (): StokrAsset | null => {
    return stokrAssets.filter((asset) => asset.secondaryAssetId == assetId)[0];
  }
  return (
    <main>
      <ThemeProvider theme={theme}>
        <Container id="header" className="Hero_hero__FVN0h" style={{ width:'100%', padding: 0, margin: 0, }}>
          <div className="Hero_topWave__MRnRR rive" style={{ width: (width>1037 ? width : heightBar * 2.07), height: (width<1037 ? heightBar : width / 2.07), minHeight: heightBar, top:(width<1037 ? '-4px' : -width/2.07+heightBar), borderBottomStyle: 'solid', left: '-2px', position: 'absolute'}}>
            <RiveComponent src="https://public.rive.app/hosted/113763/180277/uc54S_-h2UCFWpOo-aEkyg.riv" />
          </div>

          <Box className="Navigation_navbar__3GOR8">
            <a href="/">
              <img width={58} height={58} className="mantine-1trwvlz mantine-Avatar-image" src="/media/logo.28b5ba97.svg" alt=""/>
            </a>
            <div className="__className_a99301 font-bold">
              <ul className="Navigation_navbar_links__vNpTF">
              
                {[Screen.Home, Screen.Wallet, Screen.Jade].map((sc) => { 
                  return (
                    <li key={sc} className="">
                      <Link to={'/'}>
                        {sc}
                      </Link>
                    </li>
                  )}
                )}
              </ul>
            </div>
          </Box>

          <Container className="Hero_heroContent__QJ4iM">
            <Box className="Hero_heroLeftCol__5MwIz">
              <h1 className="__className_a99301 font-h1 font-semibold mb-4">{assets.get(assetId)?.name}</h1>
              <ul>
                <li className="font-p4 font-semibold"><a href={'https://blockstream.info/liquid/asset/'+assetId}>{assetId.substring(0,32)}<br/>{assetId.substring(32,64)}</a></li>
                {assets.get(assetId)?.domain && <li className="font-p4 font-semibold"><a href={'https://'+assets.get(assetId)?.domain}>Domain: {assets.get(assetId)?.domain}</a></li>}
                <li className="font-p4 font-semibold"> Circulating {esploraAssets.get(assetId) ? (esploraAssets.get(assetId)?.chain_stats?.has_blinded_issuances ? "Confidential" : circulatingAmount(esploraAssets.get(assetId)!, assetId)) : "-----"} {assets.get(assetId)?.ticker}</li>
                <li className="font-p4 font-semibold"> Supported by
                  { bitfinexsSecurities.includes(assets.get(assetId)?.ticker ?? "") && <img src="/media/securities.png" height={20} style={{marginLeft:'10px'}}/>}
                  { sideswapAsset && <img src="/media/sideswap.png" height={20} style={{marginLeft:'10px'}}/>}
                  { stokrAssets.filter((a) => a.secondaryAssetId == assetId)[0] && <img src="/media/stokr.ico" height={20} style={{marginLeft:'10px'}}/>}
                </li>
              </ul>
              <br/>
            </Box>
            <Box className="Hero_heroRightCol__vgiub">
              <img alt="hero image" decoding="async" data-nimg="fill" style={{position: 'absolute', height: '100%', width: '100%', inset: '0px', objectFit: 'contain', color: 'transparent'}} src={'/icons/'+assetId+'.png'}/>
            </Box>
          </Container>
        </Container>

        {balances.get(assetId) != null && (
          <Container maxWidth="md">
            <div className='RowCard_rowCard__u8FAF'>
              <div className="RowCard_cardImage__fUn_7">
                <img alt="icon" loading="lazy" width="250" height="222" decoding="async" data-nimg="1" style={{imageRendering: 'pixelated', border: '20px solid white'}} src={addressQrcode}/>
              </div>
              <div className="RowCard_content__wStUV">
                <div className="RowCard_footerContent__5FLf_">
                  <img src='https://storage.googleapis.com/bs-liquid-net-strapi/Group_513845_5554db1920/Group_513845_5554db1920.png' height={30}/>
                  <h3 className="__className_a99301 font-h3 font-regular mb-2">{balances.get(assetId)?.toFixed(assets.get(assetId)?.precision ?? 0)} {assets.get(assetId)?.ticker}</h3>
                </div>
                <br/>
                {addressText.split(/(.{16})/).filter(O=>O).map((chunk, index) => (
                  <p key={index} className="__className_a99301 font-h6 font-regular mb-1">{chunk.split(/(.{4})/).filter(O=>O).join(' ')}</p>
                ))}
                <br/>
              </div>
            </div>
          </Container>
        )}
        {stokrAsset() != null && (
          <Container maxWidth="md">
            <div className="RowCard_content__wStUV">
              <div className="RowCard_footerContent__5FLf_">
                <img src='/media/stokr.png' height={30}/>
                <h3 className="__className_a99301 font-h3 font-regular mb-2">Stokr</h3>
              </div>
              <br/>
              <p className="__className_1e0c0b font-p3 font-light">{stokrAsset()?.description}</p>
              <br/>
              <p className="__className_a99301 font-h6 font-regular mb-1">Category: {stokrAsset()?.category}</p>
              <p className="__className_a99301 font-h6 font-regular mb-1">Capital Raised: {minify(stokrAsset()?.totalSold ?? 0,{})} $</p>
              <p className="__className_a99301 font-h6 font-regular mb-1">Total Amount: {stokrAsset()?.totalTokenAmount} {stokrAsset()?.tokenSymbol}</p>
              <br/>
              <Button><a target="_blank" href="https://stokr.io/featured-assets">Go to Stokr</a></Button>
            </div>
          </Container>
        )}
        {bitfinexsSecurities.includes(assets.get(assetId)?.ticker ?? "") && (
          <Container maxWidth="md">
            <div className="RowCard_content__wStUV">
              <div className="RowCard_footerContent__5FLf_">
                <img src='/media/bitfinex.png' height={30} style={{ background: 'rgb(12 28 41)', padding: '5px 10px 5px 10px'}}/>
                <h3 className="__className_a99301 font-h3 font-regular mb-2">Bitfinex</h3>
              </div>
              <br/>
              <p className="__className_1e0c0b font-p3 font-light"></p>
              <br/>
              <TableContainer component={Paper} sx={{ width:'100%' }}>
                <Table sx={{ width:'100%' }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell align="right" padding='none'><Typography color="textSecondary" variant="overline">Price</Typography></TableCell>
                    </TableRow>
                  </TableHead>
                    
                  <TableBody>

                    {bitfinexTickers.map((ticker) => { 
                      const base = assets.get(ticker.base);
                      const quote = assets.get(ticker.quote);
                      console.log("bitfinex price", ticker , base, quote);
                      return (
                        <TableRow
                          key={base?.id +'/'+ quote?.id}
                          sx={{ '&:last-child td': { border: 0 } , '&:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            <Box>
                              <Typography variant="h6">{ticker.pair}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box>
                              <Typography variant="h5">
                                {ticker.price.toFixed(assets.get(ticker.quote)?.precision ?? 8)}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )
                    })
                    }
                  </TableBody>
                </Table>
              </TableContainer>
              <br/>
              <Button><a target="_blank" href="https://www.bitfinex.com/securities/">Go to Bitfinex Securities</a></Button>
            </div>
          </Container>
        )}
  
        {sideswapAsset && 
          <Container maxWidth="md">
            <div className="RowCard_content__wStUV">
              <div className="RowCard_footerContent__5FLf_">
                <img src='https://sideswap.io/resource/img/logo.svg'/>
                <h3 className="__className_a99301 font-h3 font-regular mb-2">Sideswap</h3>
              </div>
              <br/>
              <p className="__className_a99301 font-h6 font-regular mb-1">Market type: {sideswapAsset.market_type}</p>
              <TableContainer>
                <Table sx={{ width:'100%' }} aria-label="simple table">
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell align="right" padding='none'><Typography color="textSecondary" variant="overline">Price</Typography></TableCell>
                    </TableRow>
                  </TableHead>
        
                  <TableBody>

                    {sideswapPrices.map((price) => { 
                      const base = assets.get(price.asset_pair.base);
                      const quote = assets.get(price.asset_pair.quote);
                      console.log("sideswap price", price , base, quote);
                      return (
                        <TableRow
                          key={base?.id +'/'+ quote?.id}
                          sx={{ '&:last-child td': { border: 0 } , '&:last-child th': { border: 0 } }}
                        >
                          <TableCell component="th" scope="row">
                            <Box>
                              <Typography variant="h6">{base?.ticker} / {quote?.ticker}</Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Box>
                              <Typography variant="h5">
                                {Number(price?.ind_price ?? price?.last_price ?? 0).toFixed(assets.get(price.asset_pair.quote)?.precision ?? 8)}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      )
                    })
                    }
                  </TableBody>
                </Table>
              </TableContainer>
              <br/>
              <Button><a target="_blank" href="https://sideswap.io/swap-market">Go to Sideswap Market</a></Button>
            </div>
          </Container>
        }

        <div className="darkBg text-white pt-4 pb-6">
          <section className="page_chartSection__sELnz">
            <h2 className="__className_a99301 font-h2 font-regular mb-4 text-center">Timeline</h2>
            <div className="Chart_chartRow__ekIHV container mb-3">
              <div className="Chart_chartArea___5quf col-2">
                <h4 className="font-h4 font-regular __className_a99301">Circulating in {assets.get(assetId)?.ticker}</h4>
                <div style={{width: '100%', height: '315px', minWidth: '0px'}}>
                  <ResponsiveContainer>
                          <AreaChart
                            data={tlvCap}
                            margin={{
                              top: 10,
                              right: 30,
                              left: 0,
                              bottom: 0,
                            }}
                          >
                            <XAxis
                              dataKey = 'time'
                              domain = {['auto', 'auto']}
                              name = 'Time'
                              tickFormatter = {(unixTime) => moment(unixTime*1000).format('YYYY-MM-DD')}
                              type = 'number'
                            />
                            <YAxis dataKey = 'value' name = 'Value' />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke-width="2.5" stroke="#22E1C9" fill-opacity="1" />
                          </AreaChart>
                        </ResponsiveContainer>
                </div>
              </div>
              <div className="Chart_chartArea___5quf col-2">
                <h4 className="font-h4 font-regular __className_a99301">Price {assets.get(assetId)?.ticker} in USDt</h4>
                <div style={{width: '100%', height: '315px', minWidth: '0px'}}>
                  <ResponsiveContainer>
                          <AreaChart
                            data={tlvPrice}
                            margin={{
                              top: 10,
                              right: 30,
                              left: 0,
                              bottom: 0,
                            }}
                          >
                          <XAxis
                            dataKey = 'time'
                            domain = {['auto', 'auto']}
                            name = 'Time'
                            tickFormatter = {(unixTime) => moment(unixTime*1000).format('YYYY-MM-DD')}
                            type = 'number'
                          />
                            <YAxis dataKey = 'value' name = 'Value' />
                            <Tooltip />
                            <Area type="monotone" dataKey="value" stroke-width="2.5" stroke="#22E1C9" fill-opacity="1" />
                          </AreaChart>
                        </ResponsiveContainer>
                </div>
              </div>
            </div>
          </section>
        </div>

      </ThemeProvider>
    </main>
  );
}


export default Details;
