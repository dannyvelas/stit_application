# Restaurant application

## Get Started:
1. Download: `git clone https://github.com/dannyvelas/stit_application.git`
2. Get Dependencies: `cd stit_applicatoin && npm install`
3. Run: `npm run dev`

## Play
1. Go to [http://localhost:5000/graphql](http://localhost:5000/graphql)
2. Run any of the available queries below
3. Note: to run any query besides regiser/login, you must get the token returned by the register/login endpoint and place it in the http header 'x-auth-token'.

## A note about implementation
1. According to the spec, there is an external endpoint that would determine the success of a reservation. This did not seem to me to be provided, so I simply left every reservation request as 'PENDING'.
2. The spec called for a /logout endpoint and I did not provide one. I could've created an extra table in the database (or used something like REDIS) to act as a blacklist for JWT tokens that ought not to be valid, but for simplicity I opted not to. Usually, I have tokens expire within 1 hour (as is the case here), and I send a user new ones before they expire. This makes a logout endpoint unnecessary.

### Register
```
mutation {
  register(
    firstName: "Daniel",
    lastName: "Velasquez",
    email: "danivelas4@gmail.com",
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
