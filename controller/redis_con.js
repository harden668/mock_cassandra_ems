const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor(host, port, password) {
    this.client = redis.createClient({
      host: host,
      port: port,
      password: password
    });
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.hmgetAsync = promisify(this.client.hmget).bind(this.client);
    this.hmsetAsync = promisify(this.client.hmset).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
    this.expireAsync = promisify(this.client.expire).bind(this.client);
    this.publishAsync = promisify(this.client.publish).bind(this.client);
    this.subscribeAsync = promisify(this.client.subscribe).bind(this.client);
    this.unsubscribeAsync = promisify(this.client.unsubscribe).bind(this.client);
  }

  async get(key) {
    return await this.getAsync(key);
  }

  async hmget(key, fields) {
    return await this.hmgetAsync(key, fields);
  }

  async hmset(key, values) {
    return await this.hmsetAsync(key, values);
  }

  async set(key, value) {
    return await this.setAsync(key, value);
  }

  async del(key) {
    return await this.delAsync(key);
  }

  async expire(key, seconds) {
    return await this.expireAsync(key, seconds);
  }

  async close() {
    return await this.client.quit();
  }

  async subscribe(channel, callback) {
    await this.subscribeAsync(channel);
    this.client.on('message', (subscribedChannel, message) => {
      if (subscribedChannel === channel) {
        callback(message);
      }
    });
  }

  async unsubscribe(channel, callback) {
    this.client.off('message', callback);
    await this.unsubscribeAsync(channel);
  }

  async publish(channel, message) {
    return await this.publishAsync(channel, message);
  }
}

module.exports = RedisClient;