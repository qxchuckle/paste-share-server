const mongoose = require('mongoose')
// 文档结构对象
const CaptchaSchema = new mongoose.Schema({
  captcha_id: {
    type: String,
    required: true
  },
  captcha_text: {
    type: String,
    required: true
  },
  // 设置文档自动过期
  expireAt: {
    type: Date,
    default: Date.now,
    index: { expires: 60 * 10 } // 验证码10分钟左右过期
  }
})

// 文档模型对象
const CaptchaModel = mongoose.model('captchas', CaptchaSchema)

module.exports = CaptchaModel