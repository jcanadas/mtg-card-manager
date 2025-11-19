# MTG Card Price Scraper Server

A Node.js/Express backend service for scraping Magic: The Gathering card prices from Card Kingdom and CoolStuffInc.

## Features

- Scrapes prices from Card Kingdom and CoolStuffInc
- Single card and bulk scraping endpoints
- Rate limiting to be respectful of target websites (1-1.5 second delays)
- CORS enabled for frontend integration
- Supports foil and non-foil card variants

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3001`

## API Endpoints

### POST /api/scrape-price

Scrape price for a single card.

**Request Body:**
```json
{
  "cardName": "Lightning Bolt",
  "setCode": "m11",
  "source": "cardkingdom",
  "isFoil": false
}
```

**Response:**
```json
{
  "success": true,
  "price": 1.99,
  "source": "cardkingdom",
  "cardName": "Lightning Bolt",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### POST /api/scrape-prices-bulk

Scrape prices for multiple cards.

**Request Body:**
```json
{
  "cards": [
    {
      "cardId": "unique-id-1",
      "cardName": "Lightning Bolt",
      "setCode": "m11",
      "source": "cardkingdom",
      "isFoil": false
    },
    {
      "cardId": "unique-id-2",
      "cardName": "Counterspell",
      "setCode": "m11",
      "source": "coolstuffinc",
      "isFoil": true
    }
  ]
}
```

**Response:**
```json
{
  "results": [
    {
      "cardId": "unique-id-1",
      "success": true,
      "price": 1.99,
      "source": "cardkingdom",
      "cardName": "Lightning Bolt",
      "timestamp": "2024-01-01T12:00:00.000Z"
    },
    {
      "cardId": "unique-id-2",
      "success": false,
      "price": null,
      "source": "coolstuffinc",
      "cardName": "Counterspell",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "error": "Card not found"
    }
  ]
}
```

## Notes

- Rate limiting is implemented between requests to avoid overwhelming target websites
- The scraper searches for exact card names and set codes
- Prices may not always be available for all cards
- HTML selectors may need periodic updates if target websites change their structure
