// components/FloatingActionButton.js
import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Fab from '@mui/material/Fab';
import KeyIcon from '@mui/icons-material/Key';
import KeyOffIcon from '@mui/icons-material/KeyOff';

import {getDescriptor, setDescriptor, existDescriptor, removeDescriptor} from '../libs/data';

const FabDescriptor = (props: any) => {
  const onRefresh = props.onRefresh;

  const [open, setOpen] = useState(false);
  const [logged, setLogged] = useState(false);
  const [text, setText] = useState("");


  useEffect(() => {
    setLogged(existDescriptor());
    if (existDescriptor()) {
      setText(getDescriptor()!);
    }
  }, []);
  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const handleClickLogin = () => {
    console.log("Login");
    console.log(text)
    setDescriptor(text);
    setLogged(true);
    setOpen(false);
    onRefresh();
  };
  const handleClickLogout = () => {
    console.log("Logout");
    removeDescriptor();
    setText("");
    setLogged(false);
    setOpen(false);
    onRefresh();
  };

  return (
    <>
      <Fab
        color="primary"
        aria-label="watch"
        style={{ position: 'fixed', top: 16, right: 16 }}
        onClick={handleClickOpen}
      >
        {logged ? <KeyOffIcon /> : <KeyIcon />}
      </Fab>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Watch-only</DialogTitle>

        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={(theme) => ({
            position: 'absolute',
            right: 8,
            top: 8,
            color: theme.palette.grey[500],
          })}
        >
          <CloseIcon />
        </IconButton>

        <DialogContent>
          {/* Add your form or content here */}
          <p>Insert you Watch-only Descriptor</p>
          <br/>
          <TextField fullWidth id="filled-basic" label="CT Descriptor" variant="filled" value={text} 
            onChange={(e) => setText(e.target.value)} 
            multiline
            rows={4}
            />
        </DialogContent>
        <DialogActions>
          {!logged && <Button onClick={handleClickLogin} color="primary">
            Use descriptor
          </Button>}
          {logged && <Button onClick={handleClickLogout} color="primary">
            Remove
          </Button>}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FabDescriptor;