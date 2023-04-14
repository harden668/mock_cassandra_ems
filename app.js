var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var globalVar = require('./config/globalVar');
const { queryData } = require('./controller/cassandra_con');
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');
app.engine('.html', require('ejs').__express);
app.set('view engine', 'html')

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(async function (req, res, next) {
  console.log('getLastData');
  let inverter_sql = 'SELECT * FROM ems.inverter_data limit 1';
  let pv_sql = 'SELECT * FROM ems.pv_optimizer_data limit 1';
  let statistical_sql = 'SELECT * FROM ems.statistical_data limit 1';
  let inverter_result = await queryData(inverter_sql);
  let pv_result = await queryData(pv_sql);
  let statistical_result = await queryData(statistical_sql);
  if (inverter_result) {
    global.pv_output_energy_day = inverter_result.pv_output_energy_day + Math.floor(Math.random() * 10) + 1;
    global.inverter_grid_energy_day = inverter_result.inverter_grid_energy_day + Math.floor(Math.random() * 10) + 1;
    global.inverter_eps_energy_day = inverter_result.inverter_eps_energy_day + Math.floor(Math.random() * 10) + 1;
    global.device_generation_energy_day = inverter_result.device_generation_energy_day + Math.floor(Math.random() * 10) + 1;
    global.local_consumption_energy_day = inverter_result.local_consumption_energy_day + Math.floor(Math.random() * 10) + 1;
    global.device_feed_in_energy_day = inverter_result.device_feed_in_energy_day + Math.floor(Math.random() * 10) + 1;
  }
  if (pv_result) {
    global.power_generation1 = pv_result.power_generation1 + Math.floor(Math.random() * 10) + 1;
    global.power_generation2 = pv_result.power_generation2 + Math.floor(Math.random() * 10) + 1;
  }
  if (statistical_result) {
    global.pv_output_energy = statistical_result.pv_output_energy + Math.floor(Math.random() * 10) + 1;
    global.inverter_grid_energy = statistical_result.inverter_grid_energy + Math.floor(Math.random() * 10) + 1;
    global.inverter_eps_energy = statistical_result.inverter_eps_energy + Math.floor(Math.random() * 10) + 1;
    global.device_generation_energy = statistical_result.device_generation_energy + Math.floor(Math.random() * 10) + 1;
    global.local_consumption_energy = statistical_result.local_consumption_energy + Math.floor(Math.random() * 10) + 1;
    global.device_feed_in_energy = statistical_result.device_feed_in_energy + Math.floor(Math.random() * 10) + 1;
    global.pv_output_time = statistical_result.pv_output_time + Math.floor(Math.random() * 10) + 1;
    global.inverter_grid_time = statistical_result.inverter_grid_time + Math.floor(Math.random() * 10) + 1;
    global.inverter_eps_time = statistical_result.inverter_eps_time + Math.floor(Math.random() * 10) + 1;
    global.device_generation_time = statistical_result.device_generation_time + Math.floor(Math.random() * 10) + 1;
    global.local_consumption_time = statistical_result.local_consumption_time + Math.floor(Math.random() * 10) + 1;
    global.device_feed_in_time = statistical_result.device_feed_in_time + Math.floor(Math.random() * 10) + 1;
    global.device_running_time = statistical_result.device_running_time + Math.floor(Math.random() * 10) + 1;
  }
  next();
});
app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
