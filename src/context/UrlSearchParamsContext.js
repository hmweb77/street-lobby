'use client';
import React, { createContext, useContext, useState } from "react";

// Create Context
const UrlSearchParamsContext = createContext();

// Provider Component
export const UrlSearchParamsProvider = ({ children }) => {
  const [urlSearchParams, setUrlSearchParams] = useState("/");

  // Function to set state
  const setParams = (params) => {
    setUrlSearchParams(params);
  };

  // Function to clear state
  const clearParams = () => {
    setUrlSearchParams("/");
  };

  return (
    <UrlSearchParamsContext.Provider value={{ urlSearchParams, setParams, clearParams }}>
      {children}
    </UrlSearchParamsContext.Provider>
  );
};

// Custom Hook to use the context
export const useUrlSearchParams = () => {
  return useContext(UrlSearchParamsContext);
};
