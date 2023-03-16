var express = require('express');
var router = express.Router();
const RedisClient = require('../controller/redis_con');
const redis = new RedisClient('127.0.0.1', 6379, 'Fx123456');
const InsertData = require('../controller/cassandra_con.js');
const kafka = require('kafka-node');
const { producer1, producer2, producer3 } = require('../controller/kafka_coon.js')
/* GET home page. */
router.get('/', function (req, res, next) {
  console.log('/我被调用了');
  res.render('index', { title: 'Express' });
});

//模拟inverter_data表
router.post('/inverter_data', async function (req, res, next) {
  try {
    const { database } = req.body;
    console.log(database);
    // 返回指定范围的随机数(m-n之间)的公式:
    // Math.random() * (n - m) + m
    //电池功率
    let battery_power = Math.floor(Math.random() * 200) + 100;
    //当前运行状态
    let current_mode_text = ['并网', '离网'];
    let current_mode = current_mode_text[Math.floor(Math.random() * current_mode_text.length)];
    //设备运行状态
    let device_status_text = ['在线', '离线'];
    let device_status = device_status_text[Math.floor(Math.random() * device_status_text.length)];
    //电网功率
    let grid_power = Math.floor(Math.random() * 200) + 100;
    //硬件错误
    let hardware_error_text = ['PV电压异常', '电网异常', '绝缘阻抗异常', '漏电流异常', '通讯异常', '输出功率偏低'];
    let hardware_error = hardware_error_text[Math.floor(Math.random() * hardware_error_text.length)];
    //mac地址
    function randomHex() {
      return Math.floor(Math.random() * 16).toString(16);
    }

    function randomMacAddress() {
      var macAddress = '';
      for (var i = 0; i < 6; i++) {
        macAddress += randomHex() + randomHex();
        if (i < 5) {
          macAddress += ':';
        }
      }
      return macAddress;
    }
    let mac_address = randomMacAddress();
    //电池功率
    let power_consumption = Math.floor(Math.random() * 200) + 100;
    //实时发电功率
    let real_time_power = Math.floor(Math.random() * 200) + 100;
    //时间戳
    let date = new Date();
    let time = Math.floor(date.getTime());
    let timestamp = new Date(time - Math.floor(Math.random() * 1000000000));
    let sql = `INSERT INTO ems.inverter_data(
      battery_power,
      current_mode,
      device_status,
      grid_power,
      hardware_error,
      mac_address,
      power_consumption,
      real_time_power,
      timestamp
    )
    VALUES( ?,?,?,?,?,?,?,?,? )`;
    let params = [
      battery_power,
      current_mode,
      device_status,
      grid_power,
      hardware_error,
      mac_address,
      power_consumption,
      real_time_power,
      timestamp
    ];
    let message = {
      battery_power: battery_power,
      current_mode: current_mode,
      device_status: device_status,
      grid_power: grid_power,
      hardware_error: hardware_error,
      mac_address: mac_address,
      power_consumption: power_consumption,
      real_time_power: real_time_power,
      timestamp: timestamp
    }
    if (database == 'Cassandra') {
      //保存数据到Cassandra
      let result = await InsertData(sql, params);
      let log_data = '成功向cassandra_inverter_data插入一条数据';
      console.log('result', result);
      if (result) {
        res.status(200).json({
          code: 200,
          summary: 'success',
          data: log_data
        })
      } else {
        res.status(200).json({
          code: 200,
          summary: 'not found',
          data: 'not found the database'
        })
      }
    } else if (database == 'Redis') {
      //保存数据到redis
      console.log('保存数据到redis');
      redis.hmset('inverter_data', message)
        .then(() => {
          //发布频道
          redis.publish('mock_pub_inverter', 'inverter_data');
          let log_data = '成功向redis_inverter_data插入一条数据';
          res.status(200).json({
            code: 200,
            summary: 'success',
            data: log_data
          })
        })

    } else if (database == 'Kafka') {
      let payloads = [{
        topic: 'test',
        messages: JSON.stringify(message)
      }];
      console.log('payloads', payloads);
      let producer_id = 'inverter_data';
      producer1.send(payloads, (err, data) => {
        if (err) {
          console.error('Failed to send message:', err);
        } else {
          console.log('Message sent:', data);
          let log_data = '成功向Kafka_inverter_data插入一条数据';
          res.status(200).json({
            code: 200,
            summary: 'success',
            data: log_data
          })
        }
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: 'success',
        data: 'not found this database'
      })
    }
  } catch (error) {
    console.log(error)
  }
})

//模拟pv_optimizer_data
router.post('/pv_optimizer_data', async function (req, res, next) {
  try {
    const { database } = req.body;
    console.log(database);
    // 返回指定范围的随机数(m-n之间)的公式:
    // Math.random() * (n - m) + m
    //状态
    let status_text = ['在线', '离线'];
    let status = status_text[Math.floor(Math.random() * status_text.length)];
    //输入功率1
    let input_power1 = Math.floor(Math.random() * 200) + 100;
    //输入功率2
    let input_power2 = Math.floor(Math.random() * 200) + 100;
    //故障代码
    let fault_code_text = ['PV电压异常', '电网异常', '绝缘阻抗异常', '漏电流异常', '通讯异常', '输出功率偏低'];
    let fault_code = fault_code_text[Math.floor(Math.random() * fault_code_text.length)];
    //mac地址
    function randomHex() {
      return Math.floor(Math.random() * 16).toString(16);
    }

    function randomMacAddress() {
      var macAddress = '';
      for (var i = 0; i < 6; i++) {
        macAddress += randomHex() + randomHex();
        if (i < 5) {
          macAddress += ':';
        }
      }
      return macAddress;
    }
    let mac_address = randomMacAddress();
    //输入电压1
    let input_voltage1 = Math.floor(Math.random() * 200) + 100;
    //输入电压2
    let input_voltage2 = Math.floor(Math.random() * 200) + 100;
    //输入电流1
    let input_current1 = Math.floor(Math.random() * 200) + 100;
    //输入电流2
    let input_current2 = Math.floor(Math.random() * 200) + 100;
    //输出电压
    let output_voltage = Math.floor(Math.random() * 200) + 100;
    //输出电流
    let output_current = Math.floor(Math.random() * 200) + 100;
    //发电量1
    let power_generation1 = Math.floor(Math.random() * 200) + 100;
    //发电量2
    let power_generation2 = Math.floor(Math.random() * 200) + 100;
    //温度
    let temperature = Math.floor(Math.random() * 30) + 15;
    //时间戳
    let date = new Date();
    let time = Math.floor(date.getTime());
    let timestamp = new Date(time - Math.floor(Math.random() * 1000000000));
    let sql = `INSERT INTO ems.pv_optimizer_data(
          fault_code,
          input_current1,
          input_current2,
          input_power1,
          input_power2,
          input_voltage1,
          input_voltage2,
          mac_address,
          output_current,
          output_voltage,
          power_generation1,
          power_generation2,
          status,
          temperature,
          timestamp
    )
    VALUES( ?,?,?,?,?,?,?,?,?,?,?,?,?,?,? )`;
    let params = [
      fault_code,
      input_current1,
      input_current2,
      input_power1,
      input_power2,
      input_voltage1,
      input_voltage2,
      mac_address,
      output_current,
      output_voltage,
      power_generation1,
      power_generation2,
      status,
      temperature,
      timestamp
    ];
    let message = {
      fault_code: fault_code,
      input_current1: input_current1,
      input_current2: input_current2,
      input_power1: input_power1,
      input_power2: input_power2,
      input_voltage1: input_voltage1,
      input_voltage2: input_voltage2,
      mac_address: mac_address,
      output_current: output_current,
      output_voltage: output_voltage,
      power_generation1: power_generation1,
      power_generation2: power_generation2,
      status: status,
      temperature: temperature,
      timestamp: timestamp
    }
    if (database == 'Cassandra') {
      //保存数据到Cassandra
      let result = await InsertData(sql, params);
      let log_data = '成功向cassandra_pv_optimizer_data插入一条数据';
      console.log('result', result);
      if (result) {
        res.status(200).json({
          code: 200,
          summary: 'success',
          data: log_data
        })
      } else {
        res.status(200).json({
          code: 200,
          summary: 'not found',
          data: 'not found the database'
        })
      }
    } else if (database == 'Redis') {
      //保存数据到redis
      console.log('保存数据到redis');
      redis.hmset('pv_optimizer_data', message)
        .then(() => {
          //发布频道
          redis.publish('mock_pub_pv_optimizer', 'pv_optimizer_data');
          let log_data = '成功向redis_pv_optimizer_data插入一条数据';
          res.status(200).json({
            code: 200,
            summary: 'success',
            data: log_data
          })
        })

    } else if (database == 'Kafka') {
      let payloads = [{
        topic: 'test',
        messages: JSON.stringify(message)
      }];
      console.log('payloads', payloads);
      producer2.send(payloads, (err, data) => {
        if (err) {
          console.error('Failed to send message:', err);
        } else {
          console.log('Message sent:', data);
          let log_data = '成功向Kafka_pv_optimizer_data插入一条数据';
          res.status(200).json({
            code: 200,
            summary: 'success',
            data: log_data
          })
        }
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: 'success',
        data: 'not found this database'
      })
    }
  } catch (error) {
    console.log(error)
  }
})
//模拟statistical_data
router.post('/statistical_data', async function (req, res, next) {
  try {
    const { database } = req.body;
    console.log(database);
    // 返回指定范围的随机数(m-n之间)的公式:
    // Math.random() * (n - m) + m
    //PV总输出电量
    let pv_output_energy = Math.floor(Math.random() * 200) + 100;
    //PV总输出时间
    let pv_output_time = Math.floor(Math.random() * 200) + 100;

    //mac地址
    function randomHex() {
      return Math.floor(Math.random() * 16).toString(16);
    }

    function randomMacAddress() {
      var macAddress = '';
      for (var i = 0; i < 6; i++) {
        macAddress += randomHex() + randomHex();
        if (i < 5) {
          macAddress += ':';
        }
      }
      return macAddress;
    }
    let mac_address = randomMacAddress();
    //逆变总输出上网电量
    let inverter_grid_energy = Math.floor(Math.random() * 200) + 100;
    //逆变总输出EPS电量
    let inverter_eps_energy = Math.floor(Math.random() * 200) + 100;
    //设备总发电量
    let device_generation_energy = Math.floor(Math.random() * 200) + 100;
    //本地负载总用电量
    let local_consumption_energy = Math.floor(Math.random() * 200) + 100;
    //设备总馈入电量
    let device_feed_in_energy = Math.floor(Math.random() * 200) + 100;
    //逆变总输出上网时间
    let inverter_grid_time = Math.floor(Math.random() * 200) + 100;
    //逆变总输出EPS时间
    let inverter_eps_time = Math.floor(Math.random() * 200) + 100;
    //设备总发电时间
    let device_generation_time = Math.floor(Math.random() * 200) + 100;
    //本地负载总用电时间
    let local_consumption_time = Math.floor(Math.random() * 200) + 100;
    //设备总馈电时间
    let device_feed_in_time = Math.floor(Math.random() * 200) + 100;
    //设备总运行时间
    let device_running_time = Math.floor(Math.random() * 200) + 100;
    //温度
    let temperature = Math.floor(Math.random() * 30) + 15;
    //时间戳
    let date = new Date();
    let time = Math.floor(date.getTime());
    let timestamp = new Date(time - Math.floor(Math.random() * 1000000000));
    let sql = `INSERT INTO ems.statistical_data(
        device_feed_in_energy,
        device_feed_in_time,
        device_generation_energy,
        device_generation_time,
        device_running_time,
        inverter_eps_energy,
        inverter_eps_time,
        inverter_grid_energy,
        inverter_grid_time,
        local_consumption_energy,
        local_consumption_time,
        mac_address,
        pv_output_energy,
        pv_output_time,
        timestamp
    )
    VALUES( ?,?,?,?,?,?,?,?,?,?,?,?,?,?,? )`;
    let params = [
      device_feed_in_energy,
      device_feed_in_time,
      device_generation_energy,
      device_generation_time,
      device_running_time,
      inverter_eps_energy,
      inverter_eps_time,
      inverter_grid_energy,
      inverter_grid_time,
      local_consumption_energy,
      local_consumption_time,
      mac_address,
      pv_output_energy,
      pv_output_time,
      timestamp
    ];
    let message = {
      device_feed_in_energy: device_feed_in_energy,
      device_feed_in_time: device_feed_in_time,
      device_generation_energy: device_generation_energy,
      device_generation_time: device_generation_time,
      device_running_time: device_running_time,
      inverter_eps_energy: inverter_eps_energy,
      inverter_eps_time: inverter_eps_time,
      inverter_grid_energy: inverter_grid_energy,
      inverter_grid_time: inverter_grid_time,
      local_consumption_energy: local_consumption_energy,
      local_consumption_time: local_consumption_time,
      mac_address: mac_address,
      pv_output_energy: pv_output_energy,
      pv_output_time: pv_output_time,
      timestamp: timestamp
    }
    if (database == 'Cassandra') {
      //保存数据到Cassandra
      let result = await InsertData(sql, params);
      let log_data = '成功向cassandra_statistical_data插入一条数据';
      console.log('result', result);
      if (result) {
        res.status(200).json({
          code: 200,
          summary: 'success',
          data: log_data
        })
      } else {
        res.status(200).json({
          code: 200,
          summary: 'not found',
          data: 'not found the database'
        })
      }
    } else if (database == 'Redis') {
      //保存数据到redis
      console.log('保存数据到redis');
      redis.hmset('statistical_data', message)
        .then(() => {
          //发布频道
          redis.publish('mock_pub_statistical_data', 'statistical_data');
          let log_data = '成功向redis_statistical_data插入一条数据';
          res.status(200).json({
            code: 200,
            summary: 'success',
            data: log_data
          })
        })

    } else if (database == 'Kafka') {
      let payloads = [{
        topic: 'test',
        messages: JSON.stringify(message)
      }];
      console.log('payloads', payloads);
      producer2.send(payloads, (err, data) => {
        if (err) {
          console.error('Failed to send message:', err);
        } else {
          console.log('Message sent:', data);
          let log_data = '成功向Kafka_statistical_data插入一条数据';
          res.status(200).json({
            code: 200,
            summary: 'success',
            data: log_data
          })
        }
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: 'success',
        data: 'not found this database'
      })
    }
  } catch (error) {
    console.log(error)
  }
})
module.exports = router;
