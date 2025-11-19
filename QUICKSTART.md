# Quick Start Guide - MTG Card Manager

Get your MTG Card Manager running in 5 minutes!

## Prerequisites

- Node.js 18+
- MongoDB (see options below)

## Fastest Setup (Docker)

```bash
# 1. Start MongoDB
docker run -d --name mtg-mongodb -p 27017:27017 mongo:7.0

# 2. Install dependencies
npm install
cd server && npm install && cd ..

# 3. Configure environment
cp server/.env.example server/.env
# Edit server/.env with your Google OAuth credentials (see AUTHENTICATION_SETUP.md)

# 4. Start the backend (in one terminal)
cd server && npm start

# 5. Start the frontend (in another terminal)
npm run dev
```

## Alternative: Use MongoDB Atlas (Cloud)

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Update `MONGODB_URI` in `server/.env` with your connection string

## Using the Application

### 1. Login

1. Open **http://localhost:5173**
2. Click "Sign in with Google"
3. Authenticate with your Google account

### 2. Search for Cards

1. Navigate to "Search Cards"
2. Type a card name (e.g., "Lightning Bolt", "Black Lotus")
3. Toggle "Foil" if you want the foil version
4. Select a deck from the dropdown (optional)
5. Click "Add to Wishlist"

### 3. Manage Your Wishlist

1. Click "My Wishlist" in the navigation
2. You'll see all cards you've added with their specific printing details
3. For each card:
   - View the exact printing (set, collector number, rarity)
   - See finish badges (✨ Foil) and special treatments (🌟 Showcase, 🖼️ Extended Art, etc.)
   - Toggle the "Foil" checkbox to switch between foil/non-foil
   - Click "Fetch Prices" to get current prices from 3 stores
   - Set priority (Low/Medium/High)
   - View which store has the cheapest price (marked with green badge)
   - Click "📊 Price History" to see a chart of price trends
   - Click "Remove" to delete from wishlist

## 4. Update All Prices

Click "Update All Prices" at the top of the wishlist to refresh prices for all cards at once.

## Key Features

### Price Comparison
- **TCGPlayer**: Most popular MTG marketplace
- **Card Kingdom**: Known for quality and customer service
- **CoolStuffInc**: Often competitive pricing

The app automatically highlights the cheapest option for each card!

### Price Trends
After tracking a card for a few days, you'll see:
- 📈 **Increasing**: Price is going up (may want to buy soon)
- 📉 **Decreasing**: Price is dropping (good time to wait)
- ➡️ **Stable**: Price isn't changing much

### Data Storage
All your wishlist data is saved automatically in your browser. No account needed!

## Tips

1. **Check prices regularly**: Click "Update All Prices" daily to track trends
2. **Set priorities**: Mark important cards as "High" priority
3. **View charts**: The price history chart helps you decide when to buy
4. **Rate limiting**: The app respects Scryfall's API limits (10 req/sec)

## Example Cards to Search

Try searching for these popular cards:
- "Sol Ring"
- "Lightning Bolt"
- "Counterspell"
- "Birds of Paradise"
- "Path to Exile"
- "Rhystic Study"

## Building for Production

When you're ready to deploy:

```bash
npm run build
```

The built files will be in the `dist/` folder.

## Need Help?

Check the main README.md for more detailed information about:
- Project structure
- API details
- Development guidelines
- Contributing

---

**Enjoy managing your MTG card wishlist! 🃏✨**
