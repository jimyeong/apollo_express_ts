import mongoose from "mongoose";

export const friendScheme = new mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  gender: {
    type: String,
  },
  age: {
    type: Number,
  },
  language: {
    type: String,
  },
  email: {
    type: String,
  },
  contact: {
    type: String,
  },
});

const Friend = mongoose.model("Friend", friendScheme);
export default Friend;
