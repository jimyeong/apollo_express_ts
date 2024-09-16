import Todo from "../db/Todos.js";
import Friend from "../db/Friends.js";
import { verify } from "../authentication/googleAuthentication.js";
import { noteColours } from "../constants/colours.js";
import { PubSub } from "graphql-subscriptions";
const pubSub = new PubSub();
export const resolvers = {
    Query: {
        getTodoList: async () => {
            return new Promise(async (res, rej) => {
                try {
                    const todos = await Todo.find();
                    res(todos);
                }
                catch (err) {
                    rej(err);
                }
            });
        },
        searchUsers: async (root, { keyword }) => {
            return new Promise(async (res, rej) => {
                if (!keyword)
                    res([]);
                try {
                    const friends = await Friend.find({
                        firstName: { $regex: keyword, $options: "i" },
                    });
                    res(friends);
                }
                catch (error) {
                    rej(error);
                }
            });
        },
        getUser: async () => {
            return new Promise(async (res, rej) => {
                try {
                    const friends = await Friend.aggregate([
                        {
                            $lookup: {
                                from: "todos",
                                localField: "userId",
                                foreignField: "ownerId",
                                as: "todos",
                            },
                        },
                    ]).exec();
                    res(friends);
                }
                catch (error) {
                    rej(error);
                }
            });
        },
        googleOAuth: async (_, variables, ctx) => {
            const { accessToken } = variables;
            const { models, req, res } = ctx;
            await verify(req, res, accessToken);
            return req.user ? req.user : { message: "user doesn't exist" };
        },
    },
    Subscription: {
        taskUpdated: {
            subscribe: () => {
                return pubSub.asyncIterator("TASK_UPDATED");
            },
        },
        taskRemoved: {
            subscribe: () => pubSub.asyncIterator(["TASK_REMOVED"]),
        },
        taskCreated: {
            subscribe: () => pubSub.asyncIterator(["TASK_CREATED"]),
        },
    },
    Mutation: {
        updateTask: (root, { input }) => {
            const { id, task, urgency, importance } = input;
            return new Promise(async (res, rej) => {
                const filter = {
                    _id: id,
                };
                const update = {
                    task,
                    urgency,
                    importance,
                };
                try {
                    const updated = await Todo.findOneAndUpdate(filter, update);
                    // pubSub.publish("POST_UPDATED", updated);
                    const newTask = { ...updated, task, urgency, importance };
                    pubSub.publish("TASK_UPDATED", {
                        // the key name becomes the address of the subscription
                        taskUpdated: newTask,
                    });
                    res(updated);
                    // return updated;
                }
                catch (error) {
                    pubSub.publish("MESSAGE", { errorMessage: { ...error } });
                    rej(error);
                }
            });
        },
        removeTask: (root, variables) => {
            const { id } = variables;
            return new Promise(async (res, rej) => {
                try {
                    const filter = {
                        _id: id,
                    };
                    // const removedItem = Todo.find({ where: {taskId: taskId} });
                    const deletedItem = await Todo.findOneAndDelete(filter);
                    // pubSub.publish("POST_REMOVED", { postRemoved: { ...deletedItem } });
                    console.log("@@deletedItem", deletedItem);
                    pubSub.publish("TASK_REMOVED", { taskRemoved: deletedItem });
                    return deletedItem;
                }
                catch (error) {
                    pubSub.publish("MESSAGE", { errorMessage: { ...error } });
                    rej(error);
                }
            });
        },
        createTask: (root, { input }) => {
            const { ownerId, task, urgency, importance } = input;
            const notesNum = noteColours.length;
            const noteColourIndex = Math.floor(Math.random() * notesNum);
            const newTodo = new Todo({
                ownerId,
                task,
                urgency,
                importance,
                colour: noteColours[noteColourIndex],
            });
            newTodo.id = newTodo._id;
            return new Promise((res, rej) => {
                newTodo
                    .save()
                    .then((success) => {
                    pubSub.publish("TASK_CREATED", { postCreated: { ...success } });
                    res(success);
                })
                    .catch((fail) => {
                    pubSub.publish("MESSAGE", { errorMessage: { ...fail } });
                    rej(fail);
                });
            });
        },
    },
};
