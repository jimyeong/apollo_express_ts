import passport from "passport";
// import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import OAuth2Strategy from "passport-oauth2";
import User from "../db/Users.js";
passport.use(new OAuth2Strategy({
    clientID: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/",
    authorizationURL: "http://localhost:3000/",
    tokenURL: "http://localhost:3000/",
}, (accessToken, refreshToken, profile, cb) => {
    console.log("accessToken", accessToken);
    console.log("refreshToken", refreshToken);
    console.log("@@profile", profile);
    // Here you can validate the access token and fetch user data from Google APIs
    // For simplicity, we'll just return the profile data
    cb(null, profile);
    try {
        const user = User.findOneAndUpdate({ email: profile.id }, {
            googleId: profile.id,
            email: profile.id,
            name: profile.name,
        }, { upsert: true });
        cb(null, user);
    }
    catch (error) {
        cb(error, null);
    }
}));
passport.serializeUser((user, done) => {
    done(null, user);
});
// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.OAUTH_CLIENT_ID,
//       clientSecret: "",
//       callbackURL: "http://localhost:3000/dashboard",
//     },
//   )
// );
// export const authenticateGoogle = (req, res) => {
//   return new Promise((res, rej) => {
//     passport.authenticate(
//       "google",
//       { scope: ["profile"], session: false },
//       (err, data, info) => {
//         if (err) {
//           console.log("@@@googleOuath, ", err);
//           rej(err);
//         }
//         console.log("@@@what is this, data, ", data);
//         console.log("@@@what is this, info, ", info);
//         res({ data, info });
//       }
//     )(req, res);
//   });
// };
// Create a middleware function that authenticates a user with a Google access token
// const authenticateGoogle = (req, res) =>
//   new Promise((resolve, reject) => {
//     console.log("@@excuted");
//     const a = passport.authenticate(
//       "google",
//       { scope: ["profile"] },
//       (error, data, info) => {
//         console.log("@@@inside of the function");
//         if (error) reject(error);
//         resolve(data);
//       }
//     );
//     console.log("@@@aa", a);
//     a(req, res);
//   });
export { passport };
