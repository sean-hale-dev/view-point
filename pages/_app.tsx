import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { GlobalStateContext } from '../hooks/useGlobalState';
import { useEffect, useState } from 'react';
import SegFaultHandler from 'segfault-handler';
SegFaultHandler.registerHandler('crash.log');

function MyApp({ Component, pageProps }: AppProps) {
  const [ isAuthenticated, setIsAuthenticated ] = useState(false);
  const [ showNSFW, setShowNSFW ] = useState(true);
  
  useEffect(() => {
    fetch('/api/auth', {
      method: 'POST',
      mode: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    }).then((response) => {
      if (response.status === 200) {
        setIsAuthenticated(true);
      }
    });
  }, []);

  const contextValue = {
    auth: isAuthenticated, setAuth: setIsAuthenticated,
    showNSFW, setShowNSFW,
  };

  return (
    <GlobalStateContext.Provider value={contextValue}>
      <Component {...pageProps} />
    </GlobalStateContext.Provider>
  );
}

export default MyApp;
