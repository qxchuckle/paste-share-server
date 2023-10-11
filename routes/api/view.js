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
const checkAdminMiddleware = require('../../middleware/checkAdminMiddleware');

const createSharesView = async () => {
  try {
    const resultWithUser = await ShareModel.aggregate([
      {
        $match: {
          is_deleted: false,
        }
      },
      {
        $addFields: {
          user_id: {
            $cond: {
              if: { $ne: ["$user_id", ""] },
              then: { $toObjectId: "$user_id" },
              else: "$user_id",
            },
          },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: "$user"
      },
      {
        $project: {
          _id: 0,
          title: 1,
          language: 1,
          content: 1,
          time: 1,
          visits: 1,
          share_id: 1,
          user: {
            username: 1
          }
        }
      }
    ]);

    const resultWithEmptyUserId = await ShareModel.aggregate([
      {
        $match: {
          user_id: "",
          is_deleted: false
        }
      },
      {
        $project: {
          _id: 0,
          title: 1,
          language: 1,
          content: 1,
          time: 1,
          visits: 1,
          share_id: 1,
          user: {
            username: ""
          }
        }
      }
    ]);

    const finalResult = [...resultWithUser, ...resultWithEmptyUserId];
    finalResult.sort((a, b) => b.time - a.time);
    // console.log(finalResult);
    return finalResult;
  } catch (error) {
    console.error(error);
  }
};

router.get('/view', checkTokenMiddleware, checkAdminMiddleware, async (req, res) => {
  try {
    const shares = await createSharesView();
    const users = await UserModel.find({ is_deleted: false })
      .select({ username: 1, userType: 1, createTime: 1, lastLoginTime: 1, _id: 1 })

    for (let item of shares) {
      if (item.content.length > 50) {
        item.content = item.content.slice(0, 50);
      }
    }
    res.json({
      code: '0000',
      msg: '概览',
      data: {
        shares,
        users
      }
    })
  } catch (err) {
    res.json({
      code: '4001',
      msg: '内部错误',
      data: null
    })
    return;
  }

});

router.get('/view/users', checkTokenMiddleware, checkAdminMiddleware, async (req, res) => {
  try {
    const users = await UserModel.find({ is_deleted: false })
      .select({ username: 1, userType: 1, createTime: 1, lastLoginTime: 1, _id: 0 })
    res.json({
      code: '0000',
      msg: '概览',
      data: {
        users
      }
    })
  } catch (err) {
    res.json({
      code: '4001',
      msg: '内部错误',
      data: null
    })
    return;
  }

});

router.get('/view/shares', checkTokenMiddleware, checkAdminMiddleware, async (req, res) => {
  try {
    const shares = await createSharesView();

    for (let item of shares) {
      if (item.content.length > 50) {
        item.content = item.content.slice(0, 50);
      }
    }
    res.json({
      code: '0000',
      msg: '概览',
      data: {
        shares
      }
    })
  } catch (err) {
    res.json({
      code: '4001',
      msg: '内部错误',
      data: null
    })
    return;
  }

});



module.exports = router;
