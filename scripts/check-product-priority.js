const fs = require('fs');

async function checkProductPriority() {
  const res = await fetch('https://grocery-git-opus-review-vishagan1206-5502s-projects.vercel.app/products');
  const html = await res.text();
  const imgTags = html.match(/<img[^>]+>/g) || [];
  const priorityImgs = imgTags.filter(t => t.toLowerCase().includes('fetchpriority="high"'));
  console.log('Priority img tags count in HTML:', priorityImgs.length);
  priorityImgs.forEach((img, i) => console.log(`Priority Img ${i+1}:`, img.slice(0, 160)));
}

checkProductPriority();

