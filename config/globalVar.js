const { queryData } = require('../controller/cassandra_con.js');
//定义全局变量

//inverter_data
//PV日输出电量
global.pv_output_energy_day = 10;
//逆变日输出上网电量
global.inverter_grid_energy_day = 10;
//逆变日输出EPS电量
global.inverter_eps_energy_day = 10;
//设备日发电量
global.device_generation_energy_day = 10;
//本地负载日用电量
global.local_consumption_energy_day = 10;
//设备日馈入电量
global.device_feed_in_energy_day = 10;

//pv_Optimization
//发电量1
global.power_generation1 = 10;
//发电量2
global.power_generation2 = 10;

//statistical
//PV总输出电量
global.pv_output_energy = 100;
global.pv_output_energy_month = 100;
global.pv_output_energy_year = 100;
//逆变总输出上网电量
global.inverter_grid_energy = 100;
global.inverter_grid_energy_month = 100;
global.inverter_grid_energy_year = 100;
//逆变总输出EPS电量
global.inverter_eps_energy = 100;
global.inverter_eps_energy_month = 100;
global.inverter_eps_energy_year = 100;
//设备总发电量
global.device_generation_energy = 100;
global.device_generation_energy_month = 100;
global.device_generation_energy_year = 100;
//本地负载总用电量
global.local_consumption_energy = 100;
global.local_consumption_energy_month = 100;
global.local_consumption_energy_year = 100;
//设备总馈入电量
global.device_feed_in_energy = 100;
global.device_feed_in_energy_month = 100;
global.device_feed_in_energy_year = 100;
//PV总输出时间
global.pv_output_time = 10;
//逆变总输出上网时间
global.inverter_grid_time = 10;
//逆变总输出EPS时间
global.inverter_eps_time = 10;
//设备总发电时间
global.device_generation_time = 10;
//本地负载总用电时间
global.local_consumption_time = 10;
//设备总馈电时间
global.device_feed_in_time = 10;
//设备总运行时间
global.device_running_time = 10;
//当日满发小时
global.day_full_hours = 1;
//当月满发小时
global.month_full_hours = 10;
//当年满发小时
global.year_full_hours = 10;
//累计运行天数
global.running_days = 10;