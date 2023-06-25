const redis = require('redis');
const keys = require('./config/keys');
const redisClient = redis.createClient(keys.rediURL);
redisClient.on('error', err => console.log("Redis Client Error", err));
(async function () {
    await redisClient.connect();
})();
module.exports = redisClient;