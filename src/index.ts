import express from "express";
import cors from "cors";
import http, { createServer } from "http";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { buildContext } from "graphql-passport";
import path from "path";
import { fileURLToPath } from "url";
import mongoose, { models } from "mongoose";
import Friend from "./db/Friends.js";
import Todo, { todoScheme } from "./db/Todos.js";
import User from "./db/Users.js";
import "dotenv/config";
import { verify } from "./authentication/googleAuthentication.js";
import cookieParser from "cookie-parser";
import { OAuth2Client } from "google-auth-library";
import { errorsHandler } from "./handlers/errorsHandler.js";

import { makeExecutableSchema } from "@graphql-tools/schema";
import { useServer } from "graphql-ws/lib/use/ws";
import { typeDefs } from "./typeDefs/typeDefs.js";
import { resolvers } from "./resolvers/resolvers.js";

import { WebSocketServer } from "ws";

const client = new OAuth2Client();
const app = express();
const httpServer = createServer(app);

// A number that we'll increment over time to simulate subscription events
const schema = makeExecutableSchema({ typeDefs, resolvers });

// subscription connection
const wsServer = new WebSocketServer({
  server: httpServer,
  path: "/subscription",
});
// Save the returned server's info so we can shutdown this server later
const serverCleanup = useServer({ schema }, wsServer);

const apolloServer = new ApolloServer({
  schema,
  plugins: [
    ApolloServerPluginDrainHttpServer({ httpServer }),
    {
      async serverWillStart() {
        return {
          async drainServer() {
            await serverCleanup.dispose();
          },
        };
      },
    },
  ],
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
    // maxExpiry: 1,
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

app.use(
  "/graphql",
  expressMiddleware(apolloServer, {
    context: async ({ req, res }) => {
      if (!req.cookies.token) {
        errorsHandler("401");
      } else {
        try {
          const ticket = await client.verifyIdToken({
            idToken: req.cookies.token,
            audience: process.env.OAUTH_CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
          });
          req.body.user = ticket.getPayload();

          return buildContext({
            req,
            res,
            models: { User, Friend },
          });
        } catch (error) {
          errorsHandler("401", error.message);
        }
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
    return httpServer.listen({ port: process.env.PORT }, res as any);
  }
});
