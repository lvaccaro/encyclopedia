import logo from './logo.svg';

import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useNavigation } from 'react-router-dom';
import { createTheme, ThemeProvider, createStyles } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import AppBar from '@mui/material/AppBar';
import SendIcon from '@mui/icons-material/Send';
import ButtonGroup from '@mui/material/ButtonGroup';
import millify from "millify";
//import Image from "next/image";
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
import { localSideswapAssets, localSideswapMarkets, Quote as SideswapQuote, Market as SideswapMarket, Asset as SideswapAsset, connectSideswap, subscribeSideswapPrice, Price as SideswapPrice, Price } from '../libs/sideswap';
import { fetchAssets, policyAsset, Asset, tether } from '../libs/registry';
import { loadStokrAssets, StokrAsset } from '../libs/stokr';
import { loadBitfinexSecurities, loadBitfinexTickers, BitfinexTicker } from '../libs/bitfinex';
import { EsploraAsset, loadEsploraAsset, loadEsploraAssets } from '../libs/esplora';
import { Wallet } from '../libs/wallet';
import RiveComponent from '@rive-app/react-canvas';
import { Console } from 'console';

enum Screen {
  Home="Home",
  Wallet="Wallet",
  Jade="Jade",
  Asset="Asset",
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
function Home() {

  const [assets, setAssets] = useState(new Map<string, Asset>());
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [sideswapAssets, setSideswapAssets] = useState<SideswapAsset[]>([]);
  const [sideswapMarkets, setSideswapMarkets] = useState<SideswapMarket[]>([]);
  const [sideswapQuotes, setSideswapQuotes] = useState<SideswapQuote[]>([]);
  const [sideswapPrices, setSideswapPrices] = useState<SideswapPrice[]>([]);
  const [esploraAssets, setEsploraAssets] = useState(new Map<string, EsploraAsset>());
  const [stokrAssets, setStokrAssets] = useState<StokrAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableAll, setTableAll] = useState(false);
  const [screen, setScreen] = useState<Screen>(Screen.Home);

  const [prices, setPrices] = useState(new Map<string, number>());
  const [tetherPrices, setTetherPrices] = useState(new Map<string, number>());
  const [directions, setDirections] = useState(new Map<string, boolean>());

  // bitfinex
  const [bitfinexsSecurities, setBitfinexSecurities] = useState<string[]>([]);
  const [bitfinexTickers, setBitfinexTickers] = useState<BitfinexTicker[]>([]);

  //  App Bar
  const [logged, setLogged] = useState(false);
  const [connected, setConnected] = useState(false);
  const [textDescriptor, setTextDescriptor] = useState("");
  const {height, width } = useWindowDimensions();
  const [heightBar, setHeightBar ] = useState<number>(0);

  // LWK
  const [wallet, setWallet] = useState<Wallet>();
  const [progress, setProgress] = useState(false);
  const [balances, setBalances] = useState(new Map<string, number>());
  const [jadeMessage, setJadeMessage] = useState("");


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

  function updatePrices(assetId: string, price: number) {
    setPrices(resultMap => {
      const copy = new Map<string, number>();
      for (const [id, asset] of Array.from(resultMap.entries())) {
        copy.set(id, asset);
      }
      copy.set(assetId, price);
      return copy
    });
  }
  function updateTetherPrices(assetId: string, price: number) {
    setTetherPrices(resultMap => {
      const copy = new Map<string, number>();
      for (const [id, asset] of Array.from(resultMap.entries())) {
        copy.set(id, asset);
      }
      copy.set(assetId, price);
      return copy
    });
  }
  function updateDirections(assetId: string, direction: boolean) {
    setDirections(resultMap => {
      const copy = new Map<string, boolean>();
      for (const [id, asset] of Array.from(resultMap.entries())) {
        copy.set(id, asset);
      }
      copy.set(assetId, direction);
      return copy;
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
  // Loading contents data

  async function loadBitfinex() {
    const securities = await loadBitfinexSecurities();
    console.log("bitfinex securities", securities);
    setBitfinexSecurities([...securities]);
    const tickers = await loadBitfinexTickers();
    console.log("bitfinex tickers", tickers);
    updateBitfinexTickers(tickers);
    for (const ticker of tickers) {
      const assetId = assets.values().filter((a) => a.ticker == ticker.base).map((a) => a.id).toArray()[0];
      if (assetId != undefined) {
        if (ticker.quote == "BTC") {
          updatePrices(assetId, ticker.price);
        } else if (ticker.quote == "USD" || ticker.quote == "USDt") {
          updateTetherPrices(assetId, ticker.price);
        }
        const esploraAssets = await loadEsploraAssets([assetId]);
        updateEsploraAssets(esploraAssets);
      }
    }
  }
  async function login(wallet: Wallet) {
    await wallet.sync();
    const totals = await wallet.getBalances();
    for (const [id, value] of Array.from(totals.entries())) {
      console.log("asset: ", id, ", value: ", value);
      const x = Number(value.toString());
      const y = x/(10**(assets.get(id)?.precision || 8));
      balances.set(id, y);
    }
    updateBalances(balances);
  }

  async function loadAssets() {
    const data = await fetchAssets();
    setAssets(data);
  }

  async function loadStokr() {
    const list = await loadStokrAssets();
    console.log("stokr assets", list);
    updateStokrAssets(list);
    const updates = await loadEsploraAssets(
      list
        .map((a) => a.secondaryAssetId)
        .map((a) => a == "" ? undefined : a)
        .filter((a) => a != undefined)
    );
    updateEsploraAssets(updates);
  }

  async function loadSideswap() {
    console.log("sideswap load");
    await connectSideswap();
    console.log("sideswap connected");
    const assets: SideswapAsset[] = await localSideswapAssets();
    setSideswapAssets([...assets]);
    console.log("sideswap assets", assets.length);
    const updates = await loadEsploraAssets(assets.map((a) => a.asset_id));
    updateEsploraAssets(updates);
    const markets: SideswapMarket[] = await localSideswapMarkets();
    setSideswapMarkets([...markets]);
    console.log("sideswap markets", markets.length);

    for (const market of markets) {
      const delegate = (price: SideswapPrice) => {
        if (price.asset_pair.base == policyAsset || price.asset_pair.quote == policyAsset) {
          const assetId: string = price.asset_pair.base == policyAsset ? price.asset_pair.quote : price.asset_pair.base;
          const value = price.ind_price ?? price.last_price;
          if (value != undefined && value > 0.0000001) {
            updatePrices(assetId, value);
            updateDirections(assetId, price.asset_pair?.base == policyAsset);
          }
        }
        if (price.asset_pair.base == tether || price.asset_pair.quote == tether) {
          const assetId: string = price.asset_pair.base == tether ? price.asset_pair.quote : price.asset_pair.base;
          const value = price.ind_price ?? price.last_price;
          if (value != undefined && value > 0.0000001) {
            updateTetherPrices(assetId, value);
            updateDirections(assetId, price.asset_pair?.base == tether);
          }
        }
        updateSideswapPrices(price);
      }
      subscribeSideswapPrice(market.asset_pair.base, market.asset_pair.quote, delegate);
    }
  }

  async function loadFiltered() {
    if (screen != Screen.Home) {
      const results = assets.values()
        .filter((asset) => 
          asset.id == policyAsset ||
          balances.get(asset.id) != undefined)
        .toArray()
      return results
    }
    if (searchTerm == "") {
      const results = assets.values()
        .filter((asset) => 
          asset.id == policyAsset ||
          balances.get(asset.id) != undefined || 
          sideswapAssets.filter((a) => a.asset_id == asset.id && a.market_type != 'Token')[0] != undefined ||
          stokrAssets.filter((a) => a.secondaryAssetId == asset.id)[0] != undefined ||
          bitfinexsSecurities.includes(asset.ticker || ""))
        .toArray()        
        .sort((a, b) => (marketcapInTether(a.id) ?? 0) < (marketcapInTether(b.id) ?? 0) ? 1 : -1)
      setFilteredAssets(results);
    } else {
      const results = assets.values().filter(asset =>
        asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.ticker?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        asset.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
        .toArray()
      if (tableAll) {
        setFilteredAssets(results);
      } else {
        setFilteredAssets(results.slice(0,30));
      }        
    }
  }

  // Common utils methods

  const circulatingAmount = (assetId: string) => {
    const esploraAsset = esploraAssets.get(assetId);
    if (esploraAsset == undefined) {
      return undefined;
    }
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

  function priceInTether(assetId: string) {
    if (tetherPrices.get(assetId) != undefined) {
      return tetherPrices.get(assetId);
    }
    const usdt = prices.get(tether) ?? 1;
    const value = prices.get(assetId) ?? 0;
    const direction = directions.get(assetId) ?? true;
    return direction ? value * 1/usdt : value * usdt;
  }

  function marketcapInTether(assetId: string) {
    const marketcap = circulatingAmount(assetId) ?? 0;
    const price = priceInTether(assetId);
    if (price == undefined) {
      return undefined;
    }
    return marketcap * price;
  }

  function balanceInTether(assetId: string) {
    const amount = balances.get(assetId) ?? 0;
    if (tetherPrices.get(assetId) != undefined) {
      return amount * (tetherPrices.get(assetId) ?? 0);
    }
    const usdt = prices.get(tether) ?? 1;
    const price = prices.get(assetId) ?? 0;
    const direction = directions.get(assetId) ?? true;
    return amount * (direction ? price * 1/usdt : price * usdt);
  }

  function remove_linebreaks(str: string) {
    return str.replace(/[\r\n]+/gm, " ");
  }
  const minify = (value: any, params: any) => {
    if (value == undefined || value == '' || value == '-') {
      return "";
    }
    return millify(value, params);
  };

  // Click buttons functions

  const handleSearchChange = (event: any) => {
    setTableAll(false)
    setSearchTerm(event.target.value);
  };
  const handleClickTableAll = () => {
    setTableAll(true)
  };
  const navigate = useNavigate();
  const goAsset = (assetId: string) => {
    navigate("/asset/" + assetId);
  };

  const handleClickJadeConnect = async () => {
    console.log("Jade connecting");
    setJadeMessage("Connecting...");
    try {
      const wallet = await Wallet.connectJade();
      wallet?.write();
      setWallet(wallet)
      setJadeMessage("Connected");
      setConnected(true);
      if (wallet != undefined) {
        await login(wallet);
      }
    } catch(err) {
      console.error("Jade disconnected");
      setJadeMessage(`Error: ${err}`);
      Wallet.remove();
      setWallet(undefined);
      setConnected(false);
    }
  };
  const handleClickJadeDisconnect = () => {
    console.log("Jade disconnecting");
    setJadeMessage("Disconnected");
    Wallet.remove();
    setWallet(undefined);
    setConnected(false);
  };
  const handleClickLogin = async () => {
    console.log("Login");
    console.log(textDescriptor)
    const text = remove_linebreaks(textDescriptor).trim();
    if (text == "") {
      console.log("Empty descriptor");
      return;
    }
    const wallet = new Wallet();
    wallet.setDescriptors([textDescriptor])
    wallet.write();
    setWallet(wallet);
    setLogged(true);
    await login(wallet);
  };

  const handleClickLogout = () => {
    console.log("Logout");
    Wallet.remove();
    setWallet(undefined);
    setBalances(new Map<string, number>());
    setTextDescriptor("");
    setLogged(false);
  };
  

  // Rendering effects

  useEffect(() => {
    loadAssets();
  }, []);

  useEffect(() => {
    loadStokr();
  }, [assets]);

  useEffect(() => {
    loadBitfinex();
  }, [assets]);

  useEffect(() => {
    loadSideswap();
  }, [assets]);

  useEffect(() => {
    setLogged(Wallet.exist());
    const wallet = Wallet.read();
    setWallet(wallet);
    if (wallet != undefined) {
      setTextDescriptor(wallet.descriptors?.map((d) => d.toString()).join(' ') ?? '');
      login(wallet)
    }
  }, [assets]);

  useEffect(() => {
    // Filter stocks based on search term
    loadFiltered()
  }, [assets, searchTerm, tableAll, sideswapPrices, balances, bitfinexTickers]);

  useEffect(() => {
    async function reload() {
      const esploraAssets = await loadEsploraAssets(
        filteredAssets
          .filter((a) => localStorage.getItem(a.id) != null)
          .map((a) => a.id)
      );
      updateEsploraAssets(esploraAssets);
    }
    reload();
  }, [filteredAssets]);

  // window dimension functions
  function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
      width,
      height
    };
  }
  useEffect(() => {
    function handleUpdate() {
      loadFiltered();
    }
    handleUpdate();
  }, [prices, balances]);

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

  return (
    <main>
      <ThemeProvider theme={theme}>
        <Container id="header" className="Hero_hero__FVN0h" style={{ width:'100%', padding: 0, margin: 0 }}>
          
          <div className="Hero_topWave__MRnRR rive" style={{ width: (width>1037 ? width : heightBar * 2.07), height: (width<1037 ? heightBar : width / 2.07), minHeight: heightBar, left: '-2px', top:(width<1037 ? '-4px' : -width/2.07+heightBar), borderBottomStyle: 'solid', position: 'absolute'}}>
            <RiveComponent src="https://public.rive.app/hosted/113763/180277/uc54S_-h2UCFWpOo-aEkyg.riv" />
          </div>

          <Box className="Navigation_navbar__3GOR8">
            <Link to="/asset">
              <img width={58} height={58} className="mantine-1trwvlz mantine-Avatar-image" src="/media/logo.28b5ba97.svg"/>
            </Link>
            <div className="__className_a99301 font-bold">
              <ul className="Navigation_navbar_links__vNpTF">
              
                {[Screen.Home, Screen.Wallet, Screen.Jade].map((sc) => { 
                  return (
                    <li key={sc} className={screen == sc ? "Navigation_active__iWhq5" : ""}>
                      <a onClick={()=> { setScreen(sc)}}>
                        {sc}
                      </a>
                    </li>
                  )}
                )}
              </ul>
            </div>
          </Box>

          {screen == Screen.Home && <Container className="Hero_heroContent__QJ4iM">
            <Box className="Hero_heroLeftCol__5MwIz">
              <h1 className="__className_a99301 font-h1 font-semibold mb-4">The Liquid Encyclopedia</h1>
              <div className="__className_a99301 font-h2 font-regular mb-5"><p>Liquid digital assets like stablecoins, tokenized securities, and bonds.</p></div>
              <br/>
              <TextField 
                style={{ width: '100%' }}
                variant="standard"
                placeholder="Search liquid asset"
                value={searchTerm}
                color='secondary'
                InputProps={{
                  style: { color: '#FFFFFF', borderBottom: "1px solid #ffffff",}
                }}
                onChange={handleSearchChange}
              />
            </Box>
          </Container>}

          {screen == Screen.Wallet && 
        <Container className="Hero_heroContent__QJ4iM">
          <Box className="Hero_heroLeftCol__5MwIz">
            <h1 className="__className_a99301 font-h1 font-semibold mb-4">Liquid Web Wallet</h1>
            <div className="__className_a99301 font-h2 font-regular mb-5"><p>Insert your Watch-only Descriptor</p></div>
            <TextField 
              fullWidth 
              id="outlined-basic" 
              label="CT Descriptor" 
              variant="outlined" 
              color='secondary'
              value={textDescriptor} 
              onChange={(e) => setTextDescriptor(e.target.value)} 
              multiline
              disabled={logged}
              rows={4}
              InputProps={{
                style: { color: '#FFFFFF', border: "1px solid #ffffff",}
              }}
            />
            <br/>
            <br/>
            {!logged && <Button variant='contained' sx={{color: 'white'}} onClick={handleClickLogin}>
                Use descriptor
            </Button>}
            {logged && <Button variant='contained' sx={{color: 'white'}} onClick={handleClickLogout}>
                Remove descriptor
            </Button>}
          </Box>
        </Container>
          }
          {screen == Screen.Jade && 
        <Container className="Hero_heroContent__QJ4iM">
          <Box className="Hero_heroLeftCol__5MwIz">
            <h1 className="__className_a99301 font-h1 font-semibold mb-4">Jade Web Wallet</h1>
            <div className="__className_a99301 font-h2 font-regular mb-5"><p>Connect your Jade</p></div>
            <br/>
            <TextField 
              style={{ width: '100%' }}
              variant="standard"
              value={jadeMessage}
              color='secondary'
              InputProps={{
                style: { color: '#FFFFFF', borderBottom: "1px solid #ffffff",}
              }}
            />
            <br/>
            <br/>
            {!connected &&<Button variant='contained' sx={{color: 'white'}} onClick={handleClickJadeConnect}>
                Connect to Jade
            </Button>}
            {connected && <Button variant='contained' sx={{color: 'white'}} onClick={handleClickJadeDisconnect}>
                Disconnect from Jade
            </Button>}
          </Box>
        </Container>
          }
        </Container>

  

        <Container maxWidth="md" sx={{ marginTop: 4, marginBottom: 8 }}>
      
          <Box sx={{ width: '100%', display: 'flex' }}>
            { progress ? <LinearProgress /> : '' }
          </Box>
          <TableContainer>
            <Table aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell padding='none'><Typography color="textSecondary" variant="overline">Name</Typography></TableCell>
                  <TableCell align="right" padding='none'><Typography color="textSecondary" variant="overline">Price</Typography></TableCell>
                  {screen == Screen.Home && <TableCell align="right" padding='none'><Typography color="textSecondary" variant="overline">MarketCap</Typography></TableCell>}
                  {screen != Screen.Home && <TableCell align="right" padding='none'><Typography color="textSecondary" variant="overline">Balance</Typography></TableCell>}
                </TableRow>
              </TableHead>
        
              <TableBody>
                {filteredAssets.map((asset) => { 
                  return (
                    <TableRow
                      key={asset.id}
                      onClick={()=> { goAsset(asset.id)}}
                      sx={{ '&:last-child td': { border: 0 } , '&:last-child th': { border: 0 } }}
                    >
                      <TableCell component="th" scope="row">
                        {<img
                          width={50}
                          height={50}
                          className="mantine-1trwvlz mantine-Avatar-image img-white"
                          src={`./icons/${asset.id}.png`}
                          alt=""

                        />}
                      </TableCell>
                      <TableCell component="th" scope="row">
                        <Box>
                          <Typography variant="h6">{asset.name}</Typography>
                          <Typography variant="button" color="textSecondary">
                            {asset.ticker} {asset.domain} 
                            { bitfinexsSecurities.includes(asset.ticker ?? "") && <img src="/media/securities.png" height={20} style={{marginLeft:'10px'}}/>}
                            { sideswapAssets.filter((a) => a.asset_id == asset.id)[0] && <img src="/media/sideswap.png" height={20} style={{marginLeft:'10px'}}/>}
                            { stokrAssets.filter((a) => a.secondaryAssetId == asset.id)[0] && <img src="/media/stokr.ico" height={20} style={{marginLeft:'10px'}}/>}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box>
                          <Typography variant="h5">
                            {prices.get(asset.id) ? minify(prices.get(asset.id), {precision: 10, lowercase: true}) : "-"}
                          </Typography>
                          <Typography variant="button" color="textSecondary">
                            {priceInTether(asset.id) ? minify(priceInTether(asset.id), {precision: 10, lowercase: true}) : "-"} $
                          </Typography>
                        </Box>
                      </TableCell>
                      { screen == Screen.Home && 
              <TableCell align="right">
                <Box>
                  <Typography variant="h5">
                    { esploraAssets.get(asset.id) ? 
                      (esploraAssets.get(asset.id)?.chain_stats?.has_blinded_issuances ? 
                        "*****" : 
                        minify(circulatingAmount(asset.id), {precision: 0, lowercase: true})
                      ) 
                      : ""
                    }
                  </Typography>
                  <Typography variant="button" color="textSecondary">
                    { esploraAssets.get(asset.id) ? 
                      (esploraAssets.get(asset.id)?.chain_stats?.has_blinded_issuances ? 
                        "*****" : 
                        minify(marketcapInTether(asset.id), {precision: 0, lowercase: true})
                      ) 
                      : ""
                    } $
                  </Typography>
                </Box>
              </TableCell>
                      }
                      { screen != Screen.Home && 
              <TableCell align="right">
                <Typography variant="h5">
                  {balances.get(asset.id)?.toFixed(asset.precision ?? 8)}
                </Typography>
                <Typography variant="button" color="textSecondary">
                  {minify(balanceInTether(asset.id), {precision: 2, lowercase: true})} $
                </Typography>
              </TableCell>
                      }
                    </TableRow>
                  )}
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Button onClick={handleClickTableAll} hidden={filteredAssets.length <= 5}>
          show all ...
          </Button>

        </Container>
      
      </ThemeProvider>
    </main>
  );
}

export default Home;
