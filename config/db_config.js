//定义cassandra连接相关配置
const cassandra_config = {
  IP: 'localhost:9042',
  keySpace: 'motorforecast',
  username: 'cassandra',
  password: 'cassandra',
}
module.exports = cassandra_config