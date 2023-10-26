const express = require('express');
const router = express.Router();
const svgCaptcha = require('svg-captcha');
// 导入md5加密
const md5 = require('md5');
// 导入用户文档对象模型
const CaptchaModel = require('../../models/CaptchaModel');
const shortid = require('shortid');


router.get('/captcha', async (req, res) => {
  // /api/captcha?height=100&width=300
  const { width, height, id } = req.query;
  const codeConfig = {
    inverse: false, // 翻转颜色
    fontSize: height ? height - 2 : 48, // 字体大小
    noise: 2, // 干扰线条数
    width: width || 150, // 宽度
    height: height || 50, // 高度
    size: 4, // 验证码长度
    ignoreChars: '0o1i', // 验证码字符中排除 0o1i
    color: true, // 验证码是否有彩色
    background: '#F1F3F4', // 验证码图片背景颜色
  }
  try {
    const captcha = svgCaptcha.create(codeConfig);
    console.log(captcha.text);
    const data = await CaptchaModel.findOne({
      captcha_id: id
    });
    const captcha_id = shortid.generate();
    if (data) {
      await CaptchaModel.updateOne({
        captcha_id: id
      }, {
        captcha_text: captcha.text
      });
    } else {
      await CaptchaModel.create({
        captcha_id: captcha_id,
        captcha_text: captcha.text
      })
    }
    return res.json({
      code: '0000',
      msg: 'success',
      data: {
        id: data ? id : captcha_id,
        svg: captcha.data
      }
    })
  } catch (e) {
    console.log(e);
    return res.json({
      code: '5020',
      msg: '生成验证码出错',
      data: null
    })
  }

});




module.exports = router;

