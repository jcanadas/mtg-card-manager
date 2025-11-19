import express from 'express';
import { Wishlist, Deck, Purchase } from './models.js';
import { requireAuth } from './auth.js';

const router = express.Router();

// Wishlist routes
router.get('/wishlist', requireAuth, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.id, cards: [] });
    }
    res.json(wishlist.cards);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

router.post('/wishlist', requireAuth, async (req, res) => {
  try {
    const { card } = req.body;
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) {
      wishlist = await Wishlist.create({ userId: req.user.id, cards: [card] });
    } else {
      wishlist.cards.push(card);
      await wishlist.save();
    }
    res.json(wishlist.cards);
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

router.put('/wishlist/:scryfallId', requireAuth, async (req, res) => {
  try {
    const { scryfallId } = req.params;
    const updates = req.body;

    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    const cardIndex = wishlist.cards.findIndex(c => c.scryfallId === scryfallId);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found' });
    }

    wishlist.cards[cardIndex] = { ...wishlist.cards[cardIndex].toObject(), ...updates };
    await wishlist.save();
    res.json(wishlist.cards);
  } catch (error) {
    console.error('Error updating card:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

router.delete('/wishlist/:scryfallId', requireAuth, async (req, res) => {
  try {
    const { scryfallId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist not found' });
    }

    wishlist.cards = wishlist.cards.filter(c => c.scryfallId !== scryfallId);
    await wishlist.save();
    res.json(wishlist.cards);
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Deck routes
router.get('/decks', requireAuth, async (req, res) => {
  try {
    const decks = await Deck.find({ userId: req.user.id });
    res.json(decks);
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

router.post('/decks', requireAuth, async (req, res) => {
  try {
    const { name, url, colorIdentity, cards } = req.body;
    const deck = await Deck.create({
      userId: req.user.id,
      name,
      url,
      colorIdentity,
      cards
    });
    res.json(deck);
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({ error: 'Failed to create deck' });
  }
});

router.get('/decks/:id', requireAuth, async (req, res) => {
  try {
    const deck = await Deck.findOne({ _id: req.params.id, userId: req.user.id });
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    res.json(deck);
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ error: 'Failed to fetch deck' });
  }
});

router.put('/decks/:id/cards/:scryfallId', requireAuth, async (req, res) => {
  try {
    const { id, scryfallId } = req.params;
    const updates = req.body;

    const deck = await Deck.findOne({ _id: id, userId: req.user.id });
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }

    const cardIndex = deck.cards.findIndex(c => c.scryfallId === scryfallId);
    if (cardIndex === -1) {
      return res.status(404).json({ error: 'Card not found' });
    }

    deck.cards[cardIndex] = { ...deck.cards[cardIndex].toObject(), ...updates };
    await deck.save();
    res.json(deck);
  } catch (error) {
    console.error('Error updating deck card:', error);
    res.status(500).json({ error: 'Failed to update card' });
  }
});

router.delete('/decks/:id', requireAuth, async (req, res) => {
  try {
    const result = await Deck.deleteOne({ _id: req.params.id, userId: req.user.id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ error: 'Failed to delete deck' });
  }
});

// Purchase routes
router.get('/purchases', requireAuth, async (req, res) => {
  try {
    let purchases = await Purchase.findOne({ userId: req.user.id });
    if (!purchases) {
      purchases = await Purchase.create({ userId: req.user.id, cards: [] });
    }
    res.json(purchases.cards);
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
});

router.post('/purchases', requireAuth, async (req, res) => {
  try {
    const { card } = req.body;
    let purchases = await Purchase.findOne({ userId: req.user.id });
    if (!purchases) {
      purchases = await Purchase.create({ userId: req.user.id, cards: [card] });
    } else {
      purchases.cards.push(card);
      await purchases.save();
    }
    res.json(purchases.cards);
  } catch (error) {
    console.error('Error adding purchase:', error);
    res.status(500).json({ error: 'Failed to add purchase' });
  }
});

router.delete('/purchases/:scryfallId', requireAuth, async (req, res) => {
  try {
    const { scryfallId } = req.params;

    const purchases = await Purchase.findOne({ userId: req.user.id });
    if (!purchases) {
      return res.status(404).json({ error: 'Purchases not found' });
    }

    purchases.cards = purchases.cards.filter(c => c.scryfallId !== scryfallId);
    await purchases.save();
    res.json(purchases.cards);
  } catch (error) {
    console.error('Error removing purchase:', error);
    res.status(500).json({ error: 'Failed to remove purchase' });
  }
});

export default router;
