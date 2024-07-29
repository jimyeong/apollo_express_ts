import express from "express";
import cors from "cors";
import http from "http";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { buildContext } from "graphql-passport";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import Friend from "./db/Friends.js";
import Todo from "./db/Todos.js";
import User from "./db/Users.js";
import "dotenv/config";
import { verify } from "./authentication/googleAuthentication.js";
import cookieParser from "cookie-parser";
import { OAuth2Client } from "google-auth-library";
const app = express();
const httpServer = http.createServer(app);
const typeDefs = `#graphql
    scalar GraphQLDateTime

    input TodoInput {
        id:ID
        ownerId: Int
        task: String
        urgency: Int
        importance: Int
    }
    type Todo {
        id:ID
        ownerId: Int
        task: String
        urgency: Int
        importance: Int
        createdAt: GraphQLDateTime
        updatedAt: GraphQLDateTime
        taskId: Int
    }
    type User{
      googleId:String!
      name: String!
      email: String!
      picture: String!
      given_name: String!
      family_name: String!
    }
    type Mutation {
        createTask(input: TodoInput ): Todo
        removeTask(id: ID): Todo
        updateTask(input: TodoInput): Todo

    }
    type AuthResponse {
      accessToken: String!
      refreshToken: String!
    }
    type User {
            firstName: String
            lastName: String
            tel: String
            avatar: String
            nationality: String
            gender: Gender
            description: String
            email: String
            todos:[Todo]!
        }
    type Query{
        getUser : [User]!
        getTodoList : [Todo]!
        searchUsers(keyword: String):[User]!
        googleOAuth(accessToken: String):User
    }
    enum Gender{
        MALE
        FEMALE
        OTHER
    }
`;
const resolvers = {
  Query: {
    getTodoList: async () => {
      return new Promise(async (res, rej) => {
        try {
          const todos = await Todo.find();
          console.log("@@todos", todos);
          res(todos);
        } catch (err) {
          console.log("fail", err);
          rej(err);
        }
      });
    },
    searchUsers: async (root, { keyword }) => {
      return new Promise(async (res, rej) => {
        if (!keyword) res([]);
        try {
          const friends = await Friend.find({
            firstName: { $regex: keyword, $options: "i" },
          });
          res(friends);
        } catch (error) {
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
        } catch (error) {
          rej(error);
        }
      });
    },
    googleOAuth: async (_, variables, ctx) => {
      const { accessToken } = variables;
      const { models, req, res } = ctx;
      console.log("@variables", variables);
      await verify(req, res, accessToken);
      console.log("@@req.user", req.user);
      return req.user ? req.user : { message: "user doesn't exist" };
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
          res(updated);
        } catch (error) {
          rej(error);
        }
      });
    },
    removeTask: (root, { taskId, id }) => {
      return new Promise(async (res, rej) => {
        try {
          const filter = {
            _id: id,
          };
          // const removedItem = Todo.find({ where: {taskId: taskId} });
          const deletedItem = await Todo.findOneAndDelete(filter);
          console.log("@@ has it been found? ", deletedItem);
          res(deletedItem);
        } catch (err) {
          rej(err);
        }
      });
    },
    createTask: (root, { input }) => {
      const { ownerId, task, urgency, importance } = input;
      const newTodo = new Todo({ ownerId, task, urgency, importance });
      newTodo.id = newTodo._id;
      return new Promise((res, rej) => {
        newTodo
          .save()
          .then((success) => res(success))
          .catch((fail) => rej(fail));
      });
    },
  },
};
const apolloServer = new ApolloServer({
  resolvers,
  typeDefs,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  introspection: true,
});
await apolloServer.start();
mongoose
  .connect(process.env.DB_HOST)
  .then((res) => {
    console.log("mongodb is connected successfully");
  })
  .catch((rej) => {
    console.log("db is not connected");
  });
const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
const __dirname = path.dirname(__filename); // get the name of the directory
app.use(express.static(__dirname + "/public"));
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/auth/google", async (req, res, next) => {
  const client = new OAuth2Client();
  const ticket = await client.verifyIdToken({
    idToken: req.body.accessToken,
    audience: process.env.OAUTH_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
  });
  const payload = ticket.getPayload();
  const userid = payload["sub"];
  req.user = { userid, payload };
  res.cookie("token", req.body.accessToken, {
    sameSite: true,
    httpOnly: true,
  });
  res.status(200).json({
    message: "ok",
    code: "200",
    payload,
  });
});
app.use(verify);
app.use(
  "/graphql",
  cors({ origin: "http://localhost:3000", credentials: true }),
  expressMiddleware(apolloServer, {
    context: async ({ req, res }) => {
      console.log("hello world@@@@@@@@@@", req.cookies);
      if (req.cookies.token) {
        return buildContext({
          req,
          res,
          models: { User, Friend },
        });
      }
    },
  })
);
app.use((err, req, res, next) => {
  console.log("Where is the error: message: ", err.message);
  res.status(500).json({ message: err.message });
});
await new Promise((res, rej) => {
  if (res) {
    console.log(`The server is running on the port ${process.env.PORT}`);
    return httpServer.listen({ port: process.env.PORT }, res);
  }
});
