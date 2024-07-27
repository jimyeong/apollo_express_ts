import express from "express";
import cors from "cors";
import http from "http";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { buildContext } from "graphql-passport";

import mongoose from "mongoose";
import Friend from "./db/Friends.js";
import Todo, { todoScheme } from "./db/Todos.js";
import User from "./db/Users.js";
import "dotenv/config";
import { passport } from "./strategy/googleOauth.js";

const app = express();
app.use(passport.initialize());
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
    }
    type Mutation {
        createTask(input: TodoInput ): Todo
        removeTask(id: ID): Todo
        updateTask(input: TodoInput): Todo
        signUpGoogle(accessToken: String!): AuthResponse
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
      console.log("@@@hello is it coming here");
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
      console.log("@@@kleyword", keyword);
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
  },
  Mutation: {
    signUpGoogle: async (_, variables, ctx) => {
      const { accessToken } = variables;
      console.log("@@@hello", accessToken);
      const { models, req, res } = ctx;
      // renpose config
      req.body = {
        ...req.body,
        access_token: accessToken,
      };

      // set the type later
      // const result = (await authenticateGoogle(req, res)) as any;
      await passport.authenticate(
        "oauth2",
        {
          session: false,
        },
        (err, user) => {
          console.log("@@@err", err);
          console.log("@@@user", user);
        }
      )(req, res);
      console.log("@@result", req.user);

      // const { data, info } = result();

      // const user = await User.findOneAndUpdate({ email }, { upsert: true });
      models.User as typeof User;
    },

    updateTask: (root, { input }) => {
      console.log("@@what is this", root);
      const { id, task, urgency, importance } = input;
      console.log("@@", id, task);
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
          console.log("@@@@updated??", updated);
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

app.use(
  "/graphql",
  cors<cors.CorsRequest>({ origin: ["http://localhost:3000"] }),
  express.json(),
  express.urlencoded({ extended: false }),
  expressMiddleware(apolloServer, {
    context: async ({ req, res }) => {
      return buildContext({
        req,
        res,
        models: { User, Friend },
      });
    },
  })
);

await new Promise((res, rej) => {
  if (res) {
    console.log(`The server is running on the port ${process.env.PORT}`);
    return httpServer.listen({ port: process.env.PORT }, res as any);
  }
});
