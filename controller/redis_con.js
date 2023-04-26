const redis = require('redis');
//用于操作redis数据
const redisClient = redis.createClient("redis://" + "127.0.0.1" + ":" + 6379, {
  auth_pass: "Fx123456",
});
//用于订阅频道
// const redisClientSub = redis.createClient("redis://" + host + ":" + port, {
//   auth_pass: auth_pass,
// });
// const channels = ['inverter_power_data', 'inverter_error_updates', 'power_status_updates'];
// function subscribe(channelName) {
//   redisClientSub.subscribe(channelName, (error, channel) => {
//     if (error) {
//       throw new Error(error);
//     }
//   });
// }
//订阅所有频道
// channels.forEach((e) => {
//   subscribe(e);
// });
redisClient.on('connect', function () {
  console.log('Connected to Redis server');
});

redisClient.on('error', function (err) {
  console.error('Error connecting to Redis server:', err);
});

module.exports = {
  redisClient,
  // redisClientSub
};