import passport from 'passport';
import jwt from '../middlewares/passport/JwtStrategy.js';
import google from '../middlewares/passport/GoogleStrategy.js';

passport.use('access-token', jwt.accessTokenStrategy);
passport.use('refresh-token', jwt.refreshTokenStrategy);
passport.use('google', google._strategies.google);

export default passport;
