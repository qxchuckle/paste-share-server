const CaptchaModel = require('../models/CaptchaModel');
const checkCaptchaMiddleware = async (req, res, next) => {
  let { captcha_id, captcha_text } = req.body;
  if (!captcha_id || !captcha_text) {
    return res.json({
      code: '5001',
      msg: '请输入验证码',
      data: null
    })
  }
  const data = await CaptchaModel.findOne({ captcha_id });
  if (!data) {
    return res.json({
      code: '5002',
      msg: '验证码已过期',
      data: null
    })
  }
  if (data.captcha_text.toLowerCase() !== captcha_text.toLowerCase()) {
    return res.json({
      code: '5003',
      msg: '验证码输入错误',
      data: null
    })
  }
  next();
}
module.exports = checkCaptchaMiddleware