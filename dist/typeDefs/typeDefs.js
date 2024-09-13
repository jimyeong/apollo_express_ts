export const typeDefs = `#graphql
    scalar GraphQLDateTime


    input TodoInput {
        id:String
        ownerId: String
        task: String
        urgency: Int
        importance: Int
    }
    type ErrorMessage{
        code: Int
        message: String
    }
    type Todo {
        id:ID
        ownerId: String
        task: String
        urgency: Int
        importance: Int
        createdAt: GraphQLDateTime
        updatedAt: GraphQLDateTime
        taskId: Int
        colour: String
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
        removeTask(id: String): Todo
        updateTask(input: TodoInput): Todo
    }
    type Subscription{
      taskUpdated: Todo
      taskCreated: Todo
      taskRemoved: Todo
      errorMessage: String
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
