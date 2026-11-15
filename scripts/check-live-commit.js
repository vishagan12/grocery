const fs = require('fs');

async function checkCommit() {
  const res = await fetch('https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/products');
  const html = await res.text();
  const lowerHtml = html.toLowerCase();
  const hasPriority = lowerHtml.includes('fetchpriority="high"') || lowerHtml.includes('fetchpriority=\\"high\\"');
  console.log('Includes fetchpriority="high":', hasPriority);

  // Look for any img tags
  const imgTags = html.match(/<img[^>]+>/g) || [];
  console.log('Total img tags in SSR HTML:', imgTags.length);
  imgTags.slice(0, 5).forEach((tag, i) => {
    console.log(`Img ${i + 1}:`, tag.slice(0, 150));
  });
}

checkCommit();

