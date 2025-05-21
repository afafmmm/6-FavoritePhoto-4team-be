import passport from "passport";
import jwt from "../middlewares/passport/JwtStrategy.js";

passport.use("access-token", jwt.accessTokenStrategy);
passport.use("refresh-token", jwt.refreshTokenStrategy);

export default passport;
