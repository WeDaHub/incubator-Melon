
const cloud = require('wx-server-sdk');

// 初始化 cloud
cloud.init({
  env: 'easy-0gbndsc500912db9',
});

const db = cloud.database();

/**
 * 获取用户信息
 * @param {*} event 小程序端传入的参数
 * @param {*} context  环境变量
 */
exports.main = async () => {
  // 获取 WX Context (微信调用上下文)，包括 OPENID、APPID、及 UNIONID（需满足 UNIONID 获取条件）等信息
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  // 根据openid查询用户信息
  const userResult = await db.collection('user')
    .where({ _openid: openid })
    .get();

  const userInfo = (userResult.data && userResult.data[0]) || {};

  return {
    openId: openid || userInfo.openid || '',
    // eslint-disable-next-line no-underscore-dangle
    docId: userInfo._id || '',
    avatarUrl: userInfo.avatarUrl,
    nickName: userInfo.nickName,
    bestScore: userInfo.bestScore,
  };
};

