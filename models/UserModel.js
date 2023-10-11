/* 用户模型 */
const mongoose = require('mongoose')
// 文档结构对象
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  // 用户类型，普通或管理员
  // user普通用户 admin管理员 super超级管理员
  userType: {
    type: String,
    required: true,
    enum: ['super', 'admin', 'user'],
  },
  // 用户创建时间，时间戳
  createTime: {
    type: String,
    required: true,
  },
  // 用户最近一次登录时间，时间戳
  lastLoginTime: {
    type: String,
    default: "",
  },
  // 删除标记位
  is_deleted: {
    type: Boolean,
    default: false
  },
  // 删除时间
  deleted_at: {
    type: String,
    default: null
  }
})
// 文档模型对象
const UserModel = mongoose.model('users', UserSchema)

module.exports = UserModel