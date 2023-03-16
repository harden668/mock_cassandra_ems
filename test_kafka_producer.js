const kafka = require('kafka-node');
const avro = require('avro-js');
// 定义Kafka配置
const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
const producer = new kafka.Producer(kafkaClient);

// 定义数据
let mesage = JSON.stringify({ data: 'Hello, Kafka!' });
const payload = [
  { topic: 'test', messages: mesage }
];

// 定义定时器
setInterval(() => {
  producer.send(payload, (err, data) => {
    if (err) {
      console.error('Failed to send message:', err);
    } else {
      console.log('Message sent:', data);
    }
  });
}, 1000);