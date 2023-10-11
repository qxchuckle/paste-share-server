// 暴露一个函数，success数据库连接成功的回调，error连接失败的回调
module.exports = function (success, error = () => { console.log('连接失败'); }) {

  const mongoose = require('mongoose');
  // 导入数据库连接配置文件
  const config = require('../config');

  // mongoose.connect(`mongodb://${HOST}:${PORT}/${NAME}`);
  mongoose.connect(config.URL);

  mongoose.connection.once('open', () => {
    console.log('连接成功')
    success();
  });
  // 设置连接错误的回调
  mongoose.connection.on('error', () => {
    error();
  });
  //设置连接关闭的回调
  mongoose.connection.on('close', () => {
    console.log('连接关闭');
  });

}