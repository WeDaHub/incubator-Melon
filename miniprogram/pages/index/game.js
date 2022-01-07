const Board = require('./board.js');

function Game(size) {
  this.size = size;
  this.startData = 2; // 初始填充2个数据
  this.init();
}

Game.prototype = {
  /**
   * 初始游戏，填充数据
   */
  init() {
    this.board = new Board(this.size);
    this.bproto = this.board.__proto__;
    this.setDataRandom();
    // 初始化后，重置startData为1，每次只填充一个格子
    this.startData = 1;
  },

  setDataRandom() {
    for (let i = 0; i < this.startData; i++) {
      this.addRandomData();
    }
  },

  // 填充数据
  addRandomData() {
    if (!this.board.cellEmpty()) {
      const value = Math.random() < 0.9 ? 2 : 4;
      const cell = this.board.selectCell();
      cell.val = value;
      this.update(cell);
    }
  },

  // 更新数据
  update(cell) {
    this.board.grid[cell.x][cell.y] = cell.val;
  },


  /**
   * 上下左右移动操作
   * @param {*} dir
   */
  move(dir) {
    // 0:上, 1:右, 2:下, 3:左
    const curList = this.formList(dir);

    const list = this.combine(curList);
    const result = [[], [], [], []];

    for (let i = 0; i < this.size; i++) for (let j = 0; j < this.size; j++) {
      switch (dir) {
        // 上移，左移 -> 上移，
        case 0:
          result[i][j] = list[j][i];
          break;
          // 右移，左移 -> 右移
        case 1:
          result[i][j] = list[i][this.size - 1 - j];
          break;
          // 下移，左移 -> 下移
        case 2:
          result[i][j] = list[j][this.size - 1 - i];
          break;
          // 左移，不变
        case 3:
          result[i][j] = list[i][j];
          break;
      }
    }
    this.board.grid = result;
    this.setDataRandom();

    return result;
  },


  /**
   * 将四个方向的移动都转化为左移
   * @param {*} dir
   */
  formList(dir) {
    const list = [[], [], [], []];
    for (let i = 0; i < this.size; i++) for (let j = 0; j < this.size; j++) {
      switch (dir) {
        case 0:
          // 上移 -> 左移， 矩阵逆时针转90度，第1行变第1列
          list[i].push(this.board.grid[j][i]);
          break;
        case 1:
          // 右移 -> 左移，矩阵左右翻转，第4列变第1列
          list[i].push(this.board.grid[i][this.size - 1 - j]);
          break;
          // 下移 -> 左移，矩阵顺时针转90度，第4行变第1列
        case 2:
          list[i].push(this.board.grid[this.size - 1 - j][i]);
          break;
          // 左移，不变
        case 3:
          list[i].push(this.board.grid[i][j]);
          break;
      }
    }
    return list;
  },


  /**
   * 移动时，相同数字合并
   * @param {*} list
   */
  combine(data) {
    const list = data;
    // 数字靠边
    for (let i = 0; i < list.length; i++) {
      list[i] = this.changeItem(list[i]);
    }
    for (let i = 0; i < this.size; i++) {
      for (let j = 1; j < this.size; j++) {
        if (list[i][j - 1] === list[i][j] && list[i][j] !== '') {
          list[i][j - 1] += list[i][j];
          list[i][j] = '';
        }
      }
    }
    // 再次数字靠边
    for (let i = 0; i < list.length; i++) {
      list[i] = this.changeItem(list[i]);
    }
    return list;
  },


  /**
   * 一行数字靠边
   * @param {}} item
   */
  changeItem(data) {  // 将 ['', 2, '', 2] 改为 [2, 2, '', '']
    const item = data;
    let cnt = 0;
    for (let i = 0; i < item.length; i++) {
      if (item[i] !== '') {
        item[cnt] = item[i];
        cnt = cnt + 1;
      }
    }
    for (let j = cnt; j < item.length; j++) {
      item[j] = '';
    }
    return item;
  },

  /**
   * 游戏是否结束（结束条件：可用格子为空且所有格子上下左右值不等）
   */
  isOver() {
    this.board.__proto__ = this.bproto;
    if (!this.board.cellEmpty()) {
      return false;
    }
    // 左右不等
    for (let i = 0; i < this.size; i++) {
      for (let j = 1; j < this.size; j++) {
        if (this.board.grid[i][j] === this.board.grid[i][j - 1]) return false;
      }
    }

    // 上下不等
    for (let j = 0; j < this.size; j++) {
      for (let i = 1; i < this.size; i++) {
        if (this.board.grid[i][j] === this.board.grid[i - 1][j]) return false;
      }
    }

    return true;
  },
};

module.exports = Game;
