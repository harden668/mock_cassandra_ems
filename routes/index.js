var express = require('express');
var router = express.Router();
const RedisClient = require('../controller/redis_con');
const redis = new RedisClient('127.0.0.1', 6379, 'Fx123456');
const { queryData, InsertData } = require('../controller/cassandra_con.js');
const kafka = require('kafka-node');
const zeroPad = require('../utils/zeroPad');
const { producer1, producer2, producer3 } = require('../controller/kafka_coon.js')
/* GET home page. */
router.get('/', function (req, res, next) {
  console.log('/我被调用了');
  res.render('index', { title: 'Express' });
});

//模拟inverter_data表
router.post('/inverter_data', async function (req, res, next) {
  try {
    //电池功率
    let battery_power = Math.floor(Math.random() * 200) + 100;
    //当前运行模式
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
    let mac_address = '69:23:9c:76:c8:01';
    //电池功率
    let power_consumption = Math.floor(Math.random() * 200) + 100;
    //实时发电功率
    let real_time_power = Math.floor(Math.random() * 200) + 100;
    //从数据库获取最后一次插入的数据
    let timestamp = new Date();
    const { database } = req.body;
    console.log(database);
    let Insert_sql = `INSERT INTO ems.inverter_data(
      battery_power,
      current_mode,
      device_status,
      grid_power,
      hardware_error,
      mac_address,
      power_consumption,
      real_time_power,
      pv_output_energy_day,
      inverter_grid_energy_day,
      inverter_eps_energy_day,
      device_generation_energy_day,
      local_consumption_energy_day,
      device_feed_in_energy_day,
      timestamp
    )
    VALUES( ?,?,?,?,?,?,?,?,?,?,?,?,?,?,? )`;
    let params = [
      battery_power,
      current_mode,
      device_status,
      grid_power,
      hardware_error,
      mac_address,
      power_consumption,
      real_time_power,
      global.pv_output_energy_day,
      global.inverter_grid_energy_day,
      global.inverter_eps_energy_day,
      global.device_generation_energy_day,
      global.local_consumption_energy_day,
      global.device_feed_in_energy_day,
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
      pv_output_energy_day: global.pv_output_energy_day,
      inverter_grid_energy_day: global.inverter_grid_energy_day,
      inverter_eps_energy_day: global.inverter_eps_energy_day,
      device_generation_energy_day: global.device_generation_energy_day,
      local_consumption_energy_day: global.local_consumption_energy_day,
      device_feed_in_energy_day: global.device_feed_in_energy_day,
      timestamp: timestamp
    }
    if (database == 'Cassandra') {
      console.log('params', params);
      let result = await InsertData(Insert_sql, params);
      let log_data = '成功向cassandra_inverter_data插入一条数据';
      redis.hmset('inverter_data', message)
        .then(() => {
          //发布频道
          redis.publish('mock_pub_inverter', 'inverter_data');
        })
      console.log('result', result);
      if (result) {
        global.pv_output_energy_day = global.pv_output_energy_day + Math.floor(Math.random() * 10) + 1;
        global.inverter_grid_energy_day = global.inverter_grid_energy_day + Math.floor(Math.random() * 10) + 1;
        global.inverter_eps_energy_day = global.inverter_eps_energy_day + Math.floor(Math.random() * 10) + 1;
        global.device_generation_energy_day = global.device_generation_energy_day + Math.floor(Math.random() * 10) + 1;
        global.local_consumption_energy_day = global.local_consumption_energy_day + Math.floor(Math.random() * 10) + 1;
        global.device_feed_in_energy_day = global.device_feed_in_energy_day + Math.floor(Math.random() * 10) + 1;
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
          global.pv_output_energy_day = global.pv_output_energy_day + Math.floor(Math.random() * 10) + 1;
          global.inverter_grid_energy_day = global.inverter_grid_energy_day + Math.floor(Math.random() * 10) + 1;
          global.inverter_eps_energy_day = global.inverter_eps_energy_day + Math.floor(Math.random() * 10) + 1;
          global.device_generation_energy_day = global.device_generation_energy_day + Math.floor(Math.random() * 10) + 1;
          global.local_consumption_energy_day = global.local_consumption_energy_day + Math.floor(Math.random() * 10) + 1;
          global.device_feed_in_energy_day = global.device_feed_in_energy_day + Math.floor(Math.random() * 10) + 1;
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
          global.pv_output_energy_day = global.pv_output_energy_day + Math.floor(Math.random() * 10) + 1;
          global.inverter_grid_energy_day = global.inverter_grid_energy_day + Math.floor(Math.random() * 10) + 1;
          global.inverter_eps_energy_day = global.inverter_eps_energy_day + Math.floor(Math.random() * 10) + 1;
          global.device_generation_energy_day = global.device_generation_energy_day + Math.floor(Math.random() * 10) + 1;
          global.local_consumption_energy_day = global.local_consumption_energy_day + Math.floor(Math.random() * 10) + 1;
          global.device_feed_in_energy_day = global.device_feed_in_energy_day + Math.floor(Math.random() * 10) + 1;
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
    let mac_address = '69:23:9c:76:c8:02';
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
    //温度
    let temperature = Math.floor(Math.random() * 30) + 15;
    //时间戳
    let timestamp = new Date();
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
      global.power_generation1,
      global.power_generation2,
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
      power_generation1: global.power_generation1,
      power_generation2: global.power_generation2,
      status: status,
      temperature: temperature,
      timestamp: timestamp
    }
    if (database == 'Cassandra') {
      console.log('params', params);
      //保存数据到Cassandra
      let result = await InsertData(sql, params);
      redis.hmset('pv_optimizer_data', message)
        .then(() => {
          //发布频道
          redis.publish('mock_pub_pv_optimizer', 'pv_optimizer_data');
        })
      let log_data = '成功向cassandra_pv_optimizer_data插入一条数据';
      console.log('result', result);
      if (result) {
        global.power_generation1 = global.power_generation1 + Math.floor(Math.random() * 10) + 1;
        global.power_generation2 = global.power_generation2 + Math.floor(Math.random() * 10) + 1;
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
          global.power_generation1 = global.power_generation1 + Math.floor(Math.random() * 10) + 1;
          global.power_generation2 = global.power_generation2 + Math.floor(Math.random() * 10) + 1;
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
          global.power_generation1 = global.power_generation1 + Math.floor(Math.random() * 10) + 1;
          global.power_generation2 = global.power_generation2 + Math.floor(Math.random() * 10) + 1;
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
    //时间戳
    let timestamp = new Date();

    let mac_address = '69:23:9c:76:c8:01';

    let sql = `INSERT INTO ems.statistical_data(
        device_feed_in_energy,
        device_feed_in_energy_month,
        device_feed_in_energy_year,
        device_feed_in_time,
        device_generation_energy,
        device_generation_energy_month,
        device_generation_energy_year,
        device_generation_time,
        device_running_time,
        inverter_eps_energy,
        inverter_eps_energy_month,
        inverter_eps_energy_year,
        inverter_eps_time,
        inverter_grid_energy,
        inverter_grid_energy_month,
        inverter_grid_energy_year,
        inverter_grid_time,
        local_consumption_energy,
        local_consumption_energy_month,
        local_consumption_energy_year,
        local_consumption_time,
        mac_address,
        pv_output_energy,
        pv_output_energy_month,
        pv_output_energy_year,
        pv_output_time,
        timestamp
    )
    VALUES( ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`;
    let params = [
      global.device_feed_in_energy,
      global.device_feed_in_energy_month,
      global.device_feed_in_energy_year,
      global.device_feed_in_time,
      global.device_generation_energy,
      global.device_generation_energy_month,
      global.device_generation_energy_year,
      global.device_generation_time,
      global.device_running_time,
      global.inverter_eps_energy,
      global.inverter_eps_energy_month,
      global.inverter_eps_energy_year,
      global.inverter_eps_time,
      global.inverter_grid_energy,
      global.inverter_grid_energy_month,
      global.inverter_grid_energy_year,
      global.inverter_grid_time,
      global.local_consumption_energy,
      global.local_consumption_energy_month,
      global.local_consumption_energy_year,
      global.local_consumption_time,
      mac_address,
      global.pv_output_energy,
      global.pv_output_energy_month,
      global.pv_output_energy_year,
      global.pv_output_time,
      timestamp
    ];
    let message = {
      device_feed_in_energy: global.device_feed_in_energy,
      device_feed_in_energy_month: global.device_feed_in_energy_month,
      device_feed_in_energy_year: global.device_feed_in_energy_year,
      device_feed_in_time: global.device_feed_in_time,
      device_generation_energy: global.device_generation_energy,
      device_generation_energy_month: global.device_generation_energy_month,
      device_generation_energy_year: global.device_generation_energy_year,
      device_generation_time: global.device_generation_time,
      device_running_time: global.device_running_time,
      inverter_eps_energy: global.inverter_eps_energy,
      inverter_eps_energy_month: global.inverter_eps_energy_month,
      inverter_eps_energy_year: global.inverter_eps_energy_year,
      inverter_eps_time: global.inverter_eps_time,
      inverter_grid_energy: global.inverter_grid_energy,
      inverter_grid_energy_month: global.inverter_grid_energy_month,
      inverter_grid_energy_year: global.inverter_grid_energy_year,
      inverter_grid_time: global.inverter_grid_time,
      local_consumption_energy: global.local_consumption_energy,
      local_consumption_energy_month: global.local_consumption_energy_month,
      local_consumption_energy_year: global.local_consumption_energy_year,
      local_consumption_time: global.local_consumption_time,
      mac_address: mac_address,
      pv_output_energy: global.pv_output_energy,
      pv_output_energy_month: global.pv_output_energy_year,
      pv_output_energy_month: global.pv_output_energy_year,
      pv_output_time: global.pv_output_time,
      timestamp: timestamp
    }
    if (database == 'Cassandra') {
      console.log('params', params);
      //保存数据到Cassandra
      let result = await InsertData(sql, params);
      let log_data = '成功向cassandra_statistical_data插入一条数据';
      redis.hmset('statistical_data', message)
        .then(() => {
          //发布频道
          redis.publish('mock_pub_statistical_data', 'statistical_data');
        })
      if (result) {
        global.pv_output_energy = global.pv_output_energy + Math.floor(Math.random() * 10) + 1;
        global.pv_output_energy_month = global.pv_output_energy_month + Math.floor(Math.random() * 10) + 1;
        global.pv_output_energy_year = global.pv_output_energy_year + Math.floor(Math.random() * 10) + 1;
        global.inverter_grid_energy = global.inverter_grid_energy + Math.floor(Math.random() * 10) + 1;
        global.inverter_grid_energy_month = global.inverter_grid_energy_month + Math.floor(Math.random() * 10) + 1;
        global.inverter_grid_energy_year = global.inverter_grid_energy_year + Math.floor(Math.random() * 10) + 1;
        global.inverter_eps_energy = global.inverter_eps_energy + Math.floor(Math.random() * 10) + 1;
        global.inverter_eps_energy_month = global.inverter_eps_energy_month + Math.floor(Math.random() * 10) + 1;
        global.inverter_eps_energy_year = global.inverter_eps_energy_year + Math.floor(Math.random() * 10) + 1;
        global.device_generation_energy = global.device_generation_energy + Math.floor(Math.random() * 10) + 1;
        global.device_generation_energy_month = global.device_generation_energy_month + Math.floor(Math.random() * 10) + 1;
        global.device_generation_energy_year = global.device_generation_energy_year + Math.floor(Math.random() * 10) + 1;
        global.local_consumption_energy = global.local_consumption_energy + Math.floor(Math.random() * 10) + 1;
        global.local_consumption_energy_month = global.local_consumption_energy_month + Math.floor(Math.random() * 10) + 1;
        global.local_consumption_energy_year = global.local_consumption_energy_year + Math.floor(Math.random() * 10) + 1;
        global.device_feed_in_energy = global.device_feed_in_energy + Math.floor(Math.random() * 10) + 1;
        global.device_feed_in_energy_month = global.device_feed_in_energy_month + Math.floor(Math.random() * 10) + 1;
        global.device_feed_in_energy_year = global.device_feed_in_energy_year + Math.floor(Math.random() * 10) + 1;
        global.pv_output_time = global.pv_output_time + Math.floor(Math.random() * 10) + 1;
        global.inverter_grid_time = global.inverter_grid_time + Math.floor(Math.random() * 10) + 1;
        global.inverter_eps_time = global.inverter_eps_time + Math.floor(Math.random() * 10) + 1;
        global.device_generation_time = global.device_generation_time + Math.floor(Math.random() * 10) + 1;
        global.local_consumption_time = global.local_consumption_time + Math.floor(Math.random() * 10) + 1;
        global.device_feed_in_time = global.device_feed_in_time + Math.floor(Math.random() * 10) + 1;
        global.device_running_time = global.device_running_time + Math.floor(Math.random() * 10) + 1;
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

//模拟power_station
router.post('/power_station', async function (req, res, next) {
  try {
    const { database } = req.body;
    console.log(database);
    //电站id
    let station_id = 1;
    //总发电功率
    let real_time_power = Math.floor(Math.random() * 200) + 100;
    //总用电功率
    let power_consumption = Math.floor(Math.random() * 100) + 10;
    //总电网功率
    let grid_power = Math.floor(Math.random() * 50) + 10;
    //总电池功率
    let battery_power = Math.floor(Math.random() * 100) + 50;
    //时间戳
    let timestamp = new Date();
    let sql = `INSERT INTO ems.power_station(
          station_id,
          timestamp,
          real_time_power ,
          power_consumption ,
          grid_power ,
          battery_power ,
          day_full_hours,
          month_full_hours,
          year_full_hours,
          running_days
    )
    VALUES( ?,?,?,?,?,?,?,?,?,? )`;
    let params = [
      station_id,
      timestamp,
      real_time_power,
      power_consumption,
      grid_power,
      battery_power,
      global.day_full_hours,
      global.month_full_hours,
      global.year_full_hours,
      global.running_days,
    ];
    let message = {
      station_id: station_id,
      timestamp: timestamp,
      real_time_power: real_time_power,
      power_consumption: power_consumption,
      grid_power: grid_power,
      battery_power: battery_power,
      day_full_hours: global.day_full_hours,
      month_full_hours: global.month_full_hours,
      year_full_hours: global.year_full_hours,
      running_days: global.running_days
    }
    if (database == 'Cassandra') {
      console.log('params', params);
      //保存数据到Cassandra
      let result = await InsertData(sql, params);
      redis.hmset('power_station', message)
        .then(() => {
          //发布频道
          redis.publish('mock_pub_power_station', 'power_station');
        })
      let log_data = '成功向cassandra_power_station插入一条数据';
      console.log('result', result);
      if (result) {
        global.day_full_hours = global.day_full_hours + Math.floor(Math.random() * 10) + 1;
        global.month_full_hours = global.month_full_hours + Math.floor(Math.random() * 10) + 1;
        global.year_full_hours = global.year_full_hours + Math.floor(Math.random() * 10) + 1;
        global.running_days = global.running_days + Math.floor(Math.random() * 10) + 1;
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
      redis.hmset('power_station', message)
        .then(() => {
          //发布频道
          redis.publish('mock_pub_power_station', 'power_station');
          let log_data = '成功向redis_pv_optimizer_data插入一条数据';
          global.day_full_hours = global.day_full_hours + Math.floor(Math.random() * 10) + 1;
          global.month_full_hours = global.month_full_hours + Math.floor(Math.random() * 10) + 1;
          global.year_full_hours = global.year_full_hours + Math.floor(Math.random() * 10) + 1;
          global.running_days = global.running_days + Math.floor(Math.random() * 10) + 1;
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
          global.day_full_hours = global.day_full_hours + Math.floor(Math.random() * 10) + 1;
          global.month_full_hours = global.month_full_hours + Math.floor(Math.random() * 10) + 1;
          global.year_full_hours = global.year_full_hours + Math.floor(Math.random() * 10) + 1;
          global.running_days = global.running_days + Math.floor(Math.random() * 10) + 1;
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
module.exports = router;
