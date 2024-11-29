db.getSiblingDB('admin').auth(
    process.env.MONGO_INITDB_ROOT_USERNAME,
    process.env.MONGO_INITDB_ROOT_PASSWORD
);

db.createCollection("verify", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "Verify Validation",
      required: ["username", "code"],
      properties: {
        username: {
          bsonType: "string",
          minLength: 5,
          maxLength: 64,
          description: "'username' must be the username associated with the token and must be a string at least 5 characters long."
        },
        code: {
          bsonType: "string",
          maxLength: 6,
          description: "'code' must be the code used to verify signup and must be a 6 character long string."
        }
      }
    }
  }
})

db.verify.createIndex({"timeCreated": 1}, {expireAfterSeconds: 3600})

db.createCollection("tokens", {
    validator: {
        $jsonSchema: {
          bsonType: "object",
          title: "Token Validation",
          required: ["username", "token"],
          properties: {
            username: {
              bsonType: "string",
              minLength: 5,
              maxLength: 64,
              description: "'username' must be the username associated with the token and must be a string at least 5 characters long."
            },
            token: {
              bsonType: "string",
              maxLength: 128,
              description: "'token' must be the token granted and must be a string 128 characters long."
            }
          }
        }
      }
});

db.tokens.createIndex({"timeCreated": 1}, {expireAfterSeconds: 3600})

db.createCollection("users", {
    validator: {
        $jsonSchema: {
          bsonType: 'object',
          title: 'User validation',
          required: [
            'username',
            'hash',
            'email',
            'name',
            'verified'
          ],
          properties: {
            verified: {
              bsonType: 'boolean',
              description: '\'verified\' must be present and must be a boolean stating whether or not the user has verified their email.'
            },
            name: {
              bsonType: 'string',
              description: '\'name\' must be present and must be a string containing the users real name.'
            },
            hash: {
              bsonType: 'object',
              required: [
                'string',
                'salt',
                'algorithm'
              ],
              properties: {
                algorithm: {
                  bsonType: 'string',
                  description: '\'algorithm\' must be a string and must be either SHA256 or SHA512.',
                  pattern: '^SHA256|^SHA512'
                },
                salt: {
                  bsonType: 'string',
                  minLength: 5,
                  description: '\'salt\' must be present and a 5 character long string.'
                },
                string: {
                  bsonType: 'string',
                  minLength: 64,
                  maxLength: 128,
                  description: '\'string\' must be present and a string between 64 and 128 characters long.'
                }
              }
            },
            username: {
              bsonType: 'string',
              minLength: 5,
              description: '\'username\' must be present and must be a string at least 5 characters long.'
            },
            email: {
              bsonType: 'string',
              description: '\'email\' must be present and it must be a valid email.',
              pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$'
            },
            createdEvents: {
              bsonType: 'array',
              description: 'An array of DBRefs to events the user has created.'
            }
          }
        }
      }
    }
);


db.getSiblingDB('admin').createUser({
    user: process.env.MONGO_INITDB_NEW_USERNAME,
    pwd: process.env.MONGO_INITDB_NEW_PASSWORD,
    roles: [{role: "readWrite", db: "seating"}]
});
