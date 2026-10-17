export type Variant = {
  label: string;
  price: number;
  mrp: number;
};

export type Product = {
  id: string;
  nameEn: string;
  nameTa: string;
  category: string;
  variants: Variant[];
  image: string;
  inStock: boolean;
  badge?: string;
  badgeTa?: string;
  descriptionEn?: string;
  descriptionTa?: string;
  originEn?: string;
  originTa?: string;
};

export type Category = {
  id: string;
  nameEn: string;
  nameTa: string;
  image: string;
};

export const categories: Category[] = [
  {
    id: 'rice-grains',
    nameEn: 'Rice, Atta & Grains',
    nameTa: 'அரிசி, மாவு & தானியங்கள்',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'dals-pulses',
    nameEn: 'Dals, Pulses & Spices',
    nameTa: 'பருப்பு, பயறு & மசாலா',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'oils-ghee',
    nameEn: 'Cooking Oils & Ghee',
    nameTa: 'சமையல் எண்ணெய் & நெய்',
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'dairy-eggs',
    nameEn: 'Dairy, Milk & Eggs',
    nameTa: 'பால், தயிர் & முட்டை',
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'vegetables-fruits',
    nameEn: 'Fruits & Vegetables',
    nameTa: 'பழங்கள் & காய்கறிகள்',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'snacks-biscuits',
    nameEn: 'Snacks & Biscuits',
    nameTa: 'சிற்றுண்டி & பிஸ்கட்',
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'beverages',
    nameEn: 'Tea, Coffee & Beverages',
    nameTa: 'டீ, காபி & பானங்கள்',
    image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'household-pooja',
    nameEn: 'Household & Pooja Essentials',
    nameTa: 'வீட்டு உபயோகம் & பூஜை',
    image: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=600&q=80',
  },
];

export const products: Product[] = [
  // 1. Rice & Grains
  {
    id: 'ponni-boiled-rice',
    nameEn: 'Ponni Boiled Rice',
    nameTa: 'பொன்னி புழுங்கல் அரிசி',
    category: 'rice-grains',
    variants: [
      { label: '5 kg', price: 245, mrp: 290 },
      { label: '10 kg', price: 470, mrp: 560 },
      { label: '25 kg', price: 1100, mrp: 1350 },
      { label: '1 kg', price: 52, mrp: 60 },
    ],
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '18% OFF',
    badgeTa: '18% தள்ளுபடி',
    descriptionEn: 'Premium aged Ponni boiled rice from Thanjavur delta. Fluffy, aromatic, and ideal for daily meals.',
    descriptionTa: 'தஞ்சை டெல்டாவிலிருந்து வந்த பாரம்பரிய பொன்னி புழுங்கல் அரிசி. தினசரி உணவுக்கு ஏற்றது.',
  },
  {
    id: 'india-gate-basmati',
    nameEn: 'India Gate Basmati Rice',
    nameTa: 'இந்தியா கேட் பாஸ்மதி அரிசி',
    category: 'rice-grains',
    variants: [
      { label: '1 kg', price: 180, mrp: 210 },
      { label: '5 kg', price: 850, mrp: 1000 },
    ],
    image: 'https://images.unsplash.com/photo-1536304993881-ff6e9eefa2a6?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '15% OFF',
    badgeTa: '15% தள்ளுபடி',
    descriptionEn: 'Long-grain royal basmati rice with exquisite aroma for biryanis and special occasions.',
    descriptionTa: 'பிரியாணி மற்றும் விசேஷங்களுக்கு ஏற்ற நீண்ட நறுமணமுள்ள பாஸ்மதி அரிசி.',
  },
  {
    id: 'idli-rice',
    nameEn: 'Special Idli Rice',
    nameTa: 'ஸ்பெஷல் இட்லி அரிசி',
    category: 'rice-grains',
    variants: [
      { label: '1 kg', price: 48, mrp: 55 },
      { label: '5 kg', price: 225, mrp: 265 },
    ],
    image: 'https://images.unsplash.com/photo-1568651315180-f06e21f7e669?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '13% OFF',
    badgeTa: '13% தள்ளுபடி',
    descriptionEn: 'Short grain idli rice specially parboiled for ultra-soft, pillowy mallipoo idlis and crispy dosas.',
    descriptionTa: 'மல்லிகைப்பூ இட்லி மற்றும் மொறுமொறு தோசைக்கு ஏற்ற இட்லி அரிசி.',
  },
  {
    id: 'aashirvaad-atta',
    nameEn: 'Aashirvaad Whole Wheat Atta',
    nameTa: 'ஆஷிர்வாத் கோதுமை மாவு',
    category: 'rice-grains',
    variants: [
      { label: '5 kg', price: 240, mrp: 280 },
      { label: '1 kg', price: 52, mrp: 60 },
      { label: '10 kg', price: 460, mrp: 540 },
    ],
    image: 'https://images.unsplash.com/photo-1627483262769-04d0a1401487?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '14% OFF',
    badgeTa: '14% தள்ளுபடி',
    descriptionEn: '100% whole wheat chakki-fresh atta for soft rotis and pooris with natural dietary fiber.',
    descriptionTa: '100% தூய சக்கி கோதுமை மாவு. மென்மையான சப்பாத்திக்கு சிறந்தது.',
  },
  {
    id: 'tata-salt',
    nameEn: 'Tata Iodized Salt',
    nameTa: 'டாடா அயோடின் உப்பு',
    category: 'rice-grains',
    variants: [
      { label: '1 kg', price: 25, mrp: 28 },
    ],
    image: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '11% OFF',
    badgeTa: '11% தள்ளுபடி',
    descriptionEn: 'Vacuum evaporated iodized salt for everyday kitchen seasoning.',
    descriptionTa: 'சுத்திகரிக்கப்பட்ட தூய அயோடின் கலந்த சமையல் உப்பு.',
  },

  // 2. Dals & Pulses
  {
    id: 'udhaiyam-toor-dal',
    nameEn: 'Udhaiyam Toor Dal (Yellow Lentils)',
    nameTa: 'உதயம் துவரம் பருப்பு',
    category: 'dals-pulses',
    variants: [
      { label: '1 kg', price: 138, mrp: 165 },
      { label: '500 g', price: 72, mrp: 85 },
    ],
    image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '16% OFF',
    badgeTa: '16% தள்ளுபடி',
    descriptionEn: 'Grade-A unpolished yellow toor dal for rich, aromatic sambar and rasam.',
    descriptionTa: 'மணமணக்கும் சாம்பார் மற்றும் ரசத்திற்கு ஏற்ற முதல்தர துவரம் பருப்பு.',
  },
  {
    id: 'urad-dal',
    nameEn: 'Urad Dal (White Whole)',
    nameTa: 'உளுத்தம் பருப்பு',
    category: 'dals-pulses',
    variants: [
      { label: '1 kg', price: 150, mrp: 175 },
      { label: '500 g', price: 78, mrp: 90 },
    ],
    image: 'https://images.unsplash.com/photo-1546548970-71785318a17b?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '14% OFF',
    badgeTa: '14% தள்ளுபடி',
    descriptionEn: 'Premium whole white urad dal. Machine cleaned and hand-sorted for fluffy idlis.',
    descriptionTa: 'மென்மையான இட்லி மற்றும் மொறுமொறு வடைக்கு ஏற்ற முதல்தர வெள்ளை உளுத்தம் பருப்பு.',
  },
  {
    id: 'moong-dal',
    nameEn: 'Yellow Moong Dal',
    nameTa: 'பாசிப்பருப்பு',
    category: 'dals-pulses',
    variants: [
      { label: '1 kg', price: 130, mrp: 155 },
      { label: '500 g', price: 68, mrp: 80 },
    ],
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '16% OFF',
    badgeTa: '16% தள்ளுபடி',
    descriptionEn: 'Protein-rich yellow split moong dal for wholesome pongal, kootu, and dal tadka.',
    descriptionTa: 'சத்தான பொங்கல் மற்றும் கூட்டு செய்வதற்கு ஏற்ற முதல்தர பாசிப்பருப்பு.',
  },
  {
    id: 'pottukadalai',
    nameEn: 'Roasted Gram (Pottukadalai)',
    nameTa: 'பொட்டுக்கடலை',
    category: 'dals-pulses',
    variants: [
      { label: '250 g', price: 40, mrp: 48 },
      { label: '500 g', price: 75, mrp: 90 },
    ],
    image: 'https://images.unsplash.com/photo-1585996746349-9b481762c91d?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '17% OFF',
    badgeTa: '17% தள்ளுபடி',
    descriptionEn: 'Crispy golden roasted gram for coconut chutney and festive snacks.',
    descriptionTa: 'தேங்காய் சட்னி மற்றும் காரவகைக்கு உகந்த மொறுமொறு பொட்டுக்கடலை.',
  },
  {
    id: 'aachi-turmeric-powder',
    nameEn: 'Aachi Pure Turmeric Powder',
    nameTa: 'ஆச்சி தூய மஞ்சள் தூள்',
    category: 'dals-pulses',
    variants: [
      { label: '100 g', price: 34, mrp: 40 },
      { label: '200 g', price: 65, mrp: 78 },
    ],
    image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '15% OFF',
    badgeTa: '15% தள்ளுபடி',
    descriptionEn: '100% natural turmeric ground from authentic Salem turmeric rhizomes.',
    descriptionTa: 'சேலம் விரலி மஞ்சளில் தயாரிக்கப்பட்ட தூய நறுமண மஞ்சள் தூள்.',
  },

  // 3. Cooking Oils & Ghee
  {
    id: 'gold-winner-oil',
    nameEn: 'Gold Winner Sunflower Oil',
    nameTa: 'கோல்ட் வின்னர் சன்ஃபிளவர் எண்ணெய்',
    category: 'oils-ghee',
    variants: [
      { label: '1 Ltr', price: 135, mrp: 160 },
      { label: '500 ml', price: 72, mrp: 85 },
      { label: '2 Ltr', price: 258, mrp: 310 },
      { label: '5 Ltr', price: 620, mrp: 750 },
    ],
    image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '17% OFF',
    badgeTa: '17% தள்ளுபடி',
    descriptionEn: 'Refined sunflower oil enriched with Vitamins A & D. Light and healthy for daily frying.',
    descriptionTa: 'வைட்டமின் ஏ & டி சத்துக்கள் நிறைந்த ஆரோக்கியமான சமையல் எண்ணெய்.',
  },
  {
    id: 'idhayam-gingelly-oil',
    nameEn: 'Idhayam Sesame Gingelly Oil',
    nameTa: 'இதயம் நல்லெண்ணெய்',
    category: 'oils-ghee',
    variants: [
      { label: '1 Ltr', price: 420, mrp: 500 },
      { label: '500 ml', price: 220, mrp: 260 },
      { label: '200 ml', price: 95, mrp: 110 },
    ],
    image: 'https://images.unsplash.com/photo-1620706857370-e1b9770e8bb1?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '16% OFF',
    badgeTa: '16% தள்ளுபடி',
    descriptionEn: 'Traditional cold-pressed sesame oil with authentic aroma for vatha kuzhambu and idli podi.',
    descriptionTa: 'பாரம்பரிய மரச்செக்கு நல்லெண்ணெய். வத்தக்குழம்பு மற்றும் இட்லி பொடிக்கு உகந்தது.',
  },
  {
    id: 'grb-ghee',
    nameEn: 'GRB Pure Cow Ghee',
    nameTa: 'GRB பசு நெய்',
    category: 'oils-ghee',
    variants: [
      { label: '200 ml', price: 130, mrp: 155 },
      { label: '500 ml', price: 305, mrp: 365 },
      { label: '1 Ltr', price: 580, mrp: 695 },
    ],
    image: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '17% OFF',
    badgeTa: '17% தள்ளுபடி',
    descriptionEn: 'Granular, golden cow ghee prepared in traditional method with divine aroma.',
    descriptionTa: 'பாரம்பரிய மணமணக்கும் மணல் மணலான தூய பசு நெய்.',
  },
  {
    id: 'coconut-oil',
    nameEn: 'KLF Pure Coconut Oil',
    nameTa: 'தூய தேங்காய் எண்ணெய்',
    category: 'oils-ghee',
    variants: [
      { label: '500 ml', price: 95, mrp: 115 },
      { label: '1 Ltr', price: 180, mrp: 215 },
    ],
    image: 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '16% OFF',
    badgeTa: '16% தள்ளுபடி',
    descriptionEn: '100% pure filtered coconut oil from sun-dried copra.',
    descriptionTa: '100% தூய வெயிலில் காயவைத்த கொப்பரை தேங்காய் எண்ணெய்.',
  },

  // 4. Dairy & Eggs
  {
    id: 'aavin-milk',
    nameEn: 'Aavin Full Cream Milk',
    nameTa: 'ஆவின் பசும்பால்',
    category: 'dairy-eggs',
    variants: [
      { label: '500 ml', price: 28, mrp: 30 },
      { label: '1 Ltr', price: 54, mrp: 58 },
    ],
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '7% OFF',
    badgeTa: '7% தள்ளுபடி',
    descriptionEn: 'Fresh pasteurized homogenized full-cream milk direct from local Madurai dairies.',
    descriptionTa: 'மதுரை கூட்டுறவு பால் பண்ணையிலிருந்து தினமும் காலை புதிய பசும்பால்.',
  },
  {
    id: 'country-eggs',
    nameEn: 'Farm Fresh Country Eggs',
    nameTa: 'நாட்டுக்கோழி முட்டை',
    category: 'dairy-eggs',
    variants: [
      { label: '6 pcs', price: 60, mrp: 72 },
      { label: '12 pcs', price: 115, mrp: 138 },
      { label: '30 pcs', price: 275, mrp: 330 },
    ],
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '17% OFF',
    badgeTa: '17% தள்ளுபடி',
    descriptionEn: 'Naturally fed country chicken eggs. High in protein, fresh from poultry farms.',
    descriptionTa: 'இயற்கை தீவனத்தில் வளர்ந்த நாட்டுக்கோழி முட்டைகள்.',
  },
  {
    id: 'milky-mist-paneer',
    nameEn: 'Milky Mist Fresh Paneer',
    nameTa: 'மில்கி மிஸ்ட் பன்னீர்',
    category: 'dairy-eggs',
    variants: [
      { label: '200 g', price: 80, mrp: 95 },
      { label: '500 g', price: 185, mrp: 220 },
    ],
    image: 'https://images.unsplash.com/photo-1559561853-08451507cbe7?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '16% OFF',
    badgeTa: '16% தள்ளுபடி',
    descriptionEn: 'Soft and succulent dairy paneer for curries, tikka, and gravies.',
    descriptionTa: 'மென்மையான புதிய பால் பன்னீர். கிரேவி மற்றும் டிக்கா செய்ய சிறந்தது.',
  },
  {
    id: 'aavin-curd',
    nameEn: 'Aavin Premium Fresh Curd',
    nameTa: 'ஆவின் கெட்டி தயிர்',
    category: 'dairy-eggs',
    variants: [
      { label: '200 g', price: 18, mrp: 20 },
      { label: '500 g', price: 38, mrp: 45 },
    ],
    image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '16% OFF',
    badgeTa: '16% தள்ளுபடி',
    descriptionEn: 'Thick, creamy set curd prepared from pure cow milk with live cultures.',
    descriptionTa: 'பசுவின் பாலில் உறைவிடப்பட்ட கெட்டித் தயிர்.',
  },

  // 5. Fresh Vegetables & Fruits
  {
    id: 'small-onions',
    nameEn: 'Small Onions (Sambar Vengayam)',
    nameTa: 'சாம்பார் சின்ன வெங்காயம்',
    category: 'vegetables-fruits',
    variants: [
      { label: '250 g', price: 18, mrp: 22 },
      { label: '500 g', price: 32, mrp: 40 },
      { label: '1 kg', price: 60, mrp: 75 },
    ],
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '20% OFF',
    badgeTa: '20% தள்ளுபடி',
    descriptionEn: 'Freshly harvested small shallots. Essential for authentic South Indian sambar.',
    descriptionTa: 'நாட்டு சின்ன வெங்காயம். பாரம்பரிய சாம்பார் மற்றும் காரக்குழம்பிற்கு இன்றியமையாதது.',
  },
  {
    id: 'country-tomatoes',
    nameEn: 'Fresh Country Tomatoes',
    nameTa: 'நாட்டு தக்காளி',
    category: 'vegetables-fruits',
    variants: [
      { label: '250 g', price: 12, mrp: 15 },
      { label: '500 g', price: 22, mrp: 28 },
      { label: '1 kg', price: 40, mrp: 50 },
    ],
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '20% OFF',
    badgeTa: '20% தள்ளுபடி',
    descriptionEn: 'Juicy, naturally ripened country tomatoes picked this morning from farm mandis.',
    descriptionTa: 'மதுரை உழவர் சந்தையிலிருந்து காலை வந்த புதிய நாட்டு தக்காளி.',
  },
  {
    id: 'potatoes',
    nameEn: 'Fresh Farm Potatoes',
    nameTa: 'உருளைக்கிழங்கு',
    category: 'vegetables-fruits',
    variants: [
      { label: '500 g', price: 18, mrp: 22 },
      { label: '1 kg', price: 32, mrp: 40 },
    ],
    image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '20% OFF',
    badgeTa: '20% தள்ளுபடி',
    descriptionEn: 'Firm, clean Nilgiri potatoes ideal for roasting, masala fillings, and curries.',
    descriptionTa: 'பொரியல் மற்றும் குருமாவுக்கு ஏற்ற முதல்தர உருளைக்கிழங்கு.',
  },
  {
    id: 'nendran-banana',
    nameEn: 'Fresh Nendran Bananas',
    nameTa: 'நேந்திரம் பழம்',
    category: 'vegetables-fruits',
    variants: [
      { label: '4 pcs', price: 40, mrp: 48 },
      { label: '12 pcs', price: 110, mrp: 135 },
    ],
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '19% OFF',
    badgeTa: '19% தள்ளுபடி',
    descriptionEn: 'Sweet, energy-rich Nendran bananas directly from Pollachi farms.',
    descriptionTa: 'இயற்கையாக பழுத்த சத்துக்கள் நிறைந்த நேந்திரம் பழம்.',
  },
  {
    id: 'fresh-curry-leaves',
    nameEn: 'Fresh Curry Leaves (Karuveppilai)',
    nameTa: 'புதிய கறிவேப்பிலை',
    category: 'vegetables-fruits',
    variants: [
      { label: '1 bunch (100g)', price: 10, mrp: 15 },
    ],
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: 'Farm Fresh',
    badgeTa: 'பண்ணை வரத்து',
    descriptionEn: 'Aromatic green curry leaves picked fresh this morning from local farms.',
    descriptionTa: 'மதுரை பண்ணைகளிலிருந்து இன்று காலை பறிக்கப்பட்ட நறுமணமிக்க கறிவேப்பிலை.',
  },
  {
    id: 'fresh-green-chillies',
    nameEn: 'Spicy Green Chillies (Pachai Milagai)',
    nameTa: 'பச்சை மிளகாய்',
    category: 'vegetables-fruits',
    variants: [
      { label: '100 g', price: 12, mrp: 16 },
      { label: '250 g', price: 28, mrp: 35 },
    ],
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: 'Farm Fresh',
    badgeTa: 'பண்ணை வரத்து',
    descriptionEn: 'Crisp and spicy green chillies for authentic South Indian tadka.',
    descriptionTa: 'சாம்பார் மற்றும் பொரியலுக்கு காரமான புதிய நாட்டு பச்சை மிளகாய்.',
  },

  // 6. Snacks & Biscuits
  {
    id: 'britannia-marie-gold',
    nameEn: 'Britannia Marie Gold Biscuits',
    nameTa: 'பிரிட்டானியா மேரி கோல்ட் பிஸ்கட்',
    category: 'snacks-biscuits',
    variants: [
      { label: '120 g', price: 25, mrp: 30 },
      { label: '250 g', price: 48, mrp: 55 },
      { label: '600 g', price: 98, mrp: 120 },
    ],
    image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '18% OFF',
    badgeTa: '18% தள்ளுபடி',
    descriptionEn: 'Classic tea-time wheat marie biscuits. Light, crispy, and low in sugar.',
    descriptionTa: 'டீ மற்றும் காபியுடன் சாப்பிட உகந்த மொறுமொறு மேரி பிஸ்கட்.',
  },
  {
    id: 'madras-mixture',
    nameEn: 'Special Madras Mixture',
    nameTa: 'ஸ்பெஷல் மெட்ராஸ் மிக்ஸ்சர்',
    category: 'snacks-biscuits',
    variants: [
      { label: '200 g', price: 45, mrp: 55 },
      { label: '500 g', price: 105, mrp: 130 },
    ],
    image: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '19% OFF',
    badgeTa: '19% தள்ளுபடி',
    descriptionEn: 'Crispy South Indian savoury mixture made with fried gram, curry leaves, and spices.',
    descriptionTa: 'கறிவேப்பிலை, கடலை பருப்பு சேர்த்து தயாரிக்கப்பட்ட சுவையான மெட்ராஸ் மிக்ஸ்சர்.',
  },
  {
    id: 'butter-murukku',
    nameEn: 'Traditional Butter Murukku',
    nameTa: 'வெண்ணெய் முறுக்கு',
    category: 'snacks-biscuits',
    variants: [
      { label: '200 g', price: 55, mrp: 65 },
      { label: '500 g', price: 125, mrp: 150 },
    ],
    image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '17% OFF',
    badgeTa: '17% தள்ளுபடி',
    descriptionEn: 'Melt-in-mouth butter murukku prepared in authentic Chettinad style.',
    descriptionTa: 'செட்டிநாடு சுவையில் வெண்ணெய் சேர்த்து செய்யப்பட்ட மொறுமொறு முறுக்கு.',
  },
  {
    id: 'dark-fantasy',
    nameEn: 'Sunfeast Dark Fantasy Choco Fills',
    nameTa: 'சன்ஃபீஸ்ட் டார்க் ஃபேண்டசி',
    category: 'snacks-biscuits',
    variants: [
      { label: '75 g', price: 30, mrp: 35 },
      { label: '150 g', price: 55, mrp: 65 },
      { label: '300 g', price: 105, mrp: 125 },
    ],
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '16% OFF',
    badgeTa: '16% தள்ளுபடி',
    descriptionEn: 'Crispy dark cookie crust filled with luscious molten Belgian chocolate.',
    descriptionTa: 'உள்ளே உருகும் சாக்லேட் நிரப்பப்பட்ட டார்க் குக்கீஸ்.',
  },

  // 7. Beverages
  {
    id: 'bru-coffee',
    nameEn: 'Bru Instant Coffee Powder',
    nameTa: 'ப்ரூ இன்ஸ்டன்ட் காபி தூள்',
    category: 'beverages',
    variants: [
      { label: '50 g', price: 92, mrp: 110 },
      { label: '100 g', price: 175, mrp: 210 },
      { label: '200 g', price: 338, mrp: 405 },
    ],
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '17% OFF',
    badgeTa: '17% தள்ளுபடி',
    descriptionEn: 'Roasted Robusta and Arabica coffee blended with chicory for strong South Indian coffee.',
    descriptionTa: 'சிறந்த காபி கொட்டைகளிலிருந்து தயாரிக்கப்பட்ட மணமணக்கும் இன்ஸ்டன்ட் காபி தூள்.',
  },
  {
    id: '3-roses-tea',
    nameEn: '3 Roses Natural Care Tea',
    nameTa: 'த்ரீ ரோசஸ் நேச்சுரல் கேர் டீ',
    category: 'beverages',
    variants: [
      { label: '100 g', price: 42, mrp: 50 },
      { label: '250 g', price: 98, mrp: 120 },
      { label: '500 g', price: 185, mrp: 225 },
    ],
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '18% OFF',
    badgeTa: '18% தள்ளுபடி',
    descriptionEn: 'Finest CTC tea leaves infused with 5 natural Ayurvedic herbs: tulsi, mulethi, ashwagandha, ginger, and cardamom.',
    descriptionTa: 'துளசி, அதிமதுரம், சுக்கு, ஏலக்காய் கலந்த இயற்கை மூலிகை டீ தூள்.',
  },
  {
    id: 'boost-health-drink',
    nameEn: 'Boost Energy Health Drink',
    nameTa: 'பூஸ்ட் எனர்ஜி ஹெல்த் ட்ரிங்க்',
    category: 'beverages',
    variants: [
      { label: '200 g', price: 105, mrp: 125 },
      { label: '500 g', price: 245, mrp: 295 },
    ],
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '17% OFF',
    badgeTa: '17% தள்ளுபடி',
    descriptionEn: 'Malted energy drink with 17 essential vitamins and minerals for active stamina.',
    descriptionTa: 'குழந்தைகளின் சுறுசுறுப்பு மற்றும் ஊட்டச்சத்துக்கான எனர்ஜி பானம்.',
  },
  {
    id: 'tender-coconut-water',
    nameEn: 'Natural Tender Coconut Water',
    nameTa: 'இயற்கை இளநீர்',
    category: 'beverages',
    variants: [
      { label: '200 ml', price: 30, mrp: 35 },
      { label: '1 Ltr', price: 95, mrp: 115 },
    ],
    image: 'https://images.unsplash.com/photo-1525385133512-2f3bdd039054?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '17% OFF',
    badgeTa: '17% தள்ளுபடி',
    descriptionEn: 'Pure tender coconut water rich in electrolytes, bottled with zero preservatives.',
    descriptionTa: 'இயற்கை எலக்ட்ரோலைட்டுகள் நிறைந்த புத்துணர்ச்சி தரும் தூய இளநீர்.',
  },

  // 8. Household & Pooja Essentials
  {
    id: 'surf-excel-matic',
    nameEn: 'Surf Excel Matic Front & Top Load',
    nameTa: 'சர்ஃப் எக்செல் மேட்டிக் லிக்விட்',
    category: 'household-pooja',
    variants: [
      { label: '500 ml', price: 135, mrp: 160 },
      { label: '1 Ltr', price: 255, mrp: 305 },
      { label: '2 Ltr', price: 485, mrp: 585 },
    ],
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '17% OFF',
    badgeTa: '17% தள்ளுபடி',
    descriptionEn: 'Liquid detergent that dissolves completely in machines to remove tough stains.',
    descriptionTa: 'துணிகளில் கறைகளை எளிதில் நீக்கும் வாஷிங் மெஷின் லிக்விட்.',
  },
  {
    id: 'vim-dishwash',
    nameEn: 'Vim Lemon Dishwash Liquid Gel',
    nameTa: 'விம் எலுமிச்சை பாத்திரம் கழுவும் ஜெல்',
    category: 'household-pooja',
    variants: [
      { label: '250 ml', price: 38, mrp: 45 },
      { label: '500 ml', price: 68, mrp: 82 },
      { label: '750 ml', price: 98, mrp: 118 },
    ],
    image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '17% OFF',
    badgeTa: '17% தள்ளுபடி',
    descriptionEn: 'Powerful lemon degreaser gel for squeaky clean utensils without white residue.',
    descriptionTa: 'எண்ணெய் பிசுக்கை நொடியில் நீக்கும் எலுமிச்சை வாசம் கொண்ட பாத்திரம் கழுவும் ஜெல்.',
  },
  {
    id: 'cycle-agarbatti',
    nameEn: 'Cycle Three-in-One Agarbatti',
    nameTa: 'சைக்கிள் த்ரீ இன் ஒன் ஊதுபத்தி',
    category: 'household-pooja',
    variants: [
      { label: '1 pack', price: 35, mrp: 42 },
      { label: '3 pack', price: 95, mrp: 120 },
    ],
    image: 'https://images.unsplash.com/photo-1606041008023-472dfb5e530f?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '21% OFF',
    badgeTa: '21% தள்ளுபடி',
    descriptionEn: 'Traditional devotional incense sticks with long-lasting serenity fragrance.',
    descriptionTa: 'பூஜை அறைக்கு தெய்வீக நறுமணம் தரும் பாரம்பரிய ஊதுபத்தி.',
  },
  {
    id: 'camphor-karpooram',
    nameEn: 'Pure Temple Grade Camphor (Karpooram)',
    nameTa: 'தூய கற்பூரம்',
    category: 'household-pooja',
    variants: [
      { label: '50 g', price: 45, mrp: 55 },
      { label: '100 g', price: 82, mrp: 100 },
    ],
    image: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=500&q=80',
    inStock: true,
    badge: '18% OFF',
    badgeTa: '18% தள்ளுபடி',
    descriptionEn: 'Pure fragrant camphor tablets for auspicious daily morning and evening pooja rituals.',
    descriptionTa: 'தினசரி காலை, மாலை வழிபாட்டிற்கு ஏற்ற தூய நறுமண கற்பூரம்.',
  },
];

// Monthly list items
export const monthlyListItems = [
  { productId: 'ponni-boiled-rice', variantIndex: 1, defaultQty: 1 }, // 10 kg (₹470 / MRP ₹560)
  { productId: 'gold-winner-oil', variantIndex: 2, defaultQty: 1 },   // 2 Ltr (₹258 / MRP ₹310)
  { productId: 'udhaiyam-toor-dal', variantIndex: 0, defaultQty: 1 }, // 1 kg (₹138 / MRP ₹165)
  { productId: 'aashirvaad-atta', variantIndex: 0, defaultQty: 1 },   // 5 kg (₹240 / MRP ₹280)
  { productId: 'bru-coffee', variantIndex: 1, defaultQty: 1 },        // 100 g (₹175 / MRP ₹210)
  { productId: 'aavin-milk', variantIndex: 1, defaultQty: 2 },        // 1 Ltr x2 (₹108 / MRP ₹116)
  { productId: 'surf-excel-matic', variantIndex: 0, defaultQty: 1 },  // 500 ml (₹135 / MRP ₹160)
  { productId: '3-roses-tea', variantIndex: 1, defaultQty: 1 },       // 250 g (₹98 / MRP ₹120)
  { productId: 'cycle-agarbatti', variantIndex: 0, defaultQty: 1 },   // 1 pack (₹35 / MRP ₹42)
  { productId: 'vim-dishwash', variantIndex: 1, defaultQty: 1 },      // 500 ml (₹68 / MRP ₹82)
];

// Quick impulse essentials for cart drawer
export const impulseEssentials = [
  { productId: 'tata-salt', variantIndex: 0 },
  { productId: 'fresh-curry-leaves', variantIndex: 0 },
  { productId: 'fresh-green-chillies', variantIndex: 0 },
  { productId: 'aachi-turmeric-powder', variantIndex: 0 },
];
