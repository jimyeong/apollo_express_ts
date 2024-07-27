import mongoose from "mongoose";

export const userScheme = new mongoose.Schema({
  email: {
    type: String,
  },
  googleId: {
    type: String,
  },
  name: {
    type: String,
  },
});
const User = mongoose.model("User", userScheme);
export default User;
