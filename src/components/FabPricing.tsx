// components/FloatingActionButton.js
import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Fab from '@mui/material/Fab';
import KeyIcon from '@mui/icons-material/Key';
import KeyOffIcon from '@mui/icons-material/KeyOff';

import {getDescriptor, setDescriptor, existDescriptor, removeDescriptor} from '../libs/data';

const FabPricing = (props: any) => {
  const onRefresh = props.onRefresh;

  const [bitcoin, setBitcoin] = useState(true);

  useEffect(() => {
    
  }, []);
  const handleClickBtc = () => {
    setBitcoin(true);
    onRefresh(true);
  };
  const handleClickUsd = () => {
    setBitcoin(false);
    onRefresh(false);
  };

  return (
    <>
    <ButtonGroup variant="text" aria-label="Basic button group">
      <Button variant={bitcoin ? 'contained' : 'text'} onClick={handleClickBtc}>BTC</Button>
      <Button variant={!bitcoin ? 'contained' : 'text'} onClick={handleClickUsd}>USDt</Button>
    </ButtonGroup>
    </>
  );
};

export default FabPricing;