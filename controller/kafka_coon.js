const kafka = require('kafka-node');

const client = new kafka.KafkaClient({ kafkaHost: 'localhost:9092' });
// 测试连接
client.on('connect', () => {
  console.log('Kafka client connected');
});

client.on('error', (error) => {
  console.error('Kafka client error:', error);
});

//创建生产者实例
const producer1 = new kafka.Producer(client, {
  id: 'inverter_data'
});

const producer2 = new kafka.Producer(client, {
  id: 'pv_optimizer_data'
});

const producer3 = new kafka.Producer(client, {
  id: 'statistical_data'
});

//关闭与Kafka代理的连接， 并在生产者停止发送消息之前等待所有排队消息发送完成
const close_producer = function (producer_id) {
  producer_id.close((error) => {
    if (error) {
      console.error('Failed to close producer:', error);
    } else {
      console.log('Kafka producer closed');
    }
  });
}

module.exports = {
  producer1,
  producer2,
  producer3
}