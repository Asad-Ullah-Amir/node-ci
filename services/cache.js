const mongoose = require('mongoose');
const redisClient = require('../redis');
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
    this.useCache = true;
    this.hashKey = JSON.stringify(options.key || '');
    return this;
}
mongoose.Query.prototype.exec = async function () {
    // If cache not enable for this query
    if (!this.useCache) {
        return exec.apply(this, arguments)
    };

    const key = Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    });
    // // See if we have data against 'key' in redis
    const cachedData = await redisClient.hGet(this.hashKey, `${key}`);
    // // If we do, return that
    if (cachedData) {
        let doc = JSON.parse(cachedData);
        return Array.isArray(doc) ? doc.map(d => new this.model(d)) : new this.model(doc);
    }

    // // Otherwise, execute the query and store result in redis
    const result = await exec.apply(this, arguments);
    await redisClient.hSet(this.hashKey, `${key}`, JSON.stringify(result));
    return result;

}

module.exports = {
    async clearHash(key) {
        await redisClient.del(JSON.stringify(key));
    }
}