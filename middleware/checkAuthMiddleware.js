// 登陆注册中间件
const checkAuthMiddleware = (req, res, next) => {
  let { username, password } = req.body;
  // console.log(req.body);
  // 如果用户名或密码为空则返回失败
  if (!username || !password) {
    res.json({
      code: '2001',
      msg: '用户名或密码为空',
      data: null
    })
    return;
  }
  next();
}
module.exports = checkAuthMiddleware