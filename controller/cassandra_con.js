const cassandra = require('cassandra-driver');
const cassandra_config = require('../config/db_config');
// connect config
var PlainTextAuthProvider = cassandra.auth.PlainTextAuthProvider;
const client = new cassandra.Client({
  contactPoints: [cassandra_config.IP],
  authProvider: new PlainTextAuthProvider(cassandra_config.username, cassandra_config.password),
  keyspace: cassandra_config.keySpace,
  localDataCenter: 'datacenter1',
  //maxPrepared: 1000, //  Values that too high can cause memory issues, so adjust carefully
});

client.connect()
  .then(() => {
    const maxPrepared = client.controlConnection.options.maxPrepared;
    console.log('maxPrepared', maxPrepared);

    const prepareCache = client.controlConnection.prepareCache || {};
    const preparedCount = Object.keys(prepareCache).length;
    console.log('prepareCache', preparedCount);
    if (preparedCount >= maxPrepared) {
      client.controlConnection.prepareCache = {};
      console.log("The prepare cache has been cleared.");
    }
  })
  .catch(err => console.error(err));

//Packaging prepare execute
async function queryData(sql, values) {
  const parameters = values;
  const result = await client.execute(sql, parameters, { prepare: true });
  return result.rows[0];
}
async function InsertData(sql, values) {
  const parameters = values;
  await client.execute(sql, parameters, { prepare: true });
  return true;
}
module.exports = InsertData;



