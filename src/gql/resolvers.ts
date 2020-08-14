import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import validator from 'validator';
require('dotenv').config();

const authenticated = (next:any) => (parent: any, args: any, context: any, info: any) => {
  if(!context.userId) {
    return Error('Unauthenticated! Please sign in.');
  }

  return next(parent, args, context, info);
};

export const resolvers = { 
  Query : {
    User: authenticated(async (_:any, __: any, context: any) => {
      const client = await context.pool.connect();

      try {
        const result = await client.query("SELECT * FROM users WHERE user_id = $1", [ context.userId ]);
        const user = result.rows[0];

        return {
          userId: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          token: context.req.header('x-auth-token')
        }
      } catch(err) {
        console.log(err.stack);
      } finally {
        client.release();
      }
    }),

    Users: authenticated(async (_:any, __: any, context: any) => {
      const client = await context.pool.connect();

      try {
        const result = await client.query("SELECT * FROM users");
        return result.rows.map((user:any) => {
          return {
            userId: user.user_id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email
          }
        });
      } catch(err) {
        console.log(err.stack);
      } finally {
        client.release();
      }
    }),

    Reservations: authenticated(async (_:any, __: any, context: any) => {
      const client = await context.pool.connect();

      try {
        const result = await client.query("SELECT * FROM reservations");

        return result.rows.map((reservation:any) => {
          return {
            reservationId: reservation.reservation_id,
            status: reservation.status,
          }
        });
      } catch(err) {
        console.log(err.stack);
      } finally {
        client.release();
      }
    }),

    Businesses: authenticated(async (_: any, args: any, __: any, ___: any) => {
      const location = args.location ? args.location : 'nyc';

      const result = await axios.get(
        `https://api.yelp.com/v3/businesses/search?location=${location}&categories=restaurants,all`, {
          headers: {
            'Authorization': String(process.env.YELP_HEADER)
          }
        }
      );

      return result.data.businesses.map((business:any) => yelpBusinessToGraphQL(business));
    }),
  },

  User : {
    reservations: async (parent:any, _: any, context: any) => {
      const client = await context.pool.connect();

      try {
        const result = await client.query(
          `SELECT c.reservation_id, c.status, c.business_id FROM users a
            LEFT JOIN users_to_reservations b 
              ON a.user_id = b.user_id
            LEFT JOIN reservations c
              ON b.reservation_id = c.reservation_id
           WHERE a.user_id = $1
          `, [ parent.userId ]
        );

        // strangely, with no matches - a object with all null properties is returned.
        // the filter statement removes this object
        return result.rows
          .filter((reservation:any) => reservation.reservation_id) 
          .map((reservation:any) => {
          return {
            reservationId: reservation.reservation_id,
            status: reservation.status,
          }
        });
      } catch(err) {
        console.log(err.stack);
      } finally {
        client.release();
      }
    },

    favorites: async (parent:any, _: any, context: any) => {
      const client = await context.pool.connect();

      try {
        const result = await client.query(
          `
          SELECT b.business_id FROM users a
            LEFT JOIN users_to_favorite_businesses b
              ON a.user_id = b.user_id
          WHERE a.user_id = $1;
          `, [ parent.userId ]
        );

        // strangely, with no matches - a object with all null properties is returned.
        // the filter statement removes this object
        return result.rows
          .map((row:any) => row.business_id)
          .filter((businessId:any) => businessId)
          .map(async (businessId:string) => {

          const result = await axios.get(
            `https://api.yelp.com/v3/businesses/${businessId}`, {
              headers: {
                'Authorization': String(process.env.YELP_HEADER)
              }
            }
          );

          return yelpBusinessToGraphQL(result.data);
        });
      } catch(err) {
        console.log(err.stack);
      } finally {
        client.release();
      }
    }
  },

  Reservation : {
    business: async (parent:any, _: any, context: any) => {
      const client = await context.pool.connect();

      try {
        const result = await client.query(
          `SELECT business_id FROM reservations WHERE reservation_id = $1
          `, [ parent.reservationId ]
        );

        const businessId = result.rows[0].business_id;

        const getBusiness = await axios.get(
          `https://api.yelp.com/v3/businesses/${businessId}`, {
            headers: {
              'Authorization': String(process.env.YELP_HEADER)
            }
          }
        );

        return yelpBusinessToGraphQL(getBusiness.data);
      } catch(err) {
        console.log(err.stack);
      } finally {
        client.release();
      }
    },
  },

  Mutation: {
    async register(_:any, args:any, context: any) {
      const {
        firstName,
        lastName,
        email,
        password,
      } = args;

      if((!firstName)  ||
         (!lastName)   ||
         (!email)       ||
         (!password)
      ) {
        return 'No field should be left empty';
      } else if(!validator.isEmail(email)) {
        return 'Please enter a valid email';
      } else if ((password[0] === ' ') || (password.slice(-1) === ' ')) {
        return "Password cannot start or end with whitespace";
      }

      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const lcTrimmedEmail = email.toLowerCase().trim();

      const client = await context.pool.connect();

      try {
        const emailSearch = await client.query(
          "SELECT * FROM users WHERE email=$1", [lcTrimmedEmail]
        );

        if(emailSearch.rowCount !== 0) {
          return 'This email is already registered with an account';
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(args.password, salt);

        const insert = await client.query(
          `
          INSERT INTO users
            ( first_name
            , last_name
            , email
            , password
            )
          VALUES($1, $2, $3, $4)
          RETURNING user_id
          `,
          [ trimmedFirstName
          , trimmedLastName
          , lcTrimmedEmail
          , hash
          ]
        );

        const userId = insert.rows[0].user_id;

        const payload = { userId };
        const secret = String(process.env.JWT_SECRET);
        const token = jwt.sign( payload, secret, { expiresIn:'1hr' })

        return {
          userId,
          firstName: trimmedFirstName,
          lastName: trimmedLastName,
          email: lcTrimmedEmail,
          token
        }
      } catch(err) {
        console.log(err.stack);
      } finally {
        client.release();
      }
    },

    async login(_: any, args: any, context: any, __: any) {
      const { email, password } = args;

      if((!email) || (!password)) {
        return Error("Please fill out all fields.");
      }

      const lcTrimmedEmail = email.toLowerCase().trim();
      const client = await context.pool.connect();

      try {
        const search = await client.query(
         "SELECT * FROM users WHERE email=$1", [ lcTrimmedEmail ]
        );

        if(search.rowCount !== 1) {
          return Error("Invalid Credentials.");
        }

        const user = search.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) return Error("Invalid Credentials.");

        const payload = { userId: user.user_id };
        const secret = String(process.env.JWT_SECRET);
        const token = jwt.sign(payload, secret, { expiresIn:'1h' });

        return {
          userId: user.user_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          token
        }
      } catch(err) {
        console.error(err.stack);
      } finally {
        client.release();
      }
    },

    setFavorite: authenticated(async (_:any, args: any, context: any, __:any) => {
      const client = await context.pool.connect();

      try {
        const favoritedSearch = await client.query(
          `
          SELECT * FROM users_to_favorite_businesses
          WHERE user_id = $1 AND business_id = $2
          `,
          [ context.userId, args.businessId ]
        );

        if(favoritedSearch.rowCount !== 0) {
          return Error("Already favorited.");
        }

        await client.query(
          `
          INSERT INTO users_to_favorite_businesses(user_id, business_id)
          VALUES($1, $2)
          `,
          [ context.userId, args.businessId ]
        );

        return true;
      } catch(err) {
        console.error(err.stack);
      } finally {
        client.release();
      }
    }),

    unsetFavorite: authenticated(async (_:any, args: any, context: any, __:any) => {
      const client = await context.pool.connect();

      try {
        const favoritedSearch = await client.query(
          `
          SELECT * FROM users_to_favorite_businesses
          WHERE user_id = $1 AND business_id = $2
          `,
          [ context.userId, args.businessId ]
        );

        if(favoritedSearch.rowCount !== 1) {
          return Error("Not favorited.");
        }

        await client.query(
          `
          DELETE FROM users_to_favorite_businesses
          WHERE user_id = $1 AND business_id = $2
          `,
          [ context.userId, args.businessId ]
        );

        return true;
      } catch(err) {
        console.error(err.stack);
      } finally {
        client.release();
      }
    }),

    reserve: authenticated(async (_:any, args: any, context: any, __:any) => {
      const client = await context.pool.connect();

      try {
        const reservationAmountSearch = await client.query(
          `SELECT * FROM users_to_reservations WHERE user_id = $1`, [ context.userId ]
        );

        if(reservationAmountSearch.rowCount > 3) {
          return Error("Error: A user is denied more than three reservations.");
        }

        const alreadyReservedSearch = await client.query(
          `SELECT * FROM users_to_reservations a
            LEFT JOIN reservations b
              ON a.reservation_id = b.reservation_id
            WHERE user_id = $1 AND business_id = $2;`,
          [ context.userId, args.businessId ]
        );

        if(alreadyReservedSearch.rowCount === 1) {
          return Error("Error: You can only reserve at a restaurant once");
        }

        const result = await client.query(
          `
          WITH reservation_id AS (
            INSERT INTO reservations(status, business_id)
              VALUES('PENDING', $1)
              RETURNING reservation_id
          )
          INSERT INTO users_to_reservations(user_id, reservation_id)
            VALUES($2, (SELECT reservation_id FROM reservation_id))
          RETURNING reservation_id;
          `,
          [ args.businessId, context.userId ]
        );

        return result.rows[0].reservation_id
      } catch(err) {
        console.error(err.stack);
      } finally {
        client.release();
      }
    }),
  },
};


function yelpBusinessToGraphQL(business:any) {
  return {
    businessId: business.id,
    name: business.name,
    isClosed: business.is_closed,
    url: business.url,
    rating: business.rating,
    location: business.location.display_address.join(" "),
    phone: business.display_phone
  }
}
