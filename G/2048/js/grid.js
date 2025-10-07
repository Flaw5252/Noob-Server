function Grid(previousState) {
  this.size = 30;
  this.cells = previousState ? this.fromState(previousState) : this.empty();
}

// Build a fixed 30x30 grid
Grid.prototype.empty = function () {
  var cells = [];

  for (var x = 0; x < 30; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < 30; y++) {
      row.push(null);
    }
  }

  return cells;
};

Grid.prototype.fromState = function (state) {
  var cells = [];

  for (var x = 0; x < 30; x++) {
    var row = cells[x] = [];

    for (var y = 0; y < 30; y++) {
      var tile = state[x][y];
      row.push(tile ? new Tile(tile.position, tile.value) : null);
    }
  }

  return cells;
};

Grid.prototype.randomAvailableCell = function () {
  var cells = this.availableCells();

  if (cells.length) {
    return cells[Math.floor(Math.random() * cells.length)];
  }
};

Grid.prototype.availableCells = function () {
  var cells = [];

  this.eachCell(function (x, y, tile) {
    if (!tile) {
      cells.push({ x: x, y: y });
    }
  });

  return cells;
};

Grid.prototype.eachCell = function (callback) {
  for (var x = 0; x < 30; x++) {
    for (var y = 0; y < 30; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return position.x >= 0 && position.x < 30 &&
         position.y >= 0 && position.y < 30;
};

Grid.prototype.serialize = function () {
  var cellState = [];

  for (var x = 0; x < 30; x++) {
    var row = cellState[x] = [];

    for (var y = 0; y < 30; y++) {
      row.push(this.cells[x][y] ? this.cells[x][y].serialize() : null);
    }
  }

  return {
    size: 30,
    cells: cellState
  };
};
