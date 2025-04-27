import React from 'react';
import { Routes, Route } from 'react-router-dom';

import Home from './pages/Home';
import Details from './pages/Details';

const Main = () => {
  return (
    <Routes> {/* The Switch decides which component to show based on the current URL.*/}
      <Route path='/' element={<Home />}></Route>
      <Route path='/asset/:id' element={<Details />}></Route>
    </Routes>
  );
}

export default Main;