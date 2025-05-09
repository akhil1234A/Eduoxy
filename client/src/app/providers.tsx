"use client";

import React from 'react';
import { StoreProvider } from '@/state/StoreProvider';

const Providers = ({ children }: { children: React.ReactNode }) => {
  return <StoreProvider>{children}</StoreProvider>;
};

export default Providers;
