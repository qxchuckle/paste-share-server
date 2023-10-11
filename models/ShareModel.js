/* 用户模型 */
const mongoose = require('mongoose')
// 文档结构对象
const ShareSchema = new mongoose.Schema({
  title: {
    type: String,
    default: ""
  },
  language: {
    type: String,
    default: "",// 默认为纯文本
  },
  password: {
    type: String,
    default: "",// 默认没密码
  },
  content: {
    type: String,
    required: true
  },
  // 存时间戳
  time: {
    type: String,
    required: true
  },
  visits: {
    type: Number,
    default: 0
  },
  user_id: {
    type: String,
    default: "",
  },
  share_id: {
    type: String,
    unique: true,
    required: true
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
  // 设置文档自动过期
  // expireAt: {
  //   type: Date,
  //   default: Date.now,
  //   index: { expires: 604800 }
  // }
})

// 文档模型对象
const ShareModel = mongoose.model('shares', ShareSchema)

module.exports = ShareModel