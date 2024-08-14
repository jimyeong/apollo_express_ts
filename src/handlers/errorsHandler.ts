import { GraphQLError } from "graphql";

export const errorsHandler = (code: string, message?: string) => {
  switch (code) {
    case "401":
      throw new GraphQLError(
        message || "You are not authorized to perform this action.",
        {
          extensions: {
            code: "FORBIDDEN",
            statusCode: 401,
          },
        }
      );
    default:
      throw new GraphQLError(message || "Internal Server Error", {
        extensions: {
          statusCode: 500,
          code: "INTERNAL_SERVER_ERROR",
        },
      });
  }
};
