import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import 'swagger-ui-react/swagger-ui.css';
import { CurrentUserProvider } from '@/lib/context/CurrentUserContext';

const App = ({ Component, pageProps }: AppProps) => (
  <CurrentUserProvider>
    <Component {...pageProps} />
  </CurrentUserProvider>
);

export default App;
