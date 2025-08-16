/* eslint-disable react/prop-types */
import { Helmet } from 'react-helmet-async';

const SEOHead = ({
  title = 'Valor-IVX',
  description = 'Professional financial modeling and valuation platform for analysts, investors, and finance professionals.',
  canonical,
  image = '/assets/images/og-image.svg',
  type = 'website',
  keywords = 'financial modeling, DCF analysis, valuation tools, LBO modeling, scenario analysis, financial analytics',
  author = 'Valor IVX',
  twitterHandle = '@valorivx',
  publishedTime,
  modifiedTime
}) => {
  const siteUrl = 'https://valor-ivx.com';
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : siteUrl;
  const fullImage = image.startsWith('http') ? image : `${siteUrl}${image}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />

      {/* Canonical URL */}
      <link rel="canonical" href={fullCanonical} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullCanonical} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="Valor-IVX" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={twitterHandle} />
      <meta name="twitter:creator" content={twitterHandle} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Article specific meta tags */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}

      {/* Additional SEO meta tags */}
      <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
      <meta name="googlebot" content="index, follow" />

      {/* Language and geo targeting */}
      <meta name="language" content="en-US" />
      <meta name="geo.region" content="US" />

      {/* Structured Data - JSON-LD */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          'name': 'Valor-IVX',
          description,
          'url': siteUrl,
          'author': {
            '@type': 'Organization',
            'name': author
          },
          'applicationCategory': 'FinanceApplication',
          'operatingSystem': 'Web',
          'offers': {
            '@type': 'Offer',
            'category': 'Financial Software'
          }
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;
