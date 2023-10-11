const express = require('express');
const router = express.Router();
// 导入md5加密
const md5 = require('md5');
// 导入用户文档对象模型
const ShareModel = require('../../models/ShareModel');
const UserModel = require('../../models/UserModel');
// 导入配置文件
const config = require('../../config');
// 导入token校验中间件
const checkTokenMiddleware = require('../../middleware/checkTokenMiddleware');
// 导入shortid生成分享唯一id
const shortid = require('shortid');

router.get('/share', checkTokenMiddleware, (req, res) => {
  if (req.userID == "" || req.username == "") {
    res.json({
      code: '3011',
      msg: '游客尚未登陆',
      data: null
    })
    return;
  }
  // 记录集合的长度
  let shareSize = 0;
  let keyword = req.query.keyword || ""; // 查找关键字
  let condition = {
    $and: [
      {
        $or: [
          { content: { $regex: keyword, $options: 'i' } },
          { title: { $regex: keyword, $options: 'i' } },
        ]
      },
      {
        user_id: req.userID,
        is_deleted: false
      }
    ]
  }
  // 查找符合关键字条件的文档总数，用于展示分页
  ShareModel.countDocuments(condition)
    .then((count) => {
      shareSize = count;
      // console.log(shareSize);
      let page = Number(req.query.page) || 1; // 第几页，默认获取第一页
      let shareNum = Number(req.query.shareNum) || shareSize; // 每页多少个文章，默认获取全部
      ShareModel.find(condition)
        .select({ share_id: 1, title: 1, content: 1, time: 1, language: 1, _id: 0 })
        .sort({ time: -1 })
        .skip((page - 1) * shareNum)
        .limit(shareNum)
        .then((data) => {
          for (let item of data) {
            if (item.content.length > 50) {
              item.content = item.content.slice(0, 50);
            }
          }
          res.json({
            code: '0000',
            msg: '获取分享列表成功',
            data: {
              shareList: data,
              shareSize
            }
          })
        }).catch(err => {
          console.log(err);
          res.json({
            code: '3000',
            msg: '获取分享列表失败',
            data: null
          })
        })
    }).catch((err) => {
      console.log(`Error: ${err}`);
    });
})


// 获取具体内容
router.get('/share/one', (req, res) => {
  // 需要传入share_id、password
  ShareModel.findOne({
    share_id: req.query.share_id,
    is_deleted: false
  })
    .select({ _id: 0, __v: 0 })
    .then(async (data) => {
      if (data.password && !req.query.password) {
        res.json({
          code: '3030',
          msg: '请输入密码',
          data: null
        });
      } else if (data.password && data.password !== md5(req.query.password)) {
        res.json({
          code: '3000',
          msg: '密码错误',
          data: null
        });
      } else {
        let owner;
        if (data.user_id !== "") {
          // 找到当前分享的所有者
          owner = await UserModel.findOne({
            _id: data.user_id,
            is_deleted: false
          })
            .select({ username: 1, _id: 0 });
        }
        data.visits++;
        // 更新访问量
        await ShareModel.updateOne(
          {
            share_id: req.query.share_id,
            is_deleted: false
          },
          { visits: data.visits },
        ).then(data => { }).catch(err => { });
        data.password = "*";
        data.user_id = "*";
        res.json({
          code: '0000',
          msg: '获取分享成功',
          data: {
            ...data._doc,
            owner_name: owner ? owner.username : ""
          }
        });
      }
    }).catch(err => {
      console.log(err);
      res.json({
        code: '3000',
        msg: '获取分享失败',
        data: null
      })
    })
})

router.post('/share/add', checkTokenMiddleware, (req, res) => {
  let { title, language, password, content } = req.body
  if (!content) {
    res.json({
      code: '3011',
      msg: '内容不能为空',
      data: null
    })
    return;
  }
  let share = {
    title,
    language,
    password: password ? md5(password) : "",
    content,
    time: String(Date.now()),
    user_id: req.userID,
    share_id: shortid.generate()
  }
  ShareModel.create(share).then(data => {
    res.json({
      code: '0000',
      msg: '创建分享成功',
      data: {
        share_id: data.share_id,
      }
    })
  }).catch(err => {
    console.log(err);
    res.json({
      code: '3010',
      msg: '创建分享失败',
      data: null
    })
  })


})

router.post('/share/delete', checkTokenMiddleware, async (req, res) => {
  let { share_id } = req.body;
  if (req.userID == "" || req.username == "") {
    res.json({
      code: '3020',
      msg: '游客状态删除失败',
      data: null
    })
    return;
  }
  if (req.userType === 'super' || req.userType === 'admin') {
    try {
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
      await ShareModel.updateOne({
        share_id,
        is_deleted: false
      }, {
        is_deleted: true,
        deleted_at: String(Date.now())
      })
      // await ShareModel.deleteOne({ share_id })
      res.json({
        code: '0000',
        msg: '删除成功',
        data: null
      })
    } catch (err) {
      console.log(err);
      res.json({
        code: '3021',
        msg: '删除失败',
        data: null
      })
    }
    return;
  }
  ShareModel.findOne({
    share_id,
    is_deleted: false
  })
    .select({ _id: 0, __v: 0 })
    .then(async (data) => {
      if (req.userID === data.user_id) {
        await ShareModel.updateOne({
          share_id,
          is_deleted: false
        }, {
          is_deleted: true,
          deleted_at: String(Date.now())
        })
        // await ShareModel.deleteOne({ share_id })
        res.json({
          code: '0000',
          msg: '删除成功',
          data: null
        })
      } else {
        res.json({
          code: '3021',
          msg: '无删除权限',
          data: null
        })
      }
    }).catch(err => {
      console.log(err);
      res.json({
        code: '3021',
        msg: '删除失败',
        data: null
      })
    })

})

router.post('/share/modify', checkTokenMiddleware, async (req, res) => {
  let { title, language, password, content, share_id } = req.body
  if (!content) {
    res.json({
      code: '3031',
      msg: '内容不能为空',
      data: null
    })
    return;
  }
  if (req.userID == "" || req.username == "") {
    res.json({
      code: '3032',
      msg: '游客无法修改任何分享',
      data: null
    })
    return;
  }
  let share = {
    title,
    language,
    password: password ? md5(password) : "",
    content
  }
  ShareModel.findOne({
    share_id,
    is_deleted: false
  })
    .select({ _id: 0, __v: 0 })
    .then(async (data) => {
      if (req.userID === data.user_id) {
        ShareModel.updateOne({
          share_id,
          is_deleted: false
        }, share).then(data => {
          // console.log(data);
          res.json({
            code: '0000',
            msg: '修改分享成功',
            data: {
              share_id,
            }
          })
        })
      } else {
        res.json({
          code: '3033',
          msg: '无修改权限',
          data: null
        })
      }
    }).catch(err => {
      console.log(err);
      res.json({
        code: '3030',
        msg: '修改失败',
        data: null
      })
    })

})

module.exports = router;