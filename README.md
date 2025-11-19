# MTG Card Manager

A Vue.js application to help manage your Magic: The Gathering card wishlist with price tracking from multiple retailers.

## Features

- 🔐 **Google Authentication**: Secure login with Google OAuth 2.0
- 👤 **Multi-User Support**: Each user has their own isolated wishlists, decks, and purchases
- 💾 **Database Storage**: All data persisted in MongoDB
- 🔍 **Card Search**: Search for Magic cards using the Scryfall API
- 🃏 **Printing Selection**: View and select specific printings of any card
- ✨ **Foil Tracking**: Mark cards as foil with special badge and price tracking
- 📋 **Wishlist Management**: Add cards to your wishlist with priority levels
- 🎴 **Deck Organization**: Create and manage decks to organize your wishlist by project
- 🔖 **Deck Filtering**: Filter your wishlist by deck to focus on specific projects
- 💰 **Multi-Store Price Comparison**: Compare prices from TCGPlayer, Card Kingdom, and CoolStuffInc
- 🔄 **Price Scraping**: Scrape prices from Card Kingdom and CoolStuffInc with dedicated backend service
- 📈 **Price Tracking**: Track price history over 30 days
- 📊 **Price Trends**: Visual charts showing price trends
- 🎯 **Target Price Calculator**: Shows 85% of TCGPlayer price as a buying target
- 🎯 **Best Deal Finder**: Automatically highlights the cheapest option
- 🎨 **Rarity Display**: Visual indicators for card rarity (Common, Uncommon, Rare, Mythic)
- 👁️ **Dual View Modes**: Switch between grid view (with images) and list view (table format)
- 🛒 **Order Tracking**: Mark cards as ordered and track from which store
- ✅ **Purchase History**: Automatically move received cards to purchase history

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) 
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Prerequisites

### Option 1: Docker (Recommended)
- **Docker** 20.10+ and Docker Compose 2.0+
- **Google OAuth Credentials** - See [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)

### Option 2: Local Development
- **Node.js** 18+ and npm
- **MongoDB** - See [MONGODB_SETUP.md](MONGODB_SETUP.md)
- **Google OAuth Credentials** - See [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md)

## Quick Start with Docker (Easiest)

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your Google OAuth credentials

# 2. Start everything with Docker
docker-compose up -d

# 3. Open http://localhost:3000
```

That's it! See [DOCKER_DEPLOYMENT.md](DOCKER_DEPLOYMENT.md) for detailed Docker instructions.

## Quick Start (Local Development)

### 1. Install Dependencies

```sh
# Frontend
npm install

# Backend
cd server
npm install
cd ..
```

### 2. Set Up MongoDB

Follow the guide in [MONGODB_SETUP.md](MONGODB_SETUP.md) to:
- Install MongoDB locally, use Docker, or set up MongoDB Atlas
- Start the MongoDB service

Quick start with Docker:
```sh
docker run -d --name mtg-mongodb -p 27017:27017 -v mtg-mongo-data:/data/db mongo:7.0
```

### 3. Configure Environment Variables

```sh
cd server
cp .env.example .env
# Edit .env with your Google OAuth credentials and MongoDB URI
```

Required variables:
- `GOOGLE_CLIENT_ID` - From Google Cloud Console
- `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
- `SESSION_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `MONGODB_URI` - Your MongoDB connection string (default: `mongodb://localhost:27017/mtg-card-manager`)

See [AUTHENTICATION_SETUP.md](AUTHENTICATION_SETUP.md) for detailed OAuth setup.

### 4. Start the Application

```sh
# Terminal 1: Start backend
cd server
npm start

# Terminal 2: Start frontend
npm run dev
```

The app will be available at `http://localhost:5173`

## Documentation

- 🐳 [Docker Deployment Guide](DOCKER_DEPLOYMENT.md) - **Recommended deployment method**
- 🔐 [Authentication Setup](AUTHENTICATION_SETUP.md) - Google OAuth configuration
- 💾 [MongoDB Setup Guide](MONGODB_SETUP.md) - Local database installation
- 🗄️ [Database Implementation](DATABASE_IMPLEMENTATION.md) - Technical details
- 📚 [Server API Documentation](server/README.md) - Backend API reference

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
