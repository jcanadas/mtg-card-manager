import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema({
  scryfallId: { type: String, required: true },
  name: { type: String, required: true },
  set: String,
  collectorNumber: String,
  imageUrl: String,
  prices: {
    usd: Number,
    usd_foil: Number
  },
  isFoil: Boolean,
  orderedFrom: String,
  orderedAt: Date,
  receivedAt: Date,
  purchasePrice: Number
}, { _id: false });

const wishlistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  cards: [cardSchema]
}, {
  timestamps: true
});

const deckSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  colorIdentity: [String],
  cards: [cardSchema]
}, {
  timestamps: true
});

const purchaseSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  cards: [cardSchema]
}, {
  timestamps: true
});

const Wishlist = mongoose.model('Wishlist', wishlistSchema);
const Deck = mongoose.model('Deck', deckSchema);
const Purchase = mongoose.model('Purchase', purchaseSchema);

export {
  Wishlist,
  Deck,
  Purchase
};
