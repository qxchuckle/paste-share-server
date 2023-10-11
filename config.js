const config = {
  URL: process.env.MODB_URL || 'mongodb://127.0.0.1:27017/paste',
  // 加密字符串
  session_secret: 'chuckle',
  token_secret: 'chuckle'
}
module.exports = config;