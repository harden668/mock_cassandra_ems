const kafka = require('kafka-node');

// 定义Kafka配置
const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });

// 创建名为test的topic
const admin = new kafka.Admin(kafkaClient);
const topic = {
  topic: 'test',
  partitions: 1,
  replicationFactor: 1
};
admin.createTopics([topic], (err, res) => {
  if (err) {
    console.error('Failed to create topic:', err);
  } else {
    console.log('Topic created:', res);
  }
});

// 启动消费者
const consumer = new kafka.Consumer(
  kafkaClient,
  [{ topic: 'test', partition: 0 }],
  { autoCommit: false }
);
consumer.on('message', (message) => {
  console.log('Received message:', message);
});