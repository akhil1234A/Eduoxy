"use client";

import React from 'react';
import { Provider } from 'react-redux';
import { setupApiStore } from './redux'; 

// Create the store instance
const store = setupApiStore();

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <Provider store={store}>
      {children}
    </Provider>
  );
};

// Optional: Export store types for TypeScript usage
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;