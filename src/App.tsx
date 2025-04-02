import logo from './logo.svg';

import React, { useState, useEffect } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import Button from '@mui/material/Button';
import SendIcon from '@mui/icons-material/Send';
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
import { withStyles } from "@mui/material/styles";


import { getSideswapMarket, getSideswapMarkets, Quote, Market } from './lib/sideswap';
import { fetchAssets, policyAsset, Asset } from './lib/registry';
import { getBalances, sync, fetchEsploraAsset, existDescriptor, EsploraAsset} from './lib/data';
import FabDescriptor from './components/FabDescriptor';


import RiveComponent from '@rive-app/react-canvas';

function App() {

  const [stocks, setStocks] = useState<Asset[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Asset[]>([]);
  const [, setMarkets] = useState<Market[]>([]);
  const [marketQuotes, setMarketQuotes] = useState<Quote[]>([]);
  const [esploraAssets, setEsploraAssets] = useState<EsploraAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [progress, setProgress] = useState(false);
  const [balances, setBalances] = useState(new Map<string, number>());
  const [tableAll, setTableAll] = useState(false);
  const { height, width } = useWindowDimensions();


  // Delegate
  const onRefresh = async () => {
    console.log("refreshing");
    if (existDescriptor()) {
      await loadBalances();
    } else {
      setBalances(new Map<string, number>());
    }
  };

  // Loading functions
  async function loadBalances() {
    setProgress(true)
    await sync();
    const balances = await getBalances();
    setBalances(balances);
    setProgress(false);
  };
  async function loadStocks() {
    const data = await fetchAssets();
    setStocks(data);
  }
  async function loadMarkets() {
    const markets: Market[] = await getSideswapMarkets();
    setMarkets(markets);
    const asset = await fetchEsploraAsset(policyAsset);
    setEsploraAssets((prev) => [...prev, asset]);
    for (const market of markets) {
      const quote = await getSideswapMarket(market.asset_pair.base, market.asset_pair.quote);
      if (quote != undefined) {
        setMarketQuotes((prev) => [...prev, quote]);
        const assetId = quote.asset_pair?.base == policyAsset ? quote.asset_pair?.quote : quote.asset_pair?.base;
        const asset = await fetchEsploraAsset(assetId!);
        setEsploraAssets((prev) => [...prev, asset]);
      }
    }
  }
  async function loadFiltered() {
    if (searchTerm == "") {
      const results = stocks
        .filter((asset) => asset.metadata != undefined || balances.get(asset.id) != undefined)
        .sort((a, b) => (balances.get(a.id) ?? 0) >(balances.get(b.id) ?? 0) ? 1 : -1)
      setFilteredStocks(results);
    } else {
      const results = stocks.filter(stock =>
        stock.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.ticker?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        stock.id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (tableAll) {
        setFilteredStocks(results);
      } else {
        setFilteredStocks(results.slice(0,30));
      }        
    }
  }

  // Click buttons functions
  const handleSearchChange = (event: any) => {
    setTableAll(false)
    setSearchTerm(event.target.value);
  };
  const handleClickTableAll = () => {
    setTableAll(true)
  };

  // Rendering functions

  const price = (id: string): number => {
    if (marketQuotes.length == 0) {
      return 0;
    }
    const markets = marketQuotes.filter((market) => { return (market.asset_pair?.base == id || market.asset_pair?.quote == id) && (market.asset_pair?.base == policyAsset || market.asset_pair?.quote == policyAsset) });
    if (markets.length == 0) {
      return 0;
    }
    //console.log("price",id,markets);
    if (markets[0].asset_pair?.quote == policyAsset) {
      return markets[0].close;
    } else {
      return 1/markets[0].close;
    }
  };

  const marketCap = (id: string): number => {
    const asset = esploraAssets.filter((asset) => asset.asset_id == id)[0];
    if (asset == undefined) {
      return 0;
    }
    if (id == policyAsset) {
      const amount = ((asset.chain_stats?.peg_in_amount || 0) - (asset.chain_stats?.peg_out_amount || 0));
      return amount / (10**8);
    }
    const value = price(id);
    if (value == undefined) {
      return 0;
    }
    const amount = (asset.chain_stats?.issued_amount || 0) - (asset.chain_stats?.burned_amount || 0);
    const res = value * amount / (10**(asset.precision ?? 0));
    console.log("marketCap",id,asset,value,amount,res);
    return res;
  };

  const balance = (id: string) => {
    const value = balances.get(id);
    if (value == undefined) {
      return "";
    }
    const asset = stocks.filter((asset) => asset.id == id)[0];
    if (asset == undefined) {
      return "";
    }
    const x = Number(value.toString());
    const y = x/(10**(asset.precision || 8));
    return y;
  }
  const minify = (value: any, params: any) => {
    if (value == undefined || value == '' || value == '-') {
      return "";
    }
    return millify(value, params);
  };

  // Rendering effects
  console.log("***************************")

  useEffect(() => {
    loadStocks();
    console.log("+++++++++++++++++++++")
    loadMarkets();
    if (existDescriptor()) {
      loadBalances();
    }
  }, []);

  useEffect(() => {
    // Filter stocks based on search term
    loadFiltered()
  }, [stocks, searchTerm, tableAll]);

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
        setWindowDimensions(getWindowDimensions());
      }
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, []);
    return windowDimensions;
  }//textfield customization

  return (
    <main className="App">
      <Container style={{ width: '100%', padding: 0 }}>
      <Box sx={{ width: '100%', height: 300 * width/623, minHeight: 300, marginTop:'-30%'}}>
        <RiveComponent src="https://public.rive.app/hosted/113763/180277/uc54S_-h2UCFWpOo-aEkyg.riv" />
      </Box>

      <Box maxWidth="md" sx={{ width: '100%', position: 'absolute', top: 24,left: 24, flexWrap: "wrap", display: 'flex'}}>
        
            <Avatar>
              <img
                              width={58}
                              height={58}
                              className="mantine-1trwvlz mantine-Avatar-image"
                              src="https://liquid.net/_next/static/media/logo.28b5ba97.svg"
                              alt=""
                            />
            </Avatar>

        <TextField 
              style={{ flex: 0.4, left: 24 }}
              variant="standard"
              placeholder="Search liquid asset"
              value={searchTerm}
              InputProps={{
                style: { color: '#FFFFFF', borderBottom: "1px solid #ffffff",}
              }}
              onChange={handleSearchChange}
            />

        <FabDescriptor onRefresh={onRefresh}/>
      </Box>
      </Container>
      <Container maxWidth="md" sx={{ marginTop: 4, marginBottom: 8 }}>
      
      <Box sx={{ width: '100%' }}>
        { progress ? <LinearProgress /> : '' }
      </Box>
      <TableContainer>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell padding='none'><Typography color="textSecondary" variant="overline">Name</Typography></TableCell>
            <TableCell align="right" padding='none'><Typography color="textSecondary" variant="overline">Price in BTC</Typography></TableCell>
            <TableCell align="right" padding='none'><Typography color="textSecondary" variant="overline">Market Cap</Typography></TableCell>
            <TableCell align="right">{balances.size > 0 && <Typography color="textSecondary" variant="overline">Balance</Typography>}</TableCell>
          </TableRow>
        </TableHead>
        
        <TableBody>
        {filteredStocks.map((asset) => { 
          return (
            <TableRow
              key={asset.id}
              sx={{ '&:last-child td': { border: 0 } , '&:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                <Avatar>{asset.icon && <img
                          width={50}
                          height={50}
                          className="mantine-1trwvlz mantine-Avatar-image"
                          src={`data:image/jpeg;base64,${asset.icon}`}
                          alt=""
                        />}</Avatar>
              </TableCell>
              <TableCell component="th" scope="row">
                <Box>
                  <Typography variant="h6">{asset.name}</Typography>
                  <Typography variant="button" color="textSecondary">
                    {asset.ticker} {asset.domain}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell align="right">
                <Typography variant="h5">
                  { asset.id == policyAsset ? "1" : minify(price(asset.id), {
                        precision: 10,
                        lowercase: true,
                  })}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="h5">
                {minify(marketCap(asset.id), { precision: 0 })}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="h5">
                {balance(asset.id).toString()}
                </Typography>
              </TableCell>
            </TableRow>
          )}
          )}
        </TableBody>
      </Table>
      </TableContainer>

        <Button onClick={handleClickTableAll} hidden={filteredStocks.length <= 5}>
          show all ...
        </Button>

        </Container>
      </main>
  );
}


export default App;
