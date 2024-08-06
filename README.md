## ERRORS I came across

Typescript
When module is not found after compiled?
=> When you were not adding the name of the file extension, your module system can't find it, because if you omit it, bascially it is "ts" but once compiled they are "js"

Actually, before I thought it was quite easy to cross over to GraphQL, and Typescript with Google Authentication.
But Now, It seems it's quite difficult.

1. How to set up cookies
2. How to use middleware, How to seperate the cases (when having cookies or not).
3.

When user doens't have a token, they should see the login page. they are to see the login page otherwise, they use their token in the cookies

2. why cookie hasn't come up in the application panel,
   it was solved when added, credential: "included"

// you can save not sensitive information in local storage.

a good place for saving jwt-tokens.
Cookie is a good place for tokens but with some settings together (sameSite, httpOnly, secure true)
But in React, I was having concerns about user information.
But I think their name and pictures are bascially not credential info, but a jwt-token is.

So, you can save them in the local storage.
I checked Airbnb website is holding user's picture in the localstorage.

I feel like, I know nothing lol.
Even if I am looking for a job.

more readings are needed I think

- storage(local, index, session).
- oauth2 protocol
- lazy loading for spa application
