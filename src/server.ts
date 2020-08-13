import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';
require('dotenv').config();


// initialize express with cors
const app = express();
app.use(cors());


// connect db
const pool = new Pool({
  connectionString: String(process.env.DATABASE_URL),
  ssl: {
    rejectUnauthorized: false
  }
});

// gql
import { typeDefs } from './gql/schema';
import { resolvers } from './gql/resolvers';
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }: any) => {
    let userId = null;

    try {
      const token = req.header('x-auth-token');

      if(token) {
        const decoded:any = jwt.verify(token, String(process.env.SECRET));
        userId = decoded.userId;
      }
    } catch (err) {
      throw Error("Session invalid or expired. Please sign out and sign back in.");
    }
    
    return {
      pool,
      userId,
      req
    }
  },
  formatError: (err) => {
    if(err.message.startsWith('Context creation failed:')) {
      return new Error(err.message.replace('Context creation failed:', ''));
    }

    return err;
  }
});


// Listen on port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
