const Game = require('./game.js');
const { imgMap, rankPic, audioMap } = require('./config.js');

Page({
  isNeedUpdateBestScore: false, // 打标记录，是否需要在onHide时更新DB中最高分
  tempBestScore: 0, // 游戏过程中产生的最高分，游戏结束或退出游戏后更新
  gameInstance: null, // 游戏实例
  touchStartX: 0, // 触摸相关变量
  touchStartY: 0,
  touchEndX: 0,
  touchEndY: 0,
  clearAudioContext: wx.createInnerAudioContext(), // 效果声音
  succAudioContext: wx.createInnerAudioContext(),
  failAudioContext: wx.createInnerAudioContext(),

  data: {
    isLoading: true, // 接口加载中，默认true
    isAuthing: false, // 授权中，避免重复点击
    isShowAuth: false, // 展示授权按钮。不管同意还是拒绝，最终都进入游戏页面，默认false
    isPlayMusic: true, // 默认开启声音，默认true
    isShowRule: false, // 是否展示规则
    isShowRank: false, // 是否展示排行榜
    docId: '', // 用户记录id，用户更新分数
    openId: '', // 用户openId
    avatarUrl: '../../images/logo.png', // 用户头像
    nickName: '游客', // 昵称
    nowScore: 0, // 当前分数
    bestScore: 0, // 最高分
    imgMap, // 分数水果映射表
    mode: 'melon', // 游戏模式: basic、melon
    totalUser: '', // 参与总人数
    rankList: [], // 排行榜
    num: [], // 面板上4x4 二维数组
    endMsg: '', // 游戏结束
    over: false, // 游戏是否结束
  },

  // 页面加载后
  onLoad() {
    // 初始化音频
    this.initAudio();

    // 查询用户信息，是否有头像昵称，没有则需要授权
    this.getUserInfo();
  },

  // 页面渲染完成
  onReady() {
    // 初始化游戏
    this.initGame();
  },

  // 用户离开记录最高分数
  onHide() {
    // 如果当前分数大于最高分数，更新最高分数
    if (this.isNeedUpdateBestScore && this.tempBestScore > this.data.bestScore) {
      this.insertOrUpdateUser({ bestScore: this.tempBestScore });
    }
  },

  /**
   * 初始化游戏音效
   */
  initAudio() {
    // 设置游戏声音
    this.clearAudioContext.src = audioMap.clear;
    this.clearAudioContext.volume = 0.4;
    this.succAudioContext.src = audioMap.success;
    this.failAudioContext.src = audioMap.fail;
  },

  /**
   * 调用云函数从 DB 查询当前用户信息
   */
  getUserInfo() {
    // 调用云函数，根据openid查询db
    wx.cloud
      .callFunction({
        name: 'login',
        data: {},
      })
      .then((res) => {
        setTimeout(() => {
          const { result } = res;
          // DB可以查询出头像昵称，代表插入了数据
          this.setData({
            isShowAuth: !result.avatarUrl || !result.nickName, // 用户没有头像或昵称，则引导去授权
            avatarUrl: result.avatarUrl,
            nickName: result.nickName,
            bestScore: result.bestScore || 0,
            openId: result.openId,
            docId: result.docId,
            isLoading: false,
          });
        }, 1600);
      })
      .catch((err) => {
        setTimeout(() => {
          this.setData({
            isLoading: false,
            isShowAuth: true,
          });
        }, 1600);

        console.error('[云函数] [login] 调用失败', err);
      });
  },

  /**
   * 用户授权后获取用户头像、昵称信息
   */
  getUserProfile() {
    if (this.data.isAuthing) return false;
    // 推荐使用wx.getUserProfile获取用户信息，开发者每次通过该接口获取用户个人信息均需用户确认，开发者妥善保管用户快速填写的头像昵称，避免重复弹窗
    wx.getUserProfile({
      desc: '展示用户信息', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
      success: (res) => {
        this.setData({
          avatarUrl: res.userInfo.avatarUrl,
          nickName: res.userInfo.nickName,
        });

        // 存入DB
        this.insertOrUpdateUser({
          avatarUrl: res.userInfo.avatarUrl,
          nickName: res.userInfo.nickName,
        });
      },
      complete: () => {
        this.setData({
          isShowAuth: false,
          isAuthing: false,
        });
      },
    });
  },

  /**
   * 插入或修改用户信息
   * @param {*} data
   */
  insertOrUpdateUser(data) {
    if (this.data.docId) {
      this.updateUser(data);
    } else {
      this.addUser(data);
    }
  },

  /**
   * 新增用户信息
   * @param {*} data
   */
  addUser(data) {
    const db = wx.cloud.database();

    db.collection('user')
      .add({
        data,
      })
      .then((res) => {
        // 在返回结果中会包含新创建的记录的 _id
        this.setData({
          // eslint-disable-next-line no-underscore-dangle
          docId: res._id,
        });
      })
      .catch((err) => {
        console.error('add user fail：', err);
      });
  },

  /**
   * 更新数据，更新头像昵称，或分数
   */
  updateUser(data) {
    const db = wx.cloud.database();

    db.collection('user')
      .doc(this.data.docId)
      .update({
        data,
      })
      .then(() => {})
      .catch(() => {});
  },

  /**
   * 昵称脱敏
   * @param {*} name
   */
  formatName(name) {
    let newStr;
    if (name.length === 2) {
      newStr = `${name.substr(0, 1)}*`;
    } else if (name.length > 2) {
      let char = '';
      // 最多3个星号吧
      for (let i = 0, len = Math.min(name.length - 2, 3); i < len; i++) {
        char += '*';
      }
      newStr = name.substr(0, 1) + char + name.substr(-1, 1);
    } else {
      newStr = name;
    }
    return newStr;
  },

  /**
   * 获取排行榜
   */
  getUserRankList() {
    const db = wx.cloud.database();

    // 获取排行榜
    db.collection('user')
      .orderBy('bestScore', 'desc')
      .skip(0)
      .limit(30)
      .get()
      .then((res) => {
        console.log('ranklist', res.data);

        // 处理数据，图片、昵称
        const rankList = res.data.map((item, index) => {
          const picIdx = index < 3 ? index + 1 : 4;
          return { ...item, rankPic: rankPic[picIdx], nick: this.formatName(item.nickName || '') };
        });

        this.setData({
          rankList,
        });
      })
      .catch((err) => {
        console.log('===getUserRankList error: ', err);
      });

    // 参与总人数
    db.collection('user')
      .count()
      .then((res) => {
        this.setData({
          totalUser: res.total,
        });
      })
      .catch((err) => {
        console.log('===get user count error: ', err);
      });
  },

  /**
   * 初始化游戏
   */
  initGame() {
    this.gameInstance = new Game(4);
    this.setData({
      nowScore: 0,
      over: false,
      num: this.gameInstance.board.grid,
    });
  },

  /**
   * 是否通关
   */
  isPass() {
    const data = this.data.num;
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (data[i][j] >= 2048) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * 游戏结束文案和音效处理
   */
  gameOver() {
    // 游戏结束
    this.setData({
      over: true,
    });
    const { mode } = this.data;
    const isPass = this.isPass();

    if (isPass) {
      this.setData({
        endMsg: mode === 'melon' ? '恭喜成功吃瓜！' : '恭喜达到2048！',
      });
    } else if (this.data.nowScore > this.data.bestScore) {
      this.setData({
        endMsg: '创造新纪录！',
      });
    } else {
      this.setData({
        endMsg: '游戏结束！',
      });
    }

    // 游戏结束需要更新最高分
    if (this.data.nowScore > this.data.bestScore) {
      this.insertOrUpdateUser({ bestScore: this.data.nowScore });

      this.isNeedUpdateBestScore = false;
      this.tempBestScore = 0;

      this.setData({
        bestScore: this.data.nowScore,
      });
    }

    if (this.data.isPlayMusic) {
      if (isPass) {
        this.succAudioContext.play();
      } else {
        this.failAudioContext.play();
      }
    }
  },

  touchStart(ev) {
    // 触摸开始坐标
    const touch = ev.touches[0];
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  },

  touchMove(ev) {
    // 触摸最后移动时的坐标
    const touch = ev.touches[0];
    this.touchEndX = touch.clientX;
    this.touchEndY = touch.clientY;
  },

  touchEnd() {
    const disX = this.touchStartX - this.touchEndX;
    const absdisX = Math.abs(disX);
    const disY = this.touchStartY - this.touchEndY;
    const absdisY = Math.abs(disY);

    if (this.gameInstance.isOver()) {
      // 游戏是否结束
      this.gameOver();
    } else {
      if (Math.max(absdisX, absdisY) > 5) {
        // 确定是否在滑动
        const x = disX < 0 ? 1 : 3;
        const y = disY < 0 ? 2 : 0;
        const direction = (absdisX > absdisY) ? x : y; // 确定移动方向
        const data = this.gameInstance.move(direction);
        this.updateView(data);
      }
    }
  },

  /**
   * 更新游戏面板二维数组数字
   * @param {*} data
   */
  updateView(data) {
    let score = 0; // 分数，面板数字求和
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if (data[i][j] !== '') score += data[i][j];

    this.setData({
      num: data,
      nowScore: score,
    });

    if (this.data.isPlayMusic) {
      this.clearAudioContext.play();
    }

    // 当前分数是否破纪录，是则更新DB和bestCore
    if (score > this.data.bestScore) {
      this.tempBestScore = score;
      this.isNeedUpdateBestScore = true;
    }
  },

  // 切换模式
  switchModeType() {
    if (this.data.mode === 'melon') {
      this.setData({
        mode: 'basic',
      });
      return;
    }
    this.setData({
      mode: 'melon',
    });
  },

  switchMusic() {
    this.setData({
      isPlayMusic: !this.data.isPlayMusic,
    });
  },

  showRankDia() {
    if (!this.data.rankList.length || !this.data.totalUser) {
      this.getUserRankList();
    }

    this.setData({
      isShowRank: true,
    });
  },

  closeRankDia() {
    this.setData({
      isShowRank: false,
    });
  },

  showRule() {
    this.setData({
      isShowRule: true,
    });
  },

  closeRule() {
    this.setData({
      isShowRule: false,
    });
  },

  onShareAppMessage() {
    return {
      title: '这个夏天，一起来吃瓜~',
      path: '/pages/index/index',
    };
  },
});
