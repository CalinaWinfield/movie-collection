# 🎬 Kolekino — Physical & Media Collection Tracker

A modern, cinematic media tracking web application inspired by **[Kolekino](https://kolekino.app)**. Designed specifically for collectors who love physical media (4K Ultra HD discs, Steelbooks, Criterion Collection, Blu-rays, DVDs, TV box sets) and video games (Nintendo Switch cartridges, PS5 discs, Xbox, PC/Steam).

---

## ✨ Key Kolekino-Inspired Features

### 1. 💽 Edition-Level Tracking ("Media First, Editions Second")
- Catalog multiple physical & digital editions under a single title (e.g. A *4K UHD Steelbook* and a *Criterion Remastered Digipak* for the same movie).
- Track specific packaging types: **Steelbook**, **Slipcover**, **Digibook / Digipak**, **Collector Box Set**, **Standard Keep Case**, or **Cartridge Only**.
- Record condition (*New/Sealed, Mint, Very Good, Good, Fair*), disc counts, regions (*Region Free, Region A, Region B, NTSC, PAL*), barcodes/UPCs, purchase price, purchase date, and retailer.

### 2. 📚 Interactive Physical Bookshelf Spine View
- Toggle between **Poster Grid** and a **Physical Bookshelf Spine View**.
- Realistic physical spines matching format colorways:
  - **4K Ultra HD**: Sleek obsidian case with gold spine typography.
  - **Steelbooks**: Polished chrome and brushed metal sheen.
  - **Criterion Collection**: Iconic black-and-white minimalist art layout.
  - **Blu-ray**: Classic vibrant royal blue casing.
  - **Nintendo Switch**: Bold crimson spine styling.
  - **PlayStation 5**: Crisp white & electric blue spine branding.
- Hover over any spine to pull the case forward from the shelf!

### 3. 🤝 Media Lending Tracker ("Lent Out" Hub)
- Track who borrowed your discs, box sets, or games.
- Record borrower name, contact information, date lent, expected return date, and personal notes.
- Dedicated "Lent Out" indicator badge in the top navigation.
- 1-click **"Mark Returned"** to archive the loan.

### 4. 🗂️ Themed Curated Shelves
- Create custom themed shelves (e.g., *"4K Steelbooks"*, *"Criterion Collection"*, *"Favorites"*, *"Sci-Fi Classics"*, *"Cozy Switch Games"*).
- Customize shelf accent colors and filter your entire library by shelf with one click.

### 5. 🔍 Zero-Config Live Auto-Lookup & Media Autofill
- Search any **Movie**, **TV Show**, or **Video Game** to automatically pull:
  - Official cover artwork / poster
  - Release year
  - Director, TV Network, or Game Developer
  - Synopsis & genres
- Works out of the box with zero external API key requirements.
- Full support for manual entry for boutique imports, bootlegs, or rare limited pressings.

### 6. 📊 Collector Insights & Statistics Dashboard
- Total collection counts and category distribution.
- Format breakdown (4K UHD vs Blu-ray vs Steelbook vs Switch vs PS5).
- Estimated collection financial valuation & average price per title.
- Slipcover ratio tracking.
- Completion progress (*Owned, In Progress, Completed, Wishlist*).

### 7. 💾 Export, Import & Curated Starter Collection
- 1-click **"Load Curated Sample Library"** to pre-populate acclaimed titles (*Dune: Part Two Steelbook, Oppenheimer slipcover, Criterion Seven Samurai, Breaking Bad Barrel Box Set, Zelda: Tears of the Kingdom Collector's Edition, Elden Ring Launch Edition*).
- Export complete collection as **JSON** or **CSV** (for spreadsheets).
- Import from backup JSON files.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)

### Running the Application

1. **Start the Application**:
   ```bash
   node server/index.js
   ```
   *or from the root directory:*
   ```bash
   npm start
   ```

2. **Open in Browser**:
   Open **[http://localhost:5000](http://localhost:5000)** in your browser.

### Development Mode (with Vite Hot Reload)
If you wish to develop on the React frontend with instant hot module replacement:
```bash
# Terminal 1: Backend API
cd server
node index.js

# Terminal 2: Frontend Vite Dev Server
cd client
npm run dev
```
Then visit **[http://localhost:5173](http://localhost:5173)**.

---

## 🔑 Demo Account

You can click **"Instant Demo"** on the login screen, or sign in with:
- **Username:** `cinephile`
- **Password:** `demo1234`

You can also register a brand new personal collector account at any time!

---

## 🛠️ Architecture & Tech Stack

- **Backend**: Node.js, Express, `sql.js` (pure WebAssembly SQLite with zero native compile issues), JWT authentication, `bcryptjs`.
- **Database**: SQLite binary database persisted at [server/data/collection.db](file:///c:/Users/calin/Personal%20Projects/movie-collection/server/data/collection.db).
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Lookup APIs**: Wikipedia REST API & TVMaze API (public, robust, keyless).
