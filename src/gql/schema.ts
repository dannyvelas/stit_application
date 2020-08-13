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

    reservations: [Reservation!]
    favorites: [Business!]
  }

  type Reservation {
    reservationId: ID!
    status: RESERVATION_STATUS!

    business: Business!
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
    User: User
    Users: [User!]
    Reservations: [Reservation!]
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
