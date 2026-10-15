# Sri Amman Supermarket (ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்)

> **Madurai's Trusted Neighbourhood Grocery Store — Now Online**  
> Hyper-local 25–30 Minute Grocery Delivery Web Application inspired by the user experience of modern quick-commerce platforms (Blinkit & Zepto), tailored specifically for Tamil Nadu retail culture and bilingual households.

---

## Highlights & Features

### 1. Bilingual Architecture (English & Authentic Colloquial Tamil)
- **Instant Language Toggle (`EN | தமிழ்`):** One-tap seamless language switcher across the entire application.
- **Culturally Authentic Tamil Vocabulary:** Natural, adult-friendly terms understood easily by elders and families (e.g., `கூடையைப் பார்`, `ஆர்டர் செய்ய தொடரவும்`, `குடும்ப மாத மளிகை தொகுப்பு`, `இலவச டெலிவரி`, `கடை கவுண்டர் நேரடி விலை`) rather than literal machine translations.
- **Dynamic Font & Line-Height Scaling:** Powered by Google's `Noto Sans Tamil` with optimized typography rules for clear diacritic rendering (pullis, kombus, ascenders/descenders) without vertical clipping or awkward white spaces.

### 2. Blinkit/Zepto-Grade Mobile & Desktop UI
- **Clean Menu Bar:** Features a minimalist `SA` brand badge, neatly aligned Madurai delivery location pill with live delivery estimates (`20 mins`), dynamic language switcher, and account login.
- **Frosted-Glass Sticky Search:** Sticky header with `backdrop-blur-xl` translucent glassmorphism that floats above scrolling content with instant live search autocomplete.
- **Horizontal Quick-Category Rail:** Edge-to-edge scrollable category pills with minimalist `lucide-react` stroke icons (Provisions, Vegetables, Dairy, Oils, Snacks, Pooja Essentials).
- **Zero Emoji UI:** Strict photographic retail aesthetic utilizing clean typography, Studio product imagery from Unsplash, and modern stroke icons.
- **Zero Horizontal Overflow (`100vw` Viewport Lock):** Zero horizontal scroll bleed, silky smooth touch scrolling (`overflow-x: clip`), and edge-to-edge alignment.

### 3. Core Shopping Workflows
- **24+ Curated Local Staples:** Direct counter prices on Ponni Rice, Udhaiyam Toor Dal, Gold Winner Oil, Aavin Milk & Ghee, farm-fresh vegetables, and festive pooja supplies.
- **1-Click Kudumba Monthly Grocery Bundle (குடும்ப மாத மளிகை தொகுப்பு):**
  - Pre-selected monthly kitchen staples tailored for South Indian families.
  - Interactive family size selector (Small 2–3, Regular 4–5, Joint 6+ members) with automatic quantity adjustments.
  - Interactive "Customize List" modal allowing customers to add or remove any catalog items and preview instant bulk savings.
- **Express Cart Drawer & Free Delivery Nudge:** Real-time calculation of counter savings, delivery fee progress bar (`Free above ₹499`), and thermal bill preview.
- **3-Step Express Checkout:**
  - Phone OTP verification (demo code: `1234`).
  - Madurai locality selector (K.K. Nagar, Anna Nagar, Simmakkal, Goripalayam, etc.).
  - Payment via Cash on Delivery / Rider QR Scan / Online UPI.
- **Live 5-Milestone Order Tracker:** Visual tracking from order placement, counter packing, out for delivery with rider details, to doorstep arrival.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 14](https://nextjs.org/) (App Router, React 18, TypeScript) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) + Custom CSS Glassmorphism & GPU Acceleration |
| **Typography** | `Inter` + `Noto Sans Tamil` via Google Fonts |
| **Icons** | [Lucide React](https://lucide.dev/) (Stroke-only icons, zero emojis) |
| **State Management** | React Context (`StoreContext`) with LocalStorage persistence |
| **Deployment** | Vercel / Node.js Static & SSR compatible |

---

## Project Structure

```
amman-grocery-demo/
├── public/                 # Static assets, web manifest, SVGs
├── src/
│   ├── app/
│   │   ├── checkout/       # 3-step express checkout route
│   │   ├── monthly-list/   # 1-Click Kudumba monthly grocery bundle route
│   │   ├── orders/         # Live order milestone tracker route
│   │   ├── products/       # Filterable catalog & search results route
│   │   ├── globals.css     # Global theme tokens, typography & viewport rules
│   │   ├── layout.tsx      # Root HTML layout with StoreProvider
│   │   └── page.tsx        # Homepage (Bento hero, categories, deals, reviews)
│   ├── components/
│   │   ├── AppShell.tsx         # Responsive wrapper with zero blank space
│   │   ├── CartDrawer.tsx       # Slide-out cart with bill breakdown
│   │   ├── CategoryGrid.tsx     # 8 store aisle categories
│   │   ├── CheckoutPage.tsx     # Address, OTP & payment steps
│   │   ├── FeaturedProducts.tsx # Bestseller product cards with variant picker
│   │   ├── Footer.tsx           # Store info, customer care & footer navigation
│   │   ├── Header.tsx           # SA logo, location, Tamil toggle & sticky search
│   │   ├── HeroSection.tsx      # Responsive Bento grid with monthly bundle
│   │   ├── HomeExtras.tsx       # Super saver banners & verified customer reviews
│   │   ├── LocationModal.tsx    # Madurai neighborhood picker
│   │   ├── MobileBottomNav.tsx  # Fixed bottom navigation bar for mobile
│   │   ├── MonthlyListPage.tsx  # Interactive Kudumba monthly grocery manager
│   │   └── OrdersPage.tsx       # Order status milestone timeline
│   ├── context/
│   │   └── StoreContext.tsx     # Global cart, orders, language & location state
│   └── data/
│       ├── products.ts          # 24+ retail grocery products with variants & stock
│       └── translations.ts      # Bilingual English & natural Tamil dictionary
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js 18.17 or later
- npm or yarn or pnpm

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/vishagan12/grocery.git
   cd grocery
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open in your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000).

### Production Build
To create an optimized production build:
```bash
npm run build
npm run start
```

---

## License & Credits
- **Developed for:** Sri Amman Supermarket, Madurai (ஸ்ரீ அம்மன் சூப்பர்மார்க்கெட்).
- **Repository:** [https://github.com/vishagan12/grocery](https://github.com/vishagan12/grocery)
