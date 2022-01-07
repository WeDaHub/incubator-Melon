function Board(size) {
  this.size = size;
  this.grid = this.init();
}

Board.prototype = {
  init() {  // 形成一个空矩阵
    const grid = [];
    for (let i = 0; i < this.size; i++) {
      grid[i] = [];
      for (let j = 0; j < this.size; j++) {
        grid[i].push('');
      }
    }
    return grid;
  },

  /**
   * 可用的空格子
   */
  usefulCell() {
    const cells = [];
    for (let i = 0; i < this.size; i++) for (let j = 0; j < this.size; j++) {
      if (this.grid[i][j] === '') {  // 若可用则记录坐标
        cells.push({
          x: i,
          y: j,
        });
      }
    }
    return cells;
  },

  /**
   * 随机选一个可填充的格子
   */
  selectCell() {
    const cells = this.usefulCell();
    if (cells.length) {
      return cells[Math.floor(Math.random() * cells.length)];
    }
  },

  /**
 *  是否没有可用的格子
 */
  cellEmpty() {
    return !this.usefulCell().length;
  },
};

module.exports = Board;
