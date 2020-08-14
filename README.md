# Restaurant application

## Get Started:
1. Download: `git clone https://github.com/dannyvelas/stit_application.git`
2. Get Dependencies: `cd stit_application && npm install`
3. Run: `npm run dev`

## Play
1. Go to [http://localhost:5000/graphql](http://localhost:5000/graphql)
2. Run any of the available queries below
3. Note: to run any query besides register/login, you must get the token returned by the register/login endpoint and place it in the http header 'x-auth-token'.
4. To do this, in the GraphQl api sender link above, you can click `HTTP HEADERS` at the bottom and put something that will look like:
```
{
  "x-auth-token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTU5NzM2NDEyOSwiZXhwIjoxNTk3MzY3NzI5fQ.HY3Bg_rLf8-d9Lmj1q8xl81v6VyMnvz_p35WZDzd-ek"
}
```

## A note about implementation
1. According to the spec, there is an external endpoint that would determine the success of a reservation. This did not seem to me to be provided, so I simply left every reservation request as 'PENDING'.
2. The spec called for a /logout endpoint and I did not provide one. I could've created an extra table in the database (or used something like REDIS) to act as a blacklist for JWT tokens that ought not to be valid, but for simplicity I opted not to. Usually, I have tokens expire within 1 hour (as is the case here), and I send a logged-in user new ones before they expire. By this method, the front-end could take care of a logout by simply clearing the token from the client-side storage.

### Register
```
mutation {
  register(
    firstName: "Daniel",
    lastName: "Velasquez",
    email: "myemail@gmail.com",
    password: "fakepassword"
  ) {
    userId
    firstName
    lastName
    email
    token
  }
}
```

### Login
```
mutation {
  login(
    email: "myemail@gmail.com",
    password: "fakepassword"
  ) {
    userId
    firstName
    lastName
    email
    token
  }
}
```

### Get Businesses
```
query {
    Businesses {
        businessId
        name
        isClosed
        url
        rating
        location
        phone
    }
}
```

### Reserve a business
```
mutation {
    reserve(businessId: "H4jJ7XB3CetIr1pg56CczQ")
}
```


### Favorite a business
```
mutation {
    setFavorite(businessId: "H4jJ7XB3CetIr1pg56CczQ")
}
```

### Unfavorite a business
```
mutation {
    unsetFavorite(businessId: "H4jJ7XB3CetIr1pg56CczQ")
}
```

### Check everything worked
```
query {
    User {
        userId
        favorites {
            businessId
            name
            isClosed
            url
            rating
            location
            phone
        }

        reservations {
            reservationId
            status
            business {
                businessId
                name
                isClosed
                url
                rating
                location
                phone
            }
        }
    }
}
```

### See all users in DB
```
query {
  Users {
    firstName
    lastName
    email
  }
}
```

### See all reservations In DB
```
query {
  Reservations {
    reservationId
    status
    business {
      name
    }
  }
}
```
