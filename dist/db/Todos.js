import mongoose from "mongoose";
export const todoScheme = new mongoose.Schema({
    ownerId: {
        type: Number,
    },
    taskId: {
        type: Number,
    },
    task: {
        type: String,
    },
    urgency: {
        type: Number,
    },
    importance: {
        type: Number,
    },
    colour: {
        type: String,
    },
}, { timestamps: true });
const Todo = mongoose.model("Todo", todoScheme);
export default Todo;
