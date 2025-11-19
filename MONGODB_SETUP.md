# MongoDB Setup Guide

## Quick Start

### Option 1: Local MongoDB Installation (Recommended for Development)

#### macOS (using Homebrew)
```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb-community@7.0

# Verify MongoDB is running
mongosh
```

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Install MongoDB
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify MongoDB is running
mongosh
```

#### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. MongoDB will start as a Windows Service automatically
4. Verify by opening MongoDB Compass or running `mongosh` in Command Prompt

### Option 2: MongoDB Atlas (Cloud - Free Tier Available)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Create a new cluster (free M0 tier)
4. Configure network access (add your IP or allow from anywhere for development)
5. Create a database user
6. Get your connection string (looks like: `mongodb+srv://username:password@cluster.mongodb.net/mtg-card-manager`)
7. Update your `.env` file with this connection string

### Option 3: Docker (Easiest for Quick Setup)

```bash
# Run MongoDB in a container
docker run -d \
  --name mtg-mongodb \
  -p 27017:27017 \
  -v mtg-mongo-data:/data/db \
  mongo:7.0

# Verify it's running
docker ps

# Connect to MongoDB shell
docker exec -it mtg-mongodb mongosh
```

## Configuration

1. **Copy the environment template:**
   ```bash
   cd server
   cp .env.example .env
   ```

2. **Update your `.env` file:**
   ```env
   # For local MongoDB (default)
   MONGODB_URI=mongodb://localhost:27017/mtg-card-manager
   
   # OR for MongoDB Atlas
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mtg-card-manager
   
   # OR for Docker
   MONGODB_URI=mongodb://localhost:27017/mtg-card-manager
   ```

## Verify Setup

1. **Start your backend server:**
   ```bash
   cd server
   npm start
   ```

2. **Look for this message:**
   ```
   MongoDB connected successfully
   Server running on port 3001
   ```

3. **Test the connection:**
   ```bash
   # Use MongoDB shell
   mongosh
   
   # Switch to your database
   use mtg-card-manager
   
   # Check collections
   show collections
   ```

## Database Structure

Your MTG Card Manager uses three main collections:

### `wishlists`
- Stores user wishlist cards
- Indexed by `userId`
- Schema: `{ userId, cards[], createdAt, updatedAt }`

### `decks`
- Stores user deck information
- Indexed by `userId`
- Schema: `{ userId, name, url, colorIdentity[], cards[], createdAt, updatedAt }`

### `purchases`
- Stores purchased/received cards
- Indexed by `userId`
- Schema: `{ userId, cards[], createdAt, updatedAt }`

## Troubleshooting

### "MongoServerError: Authentication failed"
- Check your username and password in the connection string
- For Atlas: Ensure database user is created and has read/write permissions

### "Error: connect ECONNREFUSED 127.0.0.1:27017"
- MongoDB service is not running
- Start it: `brew services start mongodb-community@7.0` (macOS)
- Or: `sudo systemctl start mongod` (Linux)
- Or: `docker start mtg-mongodb` (Docker)

### "MongooseServerSelectionError"
- Check your `MONGODB_URI` in `.env`
- Ensure MongoDB is accessible at the specified address
- For Atlas: Check network access settings

### Port already in use
```bash
# Find process using port 27017
lsof -i :27017

# Kill the process
kill -9 <PID>
```

## Data Migration from localStorage

If you have existing data in localStorage, it will be isolated per user. The new system:
- Stores data in MongoDB per user ID
- Previous localStorage data remains in the browser (not migrated automatically)
- Each user will start with empty wishlists/decks

To manually migrate data (advanced):
1. Export your localStorage data from browser console
2. Format it according to the schema
3. Import using MongoDB Compass or mongosh

## Production Considerations

For production deployment:

1. **Use MongoDB Atlas** or a managed MongoDB service
2. **Enable authentication:**
   ```env
   MONGODB_URI=mongodb://username:password@host:27017/mtg-card-manager
   ```
3. **Use connection pooling** (already configured in mongoose)
4. **Set up backups** using MongoDB Atlas automated backups
5. **Monitor performance** using MongoDB Atlas monitoring
6. **Enable SSL/TLS** for secure connections

## Useful Commands

```bash
# View all databases
mongosh
show dbs

# Use your database
use mtg-card-manager

# View collections
show collections

# Count documents in wishlist
db.wishlists.countDocuments()

# View all wishlists
db.wishlists.find().pretty()

# Delete all data (careful!)
db.wishlists.deleteMany({})
db.decks.deleteMany({})
db.purchases.deleteMany({})

# View indexes
db.wishlists.getIndexes()

# Database stats
db.stats()
```

## Need Help?

- MongoDB Documentation: https://docs.mongodb.com/
- Mongoose Documentation: https://mongoosejs.com/
- MongoDB University (Free Courses): https://university.mongodb.com/
