// MongoDB initialization script for production
db = db.getSiblingDB('admin');

// Create application user
db.createUser({
  user: process.env.MONGO_APP_USER || 'mtgapp',
  pwd: process.env.MONGO_APP_PASSWORD,
  roles: [
    {
      role: 'readWrite',
      db: 'mtg-card-manager'
    }
  ]
});

// Switch to application database
db = db.getSiblingDB('mtg-card-manager');

// Create indexes for better performance
db.wishlists.createIndex({ userId: 1 });
db.decks.createIndex({ userId: 1 });
db.purchases.createIndex({ userId: 1 });
db.wishlists.createIndex({ userId: 1, 'cards.scryfallId': 1 });

print('MongoDB initialization complete');
