const jwt = require("jsonwebtoken");
const config = require('../config');

const checkTokenMiddleware = (req, res, next) => {
  // 获取请求头中的token
  let token = req.get('token');
  if (!token) {
    // 游客信息，都为空
    req.username = "";
    req.userID = "";
    req.userType = "";
    next();
  } else {
    jwt.verify(token, config.token_secret, (err, data) => {
      if (err) {
        res.json({
          code: '9012',
          msg: 'token校验失败',
          data: null
        })
        return;
      }
      // 校验成功后，将username和userID绑定到req上
      req.username = data.username;
      req.userID = data._id;
      req.userType = data.userType;
      next();
    })
  }
}

module.exports = checkTokenMiddleware;