import express from 'express'
import cors from 'cors'
import axios from 'axios'
import * as cheerio from 'cheerio'
import https from 'https'
import session from 'express-session'
import passport from 'passport'
import dotenv from 'dotenv'
import { setupAuth, requireAuth } from './auth.js'
import connectDB from './db.js'
import apiRoutes from './routes.js'

// Load environment variables
dotenv.config()

// Connect to MongoDB
connectDB()

const app = express()
const PORT = process.env.PORT || 3001
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Configure CORS to allow credentials
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}))

app.use(express.json())

// Setup session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}))

// Initialize Passport
app.use(passport.initialize())
app.use(passport.session())

// Setup authentication
setupAuth({
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  port: PORT
})

// API routes for user data
app.use('/api', apiRoutes)

// Create axios instance with SSL verification disabled for development
const axiosInstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
})

// Rate limiting to be respectful
const rateLimitDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Scrape Card Kingdom price
async function scrapeCardKingdom(cardName, setCode) {
  try {
    // Clean up card name for search
    const searchQuery = encodeURIComponent(cardName)
    const url = `https://www.cardkingdom.com/catalog/search?search=header&filter%5Bname%5D=${searchQuery}`

    const response = await axiosInstance.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const $ = cheerio.load(response.data)

    // Card Kingdom's structure - this is approximate and may need adjustment
    let price = null
    $('.productItemWrapper').each((i, elem) => {
      const name = $(elem).find('.productDetailTitle').text().trim()
      if (name.toLowerCase().includes(cardName.toLowerCase())) {
        const priceText = $(elem).find('.stylePrice').first().text()
        const match = priceText.match(/\$?(\d+\.?\d*)/)
        if (match) {
          price = parseFloat(match[1])
          return false // break
        }
      }
    })

    return price
  } catch (error) {
    console.error('Error scraping Card Kingdom:', error.message)
    return null
  }
}

// Scrape CoolStuffInc price
async function scrapeCoolStuffInc(cardName, setCode) {
  try {
    const searchQuery = encodeURIComponent(cardName)
    const url = `https://www.coolstuffinc.com/main_search.php?pa=searchOnName&page=1&q=${searchQuery}`

    const response = await axiosInstance.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const $ = cheerio.load(response.data)

    // CoolStuffInc's structure - this is approximate and may need adjustment
    let price = null
    $('.deckdbbody, .product').each((i, elem) => {
      const name = $(elem).find('.card_name, .product-name').text().trim()
      if (name.toLowerCase().includes(cardName.toLowerCase())) {
        const priceText = $(elem).find('.price, .product-price').first().text()
        const match = priceText.match(/\$?(\d+\.?\d*)/)
        if (match) {
          price = parseFloat(match[1])
          return false // break
        }
      }
    })

    return price
  } catch (error) {
    console.error('Error scraping CoolStuffInc:', error.message)
    return null
  }
}

// Endpoint to scrape a single card
app.post('/api/scrape-price', async (req, res) => {
  const { cardName, setCode, source, isFoil } = req.body

  if (!cardName || !source) {
    return res.status(400).json({ error: 'cardName and source are required' })
  }

  try {
    let price = null

    if (source === 'cardkingdom') {
      price = await scrapeCardKingdom(cardName, setCode)
      await rateLimitDelay(1000) // 1 second delay between requests
    } else if (source === 'coolstuffinc') {
      price = await scrapeCoolStuffInc(cardName, setCode)
      await rateLimitDelay(1000) // 1 second delay between requests
    } else {
      return res.status(400).json({ error: 'Invalid source. Use "cardkingdom" or "coolstuffinc"' })
    }

    res.json({
      success: price !== null,
      price,
      source,
      cardName,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Endpoint to scrape multiple cards
app.post('/api/scrape-prices-bulk', async (req, res) => {
  const { cards } = req.body // array of { cardName, setCode, source }

  if (!Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: 'cards array is required' })
  }

  const results = []

  for (const card of cards) {
    try {
      let price = null

      if (card.source === 'cardkingdom') {
        price = await scrapeCardKingdom(card.cardName, card.setCode)
      } else if (card.source === 'coolstuffinc') {
        price = await scrapeCoolStuffInc(card.cardName, card.setCode)
      }

      results.push({
        cardId: card.cardId,
        cardName: card.cardName,
        source: card.source,
        price,
        success: price !== null
      })

      // Rate limit: wait between requests
      await rateLimitDelay(1500)
    } catch (error) {
      results.push({
        cardId: card.cardId,
        cardName: card.cardName,
        source: card.source,
        price: null,
        success: false,
        error: error.message
      })
    }
  }

  res.json({
    results,
    timestamp: new Date().toISOString()
  })
})

// Moxfield API proxy endpoint to avoid CORS issues
app.get('/api/moxfield/:deckId', async (req, res) => {
  try {
    const { deckId } = req.params
    const response = await axiosInstance.get(`https://api2.moxfield.com/v2/decks/all/${deckId}`)
    res.json(response.data)
  } catch (error) {
    console.error('Error fetching Moxfield deck:', error.message)
    res.status(error.response?.status || 500).json({
      error: 'Failed to fetch deck from Moxfield',
      message: error.message
    })
  }
})

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Authentication routes
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: FRONTEND_URL }),
  (req, res) => {
    // Successful authentication, redirect to frontend
    res.redirect(FRONTEND_URL)
  }
)

app.get('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' })
    }
    res.json({ success: true })
  })
})

app.get('/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ user: req.user })
  } else {
    res.status(401).json({ user: null })
  }
})

app.listen(PORT, () => {
  console.log(`Scraping server running on http://localhost:${PORT}`)
})
