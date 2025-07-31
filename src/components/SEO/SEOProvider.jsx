import { HelmetProvider } from 'react-helmet-async';

const SEOProvider = ({ children }) => {
  return <HelmetProvider>{children}</HelmetProvider>;
};

export default SEOProvider;
