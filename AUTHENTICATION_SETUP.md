# Google Authentication Setup for MTG Card Manager

## Overview
Your MTG Card Manager now includes Google OAuth authentication to secure user data and provide personalized wishlists.

## Setup Instructions

### 1. Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:5173`
   - Add authorized redirect URIs:
     - `http://localhost:3001/auth/google/callback`
   - Click "Create"

5. Copy your Client ID and Client Secret

### 2. Configure Environment Variables

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Create a `.env` file from the example:
   ```bash
   cp .env.example .env
   ```

3. Edit `.env` and add your credentials:
   ```env
   GOOGLE_CLIENT_ID=your_actual_client_id_here
   GOOGLE_CLIENT_SECRET=your_actual_client_secret_here
   SESSION_SECRET=generate_a_random_string_here
   PORT=3001
   FRONTEND_URL=http://localhost:5173
   MONGODB_URI=mongodb://localhost:27017/mtg-card-manager
   ```

   To generate a secure session secret, you can use:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   **MongoDB URI options:**
   - Local: `mongodb://localhost:27017/mtg-card-manager`
   - Docker: `mongodb://localhost:27017/mtg-card-manager`
   - Atlas: `mongodb+srv://username:password@cluster.mongodb.net/mtg-card-manager`
   
   See [MONGODB_SETUP.md](MONGODB_SETUP.md) for MongoDB installation.

### 3. Start the Application

1. **Start the backend server** (from the server directory):
   ```bash
   npm start
   ```

2. **Start the frontend** (from the root directory):
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

4. Click "Sign in with Google" to authenticate

## Features

- **Secure Authentication**: Users must log in with Google to access the application
- **User Sessions**: Sessions persist for 24 hours
- **Protected Routes**: All wishlist and purchase history pages require authentication
- **Logout**: Users can securely log out from the user menu

## Important Security Notes

- Never commit your `.env` file to version control
- In production, use HTTPS and set `secure: true` for cookies
- Generate strong, unique session secrets
- Consider implementing additional security measures like CSRF protection

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- Ensure `http://localhost:3001/auth/google/callback` is added to your authorized redirect URIs in Google Cloud Console

### "Cannot find module" errors
- Make sure all dependencies are installed:
  ```bash
  cd server && npm install
  cd .. && npm install
  ```

### Session not persisting
- Check that your browser accepts cookies
- Verify `SESSION_SECRET` is set in your `.env` file

## Next Steps

To make this production-ready, consider:

1. **Database Integration**: Store user data in a database instead of localStorage
2. **User-specific Data**: Associate wishlists and decks with user IDs
3. **HTTPS**: Use HTTPS in production
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Error Handling**: Implement comprehensive error handling
6. **Environment Configuration**: Use different configs for dev/staging/production
