const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

// 导入路由
const authRouter = require('./routes/api/auth.js');
const shareRouter = require('./routes/api/share');
const viewRouter = require('./routes/api/view');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 解决API跨域问题
const allowedOrigins = ['http://127.0.0.1:3000','http://127.0.0.1:5173', 'http://127.0.0.1:3001', 'https://s.qcqx.cn', 'http://s.qcqx.cn', undefined];
app.all("/*", function (req, res, next) {
  if (allowedOrigins.includes(req.headers.origin)) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Content-Type', 'application/json;charset=utf-8');
    res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, PATCH ,OPTIONS');
    res.header("Access-Control-Allow-Credentials", true); // 跨域的时候是否携带cookie
    if (req.method.toLowerCase() == 'options')
      res.send(200); // 让options 尝试请求快速结束
    else 
      next();
  }else{
    res.json({
      code: 9403,
      msg: '没有访问权限',
      data: null
    })
  }
})

// 使用接口路由，路径添加api前缀
app.use('/api', authRouter);
app.use('/api', shareRouter);
app.use('/api', viewRouter);

// 最后兜底的路由
app.all('*', (req,res) => {
  res.json({
    code: 9001,
    msg: '无效的api',
    data: null
  })
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({
    code: '9002',
    msg: '服务器内部错误',
    data: null
  })
});

module.exports = app;
