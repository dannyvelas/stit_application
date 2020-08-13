DROP TYPE RESERVATION_STATUS CASCADE;

DROP TABLE users CASCADE;
DROP TABLE reservations CASCADE;
DROP TABLE restaurants CASCADE;
DROP TABLE businesses CASCADE;

CREATE TYPE RESERVATION_STATUS AS ENUM ('SUCCESS', 'FAILURE', 'PENDING');

CREATE TABLE users(
  user_id SERIAL PRIMARY KEY NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  password TEXT NOT NULL
);

CREATE TABLE reservations(
  reservation_id SERIAL PRIMARY KEY NOT NULL,
  status RESERVATION_STATUS NOT NULL

  business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE NOT NULL 
    -- many-to-one relationship:
    -- a reservation can have only one business but a business can have many reservations                                                                                  
);

CREATE TABLE users_to_reservations(
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
  reservation_id INTEGER REFERENCES reservations(reservation_id) ON DELETE CASCADE NOT NULL
    -- this table is a many to many relational table:
    -- a user can have many reservations and a reservation can have many users
);

CREATE TABLE businesses(
  business_id SERIAL PRIMARY KEY NOT NULL
);

CREATE TABLE users_to_favorite_businesses(
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE NOT NULL,
  business_id INTEGER REFERENCES businesses(business_id) ON DELETE CASCADE NOT NULL
    -- this table is a many to many relational table:
    -- a user can have many favorite businesses and a business can be favorited by many users
);
