import { OAuth2Client } from "google-auth-library";
const client = new OAuth2Client();
async function verify(req, res, next) {
    console.log("@@@@req.cookies", req.cookies);
    const token = req.cookies.token;
    if (!token) {
        const error = new Error("code:401");
        next(error);
    }
    if (token) {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.OAUTH_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
        });
        const payload = ticket.getPayload();
        const userid = payload["sub"];
        req.user = { userid, payload };
        console.log("@@userId", payload);
        next();
    }
    // next(userid);
}
export { verify };
