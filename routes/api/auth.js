const express = require('express');
const router = express.Router();
// 导入md5加密
const md5 = require('md5');
// 导入用户文档对象模型
const UserModel = require('../../models/UserModel');
// 导入配置文件
const config = require('../../config');
// jwt控制token
const jwt = require('jsonwebtoken');

const checkAuthMiddleware = require('../../middleware/checkAuthMiddleware');
const checkAdminMiddleware = require('../../middleware/checkAdminMiddleware');
const checkCaptchaMiddleware = require('../../middleware/checkCaptchaMiddleware');
// 导入token校验中间件
const checkTokenMiddleware = require('../../middleware/checkTokenMiddleware');

// 检测token自动登陆接口
router.post('/autoLogin', checkTokenMiddleware, (req, res) => {
  if (req.username == "" || req.userID == "") {
    res.json({
      code: '0000',
      msg: '游客登陆',
      data: {
        username: req.username
      }
    })
  } else {
    UserModel.findOne({
      _id: req.userID,
      is_deleted: false
    }).then(data => {
      const nowTime = String(Date.now());
      UserModel.updateOne({
        _id: req.userID,
        is_deleted: false
      }, {
        lastLoginTime: nowTime
      }).then(data => { })
      res.json({
        code: '0000',
        msg: `${req.username}登陆成功`,
        data: {
          username: req.username,
          userType: data.userType,
          createTime: data.createTime,
          lastLoginTime: nowTime
        }
      })
    }).catch(err => {
      res.json({
        code: '1000',
        msg: '自动登录失败',
        data: null
      })
    })
  }
})

// 登陆API
router.post('/login', checkAuthMiddleware, (req, res) => {
  // 获取用户名和密码
  let { username, password } = req.body;
  // 查询数据库，看有没有该用户
  // 要对密码也做一次md5加密然后去数据库对比
  UserModel.findOne({
    username: username,
    password: md5(password),
    is_deleted: false
  }).then(data => {
    // 如果data为空说明用户不存在
    if (!data) {
      res.json({
        code: '2002',
        msg: '用户名或密码错误',
        data: null
      })
      return;
    }
    // 创建并返回token
    let token = jwt.sign({
      username: data.username,
      _id: data._id,
      userType: data.userType
    }, config.token_secret, {
      // 7天过期
      expiresIn: 60 * 60 * 24 * 7
    });
    const nowTime = String(Date.now());
    UserModel.updateOne(
      {
        _id: data._id,
        is_deleted: false
      },
      { lastLoginTime: nowTime }
    ).then(data => { })
    res.json({
      code: '0000',
      msg: '登陆成功',
      data: {
        username,
        token: token,
        userType: data.userType,
        createTime: data.createTime,
        lastLoginTime: nowTime
      }
    })
  }).catch(err => {
    res.json({
      code: '2000',
      msg: '登陆出错',
      data: null
    })
  })
});

// 注册API
router.post('/reg', checkAuthMiddleware, checkCaptchaMiddleware, (req, res) => {
  // 如果用户名重复就重新注册
  UserModel.findOne({
    username: req.body.username,
    // 即使是标记删除了的用户名，仍然做保留，不允许复用注册
    // is_deleted: false
  }).then(async (data) => {
    // data不为空说明用户名重复
    if (data) {
      res.json({
        code: '2011',
        msg: '用户名已存在',
        data: null
      })
      return;
    }
    // 判断用户文档是否为空，为空则第一个注册的用户为super超级管理员
    const users = await UserModel.find({}); // 查找所有用户文档
    // 用户名不重复则创建用户
    UserModel.create({
      username: req.body.username,
      // 使用md5对密码进行加密
      password: md5(req.body.password),
      userType: users.length === 0 ? 'super' : 'user',
      createTime: String(Date.now())
    }).then(data => {
      res.json({
        code: '0000',
        msg: '注册成功',
        data: {
          username: req.body.username,
          userType: data.userType,
          createTime: data.createTime,
          lastLoginTime: data.lastLoginTime
        }
      })
    }).catch(err => {
      console.log(err);
      res.json({
        code: '2010',
        msg: '注册失败',
        data: null
      })
    })
  })
});

// 退出登陆
router.post('/logout', (req, res) => {
  // 客户端删除token即可
  res.json({
    code: '0000',
    msg: '退出成功',
    data: null
  })
});

// 设为管理员
router.post('/user/setAdmin', checkTokenMiddleware, (req, res) => {
  if (req.userType !== "super") {
    res.json({
      code: '3002',
      msg: '没有超级管理员权限',
      data: null
    })
    return;
  }
  let { username } = req.body;
  UserModel.findOne({
    username: username,
    is_deleted: false
  }).then((data) => {
    if (data.userType === "super") {
      return res.json({
        code: '3002',
        msg: '超级管理员无法再设为管理员',
        data: null
      })
    }
    UserModel.updateOne({
      _id: data._id,
      is_deleted: false
    }, { userType: "admin" }).then((data) => {
      res.json({
        code: '0000',
        msg: '设置成功',
        data: null
      })
    });
  }).catch((err) => {
    console.log(err)
    res.json({
      code: '2001',
      msg: '设置失败',
      data: null
    })
  })
});

// 移除管理员
router.post('/user/removeAdmin', checkTokenMiddleware, (req, res) => {
  if (req.userType !== "super") {
    res.json({
      code: '3002',
      msg: '没有超级管理员权限',
      data: null
    })
    return;
  }
  let { username } = req.body;
  UserModel.findOne({
    username: username,
    is_deleted: false
  }).then((data) => {
    if (data.userType === "super") {
      return res.json({
        code: '3002',
        msg: '超级管理员无法移除',
        data: null
      })
    }
    UserModel.updateOne({
      _id: data._id,
      is_deleted: false
    }, { userType: "user" }).then((data) => {
      res.json({
        code: '0000',
        msg: '移除成功',
        data: null
      })
    });
  }).catch((err) => {
    console.log(err)
    res.json({
      code: '2001',
      msg: '移除失败',
      data: null
    })
  })
});

// 删除用户
router.post('/user/delete', checkTokenMiddleware, checkAdminMiddleware, (req, res) => {
  let { username } = req.body;
  UserModel.findOne({
    username: username,
    is_deleted: false
  }).then(async (data) => {
    if (data.userType === "super") {
      return res.json({
        code: '3002',
        msg: '超级管理员无法删除',
        data: null
      })
    }
    if (req.userType === "admin" && data.userType === "admin") {
      return res.json({
        code: '3002',
        msg: '管理员只能由超级管理员删除',
        data: null
      })
    }
    await UserModel.updateOne({
      _id: data._id,
      is_deleted: false
    }, {
      is_deleted: true,
      deleted_at: String(Date.now())
    });
    res.json({
      code: '0000',
      msg: `删除成功`,
      data: null
    })
  }).catch((err) => {
    console.log(err)
    res.json({
      code: '2001',
      msg: '删除失败',
      data: null
    })
  })
});





module.exports = router;