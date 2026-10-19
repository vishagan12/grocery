import React from 'react';

export default function SeoSchema() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://sriammansupermarket.in';
  const shopLat = Number(process.env.NEXT_PUBLIC_SHOP_LAT) || 9.963263;
  const shopLng = Number(process.env.NEXT_PUBLIC_SHOP_LNG) || 78.158727;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': ['GroceryStore', 'Supermarket', 'LocalBusiness'],
    name: 'Sri Amman Supermarket',
    alternateName: 'ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்',
    description:
      "Madurai's trusted neighborhood supermarket offering express 3 km home delivery of fresh vegetables, Ponni boiled rice, dals, cold-pressed oils, Aavin dairy, and household essentials.",
    url: baseUrl,
    hasMap: 'https://maps.app.goo.gl/FTHC6VPFxUGZy71Y6',
    priceRange: '₹₹',
    currenciesAccepted: 'INR',
    paymentAccepted: 'UPI, Cash on Delivery, Cards',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Madurai',
      addressRegion: 'Tamil Nadu',
      postalCode: '625001',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: shopLat,
      longitude: shopLng,
    },
    areaServed: {
      '@type': 'GeoCircle',
      geoMidpoint: {
        '@type': 'GeoCoordinates',
        latitude: shopLat,
        longitude: shopLng,
      },
      geoRadius: '3000',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: '07:00',
        closes: '22:00',
      },
    ],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${baseUrl}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
