#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}MTG Card Manager - Setup Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if MongoDB is running
echo -e "${YELLOW}Checking MongoDB...${NC}"
if command -v mongosh &> /dev/null || command -v mongo &> /dev/null; then
    echo -e "${GREEN}✓ MongoDB client found${NC}"
    
    # Try to connect
    if mongosh --eval "db.version()" --quiet 2>/dev/null || mongo --eval "db.version()" --quiet 2>/dev/null; then
        echo -e "${GREEN}✓ MongoDB is running${NC}"
    else
        echo -e "${RED}✗ MongoDB is not running${NC}"
        echo -e "${YELLOW}Please start MongoDB with one of these commands:${NC}"
        echo "  - macOS: brew services start mongodb-community@7.0"
        echo "  - Linux: sudo systemctl start mongod"
        echo "  - Docker: docker run -d --name mtg-mongodb -p 27017:27017 mongo:7.0"
        exit 1
    fi
else
    echo -e "${RED}✗ MongoDB not found${NC}"
    echo -e "${YELLOW}Please install MongoDB. See MONGODB_SETUP.md for instructions.${NC}"
    echo ""
    echo "Quick install options:"
    echo "  - macOS: brew tap mongodb/brew && brew install mongodb-community@7.0"
    echo "  - Docker: docker run -d --name mtg-mongodb -p 27017:27017 mongo:7.0"
    echo "  - Cloud: Sign up for MongoDB Atlas (free tier)"
    exit 1
fi

echo ""

# Check if .env exists in server directory
echo -e "${YELLOW}Checking environment configuration...${NC}"
if [ -f "server/.env" ]; then
    echo -e "${GREEN}✓ server/.env exists${NC}"
    
    # Check if required variables are set
    if grep -q "GOOGLE_CLIENT_ID=your_google_client_id_here" server/.env; then
        echo -e "${YELLOW}⚠ Google OAuth credentials not configured${NC}"
        echo -e "${YELLOW}  Please update server/.env with your credentials${NC}"
        echo -e "${YELLOW}  See AUTHENTICATION_SETUP.md for instructions${NC}"
    else
        echo -e "${GREEN}✓ Google OAuth credentials configured${NC}"
    fi
    
    if grep -q "MONGODB_URI" server/.env; then
        echo -e "${GREEN}✓ MongoDB URI configured${NC}"
    else
        echo -e "${YELLOW}⚠ MONGODB_URI not found in .env${NC}"
    fi
else
    echo -e "${RED}✗ server/.env not found${NC}"
    echo -e "${YELLOW}Creating from template...${NC}"
    cp server/.env.example server/.env
    echo -e "${GREEN}✓ Created server/.env${NC}"
    echo -e "${YELLOW}⚠ Please edit server/.env with your configuration${NC}"
    echo -e "${YELLOW}  See AUTHENTICATION_SETUP.md for Google OAuth setup${NC}"
fi

echo ""

# Check if dependencies are installed
echo -e "${YELLOW}Checking dependencies...${NC}"

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
fi

if [ -d "server/node_modules" ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${YELLOW}Installing backend dependencies...${NC}"
    cd server && npm install && cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Setup Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Configure Google OAuth credentials in server/.env (see AUTHENTICATION_SETUP.md)"
echo "2. Start the backend: cd server && npm start"
echo "3. Start the frontend (in new terminal): npm run dev"
echo "4. Open http://localhost:5173 in your browser"
echo ""
echo -e "${YELLOW}Documentation:${NC}"
echo "  - MONGODB_SETUP.md - MongoDB installation guide"
echo "  - AUTHENTICATION_SETUP.md - Google OAuth setup guide"
echo "  - server/README.md - API documentation"
echo ""
