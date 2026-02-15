import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import 'swagger-ui-react/swagger-ui.css';
import React from 'react';
import Router from 'next/router';
import { CurrentUserProvider } from '@/lib/context/CurrentUserContext';
import { ToastProvider } from '@/components/ui/use-toast';

const App = ({ Component, pageProps }: AppProps) => {
  const [isRouteChanging, setIsRouteChanging] = React.useState(false);

  React.useEffect(() => {
    const handleStart = () => setIsRouteChanging(true);
    const handleDone = () => setIsRouteChanging(false);

    Router.events.on('routeChangeStart', handleStart);
    Router.events.on('routeChangeComplete', handleDone);
    Router.events.on('routeChangeError', handleDone);

    return () => {
      Router.events.off('routeChangeStart', handleStart);
      Router.events.off('routeChangeComplete', handleDone);
      Router.events.off('routeChangeError', handleDone);
    };
  }, []);

  return (
    <ToastProvider>
      <CurrentUserProvider>
        {isRouteChanging && (
          <div className='fixed inset-x-0 top-0 z-[60] h-0.5'>
            <div className='h-full w-full bg-primary/80 animate-pulse' />
          </div>
        )}
        <Component {...pageProps} />
      </CurrentUserProvider>
    </ToastProvider>
  );
};

export default App;
