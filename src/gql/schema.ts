export const typeDefs =`
  enum RESERVATION_STATUS {
    SUCCESS
    FAILURE
    PENDING
  }

  type User {
    userId: ID!
    firstName: String!
    lastName: String!
    email: String!
    token: String!
  }

  type Business {
    businessId: ID!
    name: String!
    isClosed: Boolean!
    url: String!
    rating: Float!
    location: String!
    phone: String!
  }

  type Query {
    Businesses(location: String): [Business!]
  }

  type Mutation {
    register(
      firstName: String!
      lastName: String!
      email: String!
      password: String!
    ): User!

    login(
      email: String!
      password: String!
    ): User!

    setFavorite(businessId: ID!): Boolean!
    unsetFavorite(businessId: ID!): Boolean!

    reserve(businessId: String!): ID!
  }
`;
