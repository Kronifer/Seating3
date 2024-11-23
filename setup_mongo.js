db.getSiblingDB('admin').auth(
    process.env.MONGO_INITDB_ROOT_USERNAME,
    process.env.MONGO_INITDB_ROOT_PASSWORD
);
db.getSiblingDB('admin').createUser({
    user: process.env.MONGO_INITDB_NEW_USERNAME,
    pwd: process.env.MONGO_INITDB_NEW_PASSWORD,
    roles: [{role: "readWrite", db: "seating"}]
});

db.createCollection("users", {
    validator: {
        $jsonSchema: {
          bsonType: 'object',
          title: 'User validation',
          required: [
            'username',
            'hash',
            'email'
          ],
          properties: {
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
            }
          }
        }
      }
    }
);
