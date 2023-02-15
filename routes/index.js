var express = require('express');
var router = express.Router();
const queryData = require('../controller/cassandra_con.js');
/* GET home page. */
router.get('/', function (req, res, next) {
  console.log('/我被调用了');
  res.render('index', { title: 'Express' });
});
router.post('/Insert_current', async function (req, res, next) {
  try {
    const { mock_name, interval_time } = req.body;
    // console.log(mock_name);
    // console.log(interval_time);
    console.log('/Insert_current我被调用了');
    let sql = `SELECT max(timestamp) as time
                FROM boxonline
                WHERE timestamp <= toTimestamp(now())
                and idbox = ?
                and isonline = 1 ALLOW FILTERING;`;
    let result = await queryData(sql, 1);
    let log_data = '插入了一条输入电流1数据';
    console.log('result', result);
    if (result) {
      res.status(200).json({
        code: 200,
        summary: 'success',
        data: log_data
      })
    } else {
      res.status(500).json({
        code: 500,
        summary: 'not found',
        data: result
      })
    }
  } catch (e) {
    console.log(e);
  }
})

router.post('/Insert_voltage', async function (req, res, next) {
  try {
    const { mock_name, interval_time } = req.body;
    // console.log(mock_name);
    // console.log(interval_time);
    console.log('/Insert_voltage我被调用了');
    let sql = `SELECT max(timestamp) as time
                FROM boxonline
                WHERE timestamp <= toTimestamp(now())
                and idbox = ?
                and isonline = 1 ALLOW FILTERING;`;
    let result = await queryData(sql, 1);
    let log_data = '插入了一条输入电压1数据';
    console.log('result', result);
    if (result) {
      res.status(200).json({
        code: 200,
        summary: 'success',
        data: log_data
      })
    } else {
      res.status(500).json({
        code: 500,
        summary: 'not found',
        data: result
      })
    }
  } catch (e) {
    console.log(e);
  }
})
module.exports = router;
