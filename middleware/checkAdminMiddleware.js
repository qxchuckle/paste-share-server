const UserModel = require('../models/UserModel');
// 用于检查管理员权限
const checkAdminMiddleware = async (req, res, next) => {
  if (req.userID == "" || req.username == "") {
    res.json({
      code: '3001',
      msg: '游客尚未登陆',
      data: null
    })
    return;
  }
  if (req.userType !== "admin" && req.userType !== "super") {
    res.json({
      code: '3002',
      msg: '没有管理员权限',
      data: null
    })
    return;
  }
  const data = await UserModel.findOne({
    _id: req.userID,
    is_deleted: false
  })
  if (data.userType !== 'super' && data.userType !== 'admin') {
    res.json({
      code: '9013',
      msg: '无权限',
      data: null
    })
    return;
  }
  next();
}
module.exports = checkAdminMiddleware