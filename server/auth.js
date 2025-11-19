import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

export function setupAuth(config) {
  // Configure Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: config.googleClientId,
        clientSecret: config.googleClientSecret,
        callbackURL: `http://localhost:${config.port}/auth/google/callback`
      },
      (accessToken, refreshToken, profile, done) => {
        // Create user object from Google profile
        const user = {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          displayName: profile.displayName,
          avatar: profile.photos?.[0]?.value
        }
        return done(null, user)
      }
    )
  )

  // Serialize user for session
  passport.serializeUser((user, done) => {
    done(null, user)
  })

  // Deserialize user from session
  passport.deserializeUser((user, done) => {
    done(null, user)
  })

  return passport
}

// Middleware to check if user is authenticated
export function requireAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }
  res.status(401).json({ error: 'Not authenticated' })
}
