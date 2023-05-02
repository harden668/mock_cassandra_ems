var express = require("express");
var router = express.Router();
const { redisClient, redisClientSub } = require('../controller/redis_con');
const { queryData, InsertData } = require("../controller/cassandra_con.js");
const kafka = require("kafka-node");
const zeroPad = require("../utils/zeroPad");
const {
  producer1,
  producer2,
  producer3,
} = require("../controller/kafka_coon.js");
/* GET home page. */
router.get("/", function (req, res, next) {
  console.log("/我被调用了");
  res.render("index", { title: "Express" });
});

//模拟inverter_data表
router.post("/inverter_data", async function (req, res, next) {
  try {
    //电池功率
    let battery_power = Math.floor(Math.random() * 200) + 100;
    //当前运行模式
    //1-自发自用 2-强制放电 3-强制充电 4-削峰填谷模式 6-离网模式 7-停机模式 8-电池维护模式 9-TBD 10-并网模式 11-紧急补电 12-自动维护 13-售电模式
    let current_mode_text = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13];
    let current_mode =
      current_mode_text[
      Math.floor(Math.random() * current_mode_text.length) - 1
      ];
    //设备运行状态
    //0-等待 1-检查 2-正常 3-故障 5-升级 6-关机 -1离线
    let device_status_text = [0, 1, 2, 3, 5, 6, -1];
    let device_status =
      device_status_text[
      Math.floor(Math.random() * device_status_text.length) - 1
      ];
    //电网功率
    let grid_power = Math.floor(Math.random() * 200) + 100;
    //硬件错误
    //1.PV电压异常 2.电网异常 3.绝缘阻抗异常 4.漏电流异常 5.通讯异常 6.输出功率偏低
    let hardware_error_text = [1, 2, 3, 4, 5, 6];
    // let hardware_error_text = [
    //   "PV电压异常",
    //   "电网异常",
    //   "绝缘阻抗异常",
    //   "漏电流异常",
    //   "通讯异常",
    //   "输出功率偏低",
    // ];
    let hardware_error =
      hardware_error_text[
      Math.floor(Math.random() * hardware_error_text.length) - 1
      ];
    //mac地址
    let mac_address = "69:23:9c:76:c8:02";
    //电池功率
    let power_consumption = Math.floor(Math.random() * 200) + 100;
    //实时发电功率
    let real_time_power = Math.floor(Math.random() * 200) + 100;
    //从数据库获取最后一次插入的数据
    let timestamp = new Date();
    // const { database } = req.body;
    // console.log(database);
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
      timestamp,
    ];
    let message = {
      battery_power: battery_power,
      current_mode: current_mode,
      device_status: device_status,
      grid_power: grid_power,
      hardware_error: hardware_error,
      power_consumption: power_consumption,
      real_time_power: real_time_power,
      pv_output_energy_day: global.pv_output_energy_day,
      inverter_grid_energy_day: global.inverter_grid_energy_day,
      inverter_eps_energy_day: global.inverter_eps_energy_day,
      device_generation_energy_day: global.device_generation_energy_day,
      local_consumption_energy_day: global.local_consumption_energy_day,
      device_feed_in_energy_day: global.device_feed_in_energy_day,
      timestamp: timestamp,
    };
    let result = await InsertData(Insert_sql, params);
    let log_data = "成功向cassandra_inverter_data插入一条数据";
    console.log("result", result);
    if (result) {
      global.pv_output_energy_day =
        global.pv_output_energy_day + Math.floor(Math.random() * 10) + 1;
      global.inverter_grid_energy_day =
        global.inverter_grid_energy_day + Math.floor(Math.random() * 10) + 1;
      global.inverter_eps_energy_day =
        global.inverter_eps_energy_day + Math.floor(Math.random() * 10) + 1;
      global.device_generation_energy_day =
        global.device_generation_energy_day +
        Math.floor(Math.random() * 10) +
        1;
      global.local_consumption_energy_day =
        global.local_consumption_energy_day +
        Math.floor(Math.random() * 10) +
        1;
      global.device_feed_in_energy_day =
        global.device_feed_in_energy_day + Math.floor(Math.random() * 10) + 1;
      res.status(200).json({
        code: 200,
        summary: "success",
        data: log_data,
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: "not found",
        data: "not found the database",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

//模拟pv_optimizer_data
router.post("/pv_optimizer_data", async function (req, res, next) {
  try {
    // 返回指定范围的随机数(m-n之间)的公式:
    // Math.random() * (n - m) + m
    //状态
    //0表示通信正常，1-表示通信丢包
    let status_text = [0, 1];
    let status =
      status_text[Math.floor(Math.random() * status_text.length) - 1];
    //输入功率1
    let input_power1 = Math.floor(Math.random() * 200) + 100;
    //输入功率2
    let input_power2 = Math.floor(Math.random() * 200) + 100;
    //故障代码
    //1.PV电压异常 2.电网异常 3.绝缘阻抗异常 4.漏电流异常 5.通讯异常 6.输出功率偏低
    let fault_code_text = [1, 2, 3, 4, 5, 6];
    let fault_code =
      fault_code_text[Math.floor(Math.random() * fault_code_text.length) - 1];
    //mac地址
    let mac_address = "69:23:9c:76:c8:02";
    // sn
    let Optimizer_sn = "0123456789abcdef";
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
          Optimizer_sn,
          output_current,
          output_voltage,
          power_generation1,
          power_generation2,
          status,
          temperature,
          timestamp
    )
    VALUES( ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? )`;
    let params = [
      fault_code,
      input_current1,
      input_current2,
      input_power1,
      input_power2,
      input_voltage1,
      input_voltage2,
      mac_address,
      Optimizer_sn,
      output_current,
      output_voltage,
      global.power_generation1,
      global.power_generation2,
      status,
      temperature,
      timestamp,
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
      Optimizer_sn: Optimizer_sn,
      output_current: output_current,
      output_voltage: output_voltage,
      power_generation1: global.power_generation1,
      power_generation2: global.power_generation2,
      status: status,
      temperature: temperature,
      timestamp: timestamp,
    };
    //保存数据到Cassandra
    let result = await InsertData(sql, params);
    let log_data = "成功向cassandra_pv_optimizer_data插入一条数据";
    console.log("result", result);
    if (result) {
      global.power_generation1 =
        global.power_generation1 + Math.floor(Math.random() * 10) + 1;
      global.power_generation2 =
        global.power_generation2 + Math.floor(Math.random() * 10) + 1;
      res.status(200).json({
        code: 200,
        summary: "success",
        data: log_data,
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: "not found",
        data: "not found the database",
      });
    }
  } catch (error) {
    console.log(error);
  }
});
//模拟statistical_data
router.post("/statistical_data", async function (req, res, next) {
  try {
    //时间戳
    let timestamp = new Date();

    let mac_address = "69:23:9c:76:c8:02";

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
      timestamp,
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
      timestamp: timestamp,
    };
    //保存数据到Cassandra
    let result = await InsertData(sql, params);
    let log_data = "成功向cassandra_statistical_data插入一条数据";
    if (result) {
      global.pv_output_energy =
        global.pv_output_energy + Math.floor(Math.random() * 10) + 1;
      global.pv_output_energy_month =
        global.pv_output_energy_month + Math.floor(Math.random() * 10) + 1;
      global.pv_output_energy_year =
        global.pv_output_energy_year + Math.floor(Math.random() * 10) + 1;
      global.inverter_grid_energy =
        global.inverter_grid_energy + Math.floor(Math.random() * 10) + 1;
      global.inverter_grid_energy_month =
        global.inverter_grid_energy_month +
        Math.floor(Math.random() * 10) +
        1;
      global.inverter_grid_energy_year =
        global.inverter_grid_energy_year + Math.floor(Math.random() * 10) + 1;
      global.inverter_eps_energy =
        global.inverter_eps_energy + Math.floor(Math.random() * 10) + 1;
      global.inverter_eps_energy_month =
        global.inverter_eps_energy_month + Math.floor(Math.random() * 10) + 1;
      global.inverter_eps_energy_year =
        global.inverter_eps_energy_year + Math.floor(Math.random() * 10) + 1;
      global.device_generation_energy =
        global.device_generation_energy + Math.floor(Math.random() * 10) + 1;
      global.device_generation_energy_month =
        global.device_generation_energy_month +
        Math.floor(Math.random() * 10) +
        1;
      global.device_generation_energy_year =
        global.device_generation_energy_year +
        Math.floor(Math.random() * 10) +
        1;
      global.local_consumption_energy =
        global.local_consumption_energy + Math.floor(Math.random() * 10) + 1;
      global.local_consumption_energy_month =
        global.local_consumption_energy_month +
        Math.floor(Math.random() * 10) +
        1;
      global.local_consumption_energy_year =
        global.local_consumption_energy_year +
        Math.floor(Math.random() * 10) +
        1;
      global.device_feed_in_energy =
        global.device_feed_in_energy + Math.floor(Math.random() * 10) + 1;
      global.device_feed_in_energy_month =
        global.device_feed_in_energy_month +
        Math.floor(Math.random() * 10) +
        1;
      global.device_feed_in_energy_year =
        global.device_feed_in_energy_year +
        Math.floor(Math.random() * 10) +
        1;
      global.pv_output_time =
        global.pv_output_time + Math.floor(Math.random() * 10) + 1;
      global.inverter_grid_time =
        global.inverter_grid_time + Math.floor(Math.random() * 10) + 1;
      global.inverter_eps_time =
        global.inverter_eps_time + Math.floor(Math.random() * 10) + 1;
      global.device_generation_time =
        global.device_generation_time + Math.floor(Math.random() * 10) + 1;
      global.local_consumption_time =
        global.local_consumption_time + Math.floor(Math.random() * 10) + 1;
      global.device_feed_in_time =
        global.device_feed_in_time + Math.floor(Math.random() * 10) + 1;
      global.device_running_time =
        global.device_running_time + Math.floor(Math.random() * 10) + 1;
      res.status(200).json({
        code: 200,
        summary: "success",
        data: log_data,
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: "not found",
        data: "not found the database",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

//模拟power_station
router.post("/power_station", async function (req, res, next) {
  try {
    //电站id
    let station_id = 1;
    //电池总功率
    let battery_power = Math.floor(Math.random() * 200) + 100;
    //电网总功率
    let grid_power = Math.floor(Math.random() * 200) + 100;
    //电池总功率
    let power_consumption = Math.floor(Math.random() * 200) + 100;
    //总发电功率
    let real_time_power = Math.floor(Math.random() * 200) + 100;
    //时间戳
    let timestamp = new Date();
    let sql = `INSERT INTO ems.power_station(
          station_id,
          timestamp,
          battery_power,
          grid_power,
          power_consumption,
          real_time_power,
          pv_output_energy,
          local_consumption_energy,
          inverter_grid_energy,
          device_feed_in_energy,
          device_generation_energy,
          inverter_eps_energy,
          day_full_hours,
          month_full_hours,
          year_full_hours,
          running_days
    )
    VALUES( ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? )`;
    let params = [
      station_id,
      timestamp,
      battery_power,
      grid_power,
      power_consumption,
      real_time_power,
      global.pv_output_energy,
      global.inverter_grid_energy,
      global.inverter_eps_energy,
      global.device_generation_energy,
      global.local_consumption_energy,
      global.device_feed_in_energy,
      global.day_full_hours,
      global.month_full_hours,
      global.year_full_hours,
      global.running_days,
    ];
    let message = {
      station_id: station_id,
      timestamp: timestamp,
      real_time_power: real_time_power,
      day_full_hours: global.day_full_hours,
      month_full_hours: global.month_full_hours,
      year_full_hours: global.year_full_hours,
      running_days: global.running_days,
    };
    //保存数据到Cassandra
    let result = await InsertData(sql, params);
    let log_data = "成功向cassandra_power_station插入一条数据";
    console.log("result", result);
    if (result) {
      global.pv_output_energy =
        global.pv_output_energy + Math.floor(Math.random() * 10) + 1;
      global.pv_output_energy_month =
        global.pv_output_energy_month + Math.floor(Math.random() * 10) + 1;
      global.pv_output_energy_year =
        global.pv_output_energy_year + Math.floor(Math.random() * 10) + 1;
      global.inverter_grid_energy =
        global.inverter_grid_energy + Math.floor(Math.random() * 10) + 1;
      global.inverter_grid_energy_month =
        global.inverter_grid_energy_month +
        Math.floor(Math.random() * 10) +
        1;
      global.inverter_grid_energy_year =
        global.inverter_grid_energy_year + Math.floor(Math.random() * 10) + 1;
      global.inverter_eps_energy =
        global.inverter_eps_energy + Math.floor(Math.random() * 10) + 1;
      global.inverter_eps_energy_month =
        global.inverter_eps_energy_month + Math.floor(Math.random() * 10) + 1;
      global.inverter_eps_energy_year =
        global.inverter_eps_energy_year + Math.floor(Math.random() * 10) + 1;
      global.device_generation_energy =
        global.device_generation_energy + Math.floor(Math.random() * 10) + 1;
      global.device_generation_energy_month =
        global.device_generation_energy_month +
        Math.floor(Math.random() * 10) +
        1;
      global.device_generation_energy_year =
        global.device_generation_energy_year +
        Math.floor(Math.random() * 10) +
        1;
      global.local_consumption_energy =
        global.local_consumption_energy + Math.floor(Math.random() * 10) + 1;
      global.local_consumption_energy_month =
        global.local_consumption_energy_month +
        Math.floor(Math.random() * 10) +
        1;
      global.local_consumption_energy_year =
        global.local_consumption_energy_year +
        Math.floor(Math.random() * 10) +
        1;
      global.device_feed_in_energy =
        global.device_feed_in_energy + Math.floor(Math.random() * 10) + 1;
      global.device_feed_in_energy_month =
        global.device_feed_in_energy_month +
        Math.floor(Math.random() * 10) +
        1;
      global.device_feed_in_energy_year =
        global.device_feed_in_energy_year +
        Math.floor(Math.random() * 10) +
        1;
      global.pv_output_time =
        global.pv_output_time + Math.floor(Math.random() * 10) + 1;
      global.inverter_grid_time =
        global.inverter_grid_time + Math.floor(Math.random() * 10) + 1;
      global.inverter_eps_time =
        global.inverter_eps_time + Math.floor(Math.random() * 10) + 1;
      global.device_generation_time =
        global.device_generation_time + Math.floor(Math.random() * 10) + 1;
      global.local_consumption_time =
        global.local_consumption_time + Math.floor(Math.random() * 10) + 1;
      global.device_feed_in_time =
        global.device_feed_in_time + Math.floor(Math.random() * 10) + 1;
      global.device_running_time =
        global.device_running_time + Math.floor(Math.random() * 10) + 1;
      global.day_full_hours =
        global.day_full_hours + Math.floor(Math.random() * 10) + 1;
      global.month_full_hours =
        global.month_full_hours + Math.floor(Math.random() * 10) + 1;
      global.year_full_hours =
        global.year_full_hours + Math.floor(Math.random() * 10) + 1;
      global.running_days =
        global.running_days + Math.floor(Math.random() * 10) + 1;
      res.status(200).json({
        code: 200,
        summary: "success",
        data: log_data,
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: "not found",
        data: "not found the database",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

//模拟redis发布订阅
//power_data
router.post("/power_data", async function (req, res, next) {
  try {
    //电站id
    let station_id = "3200";
    //电池总功率
    let battery_power = Math.floor(Math.random() * 200) + 100;
    //电网总功率
    let grid_power = Math.floor(Math.random() * 200) + 100;
    //电池总功率
    let power_consumption = Math.floor(Math.random() * 200) + 100;
    //发电总功率
    let real_time_power = Math.floor(Math.random() * 200) + 100;
    //最后更新时间
    let last_updated = new Date();
    const { database } = req.body;
    console.log(database);
    let message = {
      battery_power: battery_power,
      grid_power: grid_power,
      station_id: station_id,
      power_consumption: power_consumption,
      real_time_power: real_time_power,
      pv_output_energy_day: global.pv_output_energy_day,
      inverter_grid_energy_day: global.inverter_grid_energy_day,
      inverter_eps_energy_day: global.inverter_eps_energy_day,
      device_generation_energy_day: global.device_generation_energy_day,
      local_consumption_energy_day: global.local_consumption_energy_day,
      device_feed_in_energy_day: global.device_feed_in_energy_day,
      day_full_hours: global.day_full_hours,
      last_updated: last_updated,
    };
    if (database == "Redis") {
      //保存数据到redis
      console.log("保存数据到redis");
      redisClient.hmset("power_data", station_id, JSON.stringify(message), (error, values) => {
        //发布频道
        let mes = {
          hash_name: 'power_data',
          key: station_id
        }
        let messName = JSON.stringify(mes);
        redisClientSub.publish("power_data", messName);
        let log_data = "成功向redis_inverter_data插入一条数据";
        global.pv_output_energy_day =
          global.pv_output_energy_day + Math.floor(Math.random() * 10) + 1;
        global.inverter_grid_energy_day =
          global.inverter_grid_energy_day + Math.floor(Math.random() * 10) + 1;
        global.inverter_eps_energy_day =
          global.inverter_eps_energy_day + Math.floor(Math.random() * 10) + 1;
        global.device_generation_energy_day =
          global.device_generation_energy_day +
          Math.floor(Math.random() * 10) +
          1;
        global.local_consumption_energy_day =
          global.local_consumption_energy_day +
          Math.floor(Math.random() * 10) +
          1;
        global.device_feed_in_energy_day =
          global.device_feed_in_energy_day + Math.floor(Math.random() * 10) + 1;
        global.day_full_hours = global.day_full_hours + 0.1;
        res.status(200).json({
          code: 200,
          summary: "success",
          data: log_data,
        });
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: "success",
        data: "not found this database",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

//optimizer_power_data
router.post("/optimizer_power", async function (req, res, next) {
  try {
    //优化器sn: sn
    let optimizer_sn = "120344wqe";
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
    //输入功率1
    let input_power1 = Math.floor(Math.random() * 200) + 100;
    //输入功率2
    let input_power2 = Math.floor(Math.random() * 200) + 100;
    //最后更新时间
    let last_updated = new Date();
    const { database } = req.body;
    console.log(database);
    let message = {
      optimizer_sn: optimizer_sn,
      input_voltage1: input_voltage1,
      input_voltage2: input_voltage2,
      input_current1: input_current1,
      input_current2: input_current2,
      output_voltage: output_voltage,
      output_current: output_current,
      input_power1: input_power1,
      input_power2: input_power2,
      power_generation1: global.power_generation1,
      power_generation2: global.power_generation2,
      last_updated: last_updated,
    };
    if (database == "Redis") {
      //保存数据到redis
      console.log("保存数据到redis");
      redisClient.hmset("optimizer_power", optimizer_sn, JSON.stringify(message), (error, values) => {
        //发布频道
        let mes = {
          hash_name: 'optimizer_power_data',
          key: optimizer_sn
        }
        let messName = JSON.stringify(mes);
        redisClientSub.publish("optimizer_power_data", messName);
        let log_data = "成功向optimizer_power_data插入一条数据";
        global.power_generation1 =
          global.power_generation1 + Math.floor(Math.random() * 10) + 1;
        global.power_generation2 =
          global.power_generation2 + Math.floor(Math.random() * 10) + 1;
        res.status(200).json({
          code: 200,
          summary: "success",
          data: log_data,
        });
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: "success",
        data: "not found this database",
      });
    }
  } catch (error) {
    console.log(error);
  }
});


//inverter_status_updates
router.post("/inverter_status", async function (req, res, next) {
  try {
    //逆变器采集器唯一标识：macAddress
    let macAddress = "69:23:9c:76:c8:02";
    //逆变器采集器状态 
    let inverter_collect_status = Math.floor(Math.random() + 0.5);
    //逆变器状态
    let inverter_status = Math.floor(Math.random() + 0.5);
    //逆变器运行模式
    let run_model = Math.floor(Math.random() * 10 + 1);
    //电池状态
    let battery_status = Math.floor(Math.random() + 0.5);
    //电表状态
    let voltmeter_status = Math.floor(Math.random() + 0.5);
    //最后更新时间
    let last_updated = new Date();
    const { database } = req.body;
    console.log(database);
    let message = {
      macAddress: macAddress,
      inverter_collect_status: inverter_collect_status,
      inverter_status: inverter_status,
      run_model: run_model,
      battery_status: battery_status,
      voltmeter_status: voltmeter_status,
      last_updated: last_updated,
    };
    if (database == "Redis") {
      //保存数据到redis
      console.log("保存数据到redis");
      redisClient.hmset("inverter_status", macAddress, JSON.stringify(message), (err, values) => {
        //发布频道
        let mes = {
          hash_name: 'inverter_status',
          key: macAddress
        }
        let messName = JSON.stringify(mes);
        redisClientSub.publish("inverter_status_updates", messName);
        let log_data = "成功向power_status_updates插入一条数据";
        res.status(200).json({
          code: 200,
          summary: "success",
          data: log_data,
        });
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: "success",
        data: "not found this database",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

//optimizer_status_updates
router.post("/optimizer_status", async function (req, res, next) {
  try {
    //优化器采集器唯一标识：macAddress
    let macAddress = "69:23:9c:76:c8:02";
    //优化器标识
    let optimizer_sn = "1212e31qe1";
    //优化器采集器状态 
    let optimizer_collect_status = Math.floor(Math.random() + 0.5);
    //优化器状态
    let optimizer_status = Math.floor(Math.random() + 0.5);
    //光伏板状态
    let pv_status = Math.floor(Math.random() + 0.5);
    //最后更新时间
    let last_updated = new Date();
    const { database } = req.body;
    console.log(database);
    let message = {
      macAddress: macAddress,
      optimizer_sn: optimizer_sn,
      optimizer_collect_status: optimizer_collect_status,
      optimizer_status: optimizer_status,
      pv_status: pv_status,
      last_updated: last_updated,
    };
    if (database == "Redis") if (database == "Redis") {
      //保存数据到redis
      console.log("保存数据到redis");
      let mes = {
        hash_name: 'optimizer_status',
        key: macAddress
      }
      let messName = JSON.stringify(mes);
      redisClient.hmset("optimizer_status", macAddress, JSON.stringify(message), (error, values) => {
        //发布频道
        redisClientSub.publish("optimizer_status_updates", messName);
        let log_data = "成功向optimizer_status_updates插入一条数据";
        res.status(200).json({
          code: 200,
          summary: "success",
          data: log_data,
        });
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: "success",
        data: "not found this database",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

//inverter_error_updates
router.post("/inverter_error", async function (req, res, next) {
  try {
    //采集器唯一标识：macAddress
    let macAddress = "69:23:9c:76:c8:02";
    //采集错误ID
    let error_id = 100;
    // 所属逆变器sn
    let error_sn = "12345";
    // 告警等级 (提示：0，警告：1，故障：2)
    let error_level = Math.floor(Math.random() + 0.5);
    // 告警状态 (未处理：0，处理中：1，已处理：2)
    let error_status = Math.floor(Math.random() + 0.5);
    //最后更新时间
    let last_updated = new Date();
    const { database } = req.body;
    console.log(database);
    let message = {
      macAddress: macAddress,
      error_id: error_id,
      error_sn: error_sn,
      error_level: error_level,
      error_status: error_status,
      last_updated: last_updated,
    };
    if (database == "Redis") {
      //保存数据到redis
      console.log("保存数据到redis");
      redisClient.hmset("inverter_error", macAddress, JSON.stringify(message), (error, values) => {
        //发布频道
        let mes = {
          hash_name: 'inverter_error',
          key: macAddress
        }
        let messName = JSON.stringify(mes);
        redisClientSub.publish("inverter_error_updates ", messName);
        let log_data = "成功向inverter_error_updates插入一条数据";
        res.status(200).json({
          code: 200,
          summary: "success",
          data: log_data,
        });
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: "success",
        data: "not found this database",
      });
    }
  } catch (error) {
    console.log(error);
  }
});


//optimizer_error_updates
router.post("/optimizer_error", async function (req, res, next) {
  try {
    //优化器采集器唯一标识：macAddress
    let macAddress = "69:23:9c:76:c8:01";
    //采集错误ID
    let error_id = 100;
    // 所属优化器sn
    let error_sn = "12345";
    // 告警等级 (提示：0，警告：1，故障：2)
    let error_level = Math.floor(Math.random() + 0.5);
    // 告警状态 (未处理：0，处理中：1，已处理：2)
    let error_status = Math.floor(Math.random() + 0.5);
    //最后更新时间
    let last_updated = new Date();
    const { database } = req.body;
    console.log(database);
    let message = {
      macAddress: macAddress,
      error_id: error_id,
      error_sn: error_sn,
      error_level: error_level,
      error_status: error_status,
      last_updated: last_updated,
    };
    if (database == "Redis") {
      //保存数据到redis
      console.log("保存数据到redis");
      redisClient.hmset("optimizer_error", macAddress, JSON.stringify(message), (error, values) => {
        //发布频道
        let mes = {
          hash_name: 'optimizer_error',
          key: macAddress
        }
        let messName = JSON.stringify(mes);
        redisClientSub.publish("optimizer_error_updates ", messName);
        let log_data = "成功向optimizer_error_updates插入一条数据";
        res.status(200).json({
          code: 200,
          summary: "success",
          data: log_data,
        });
      });
    } else {
      res.status(200).json({
        code: 200,
        summary: "success",
        data: "not found this database",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

//
module.exports = router;
