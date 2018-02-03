var screenWidth = 605;
var screenHeight = 605;

var Box = function(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    /* return a coordinate pair of the box's center */
    this.centerX = function() { return ((this.width/2.0) + this.x); };
    this.centerY = function() { return ((this.height/2.0) + this.y); };

    //hit box definitions
    this.left = function() { return this.x; };
    this.right = function() { return this.x + this.width; };
    this.top = function() { return this.y; };
    this.bottom = function() { return this.y + this.height; };

    this.hasCollided = function(x, y) {
        var collisionDetected = true;
        //The top and bottom collision may look reversed, but canvas handles things in normal screen coordinates (y increase down)
        if (y < this.top() ||
            y > this.bottom() ||
            x > this.right() ||
            x < this.left()) {
            collisionDetected = false;
        }
        
        return collisionDetected;
    };
};

var GameSquare = function(x, y) {
    this.box = new Box(x, y, 195, 195);
    this.symbol = "";
    this.drawRoutine = function(context) {
        context.fillStyle = "#fff";
        context.fillRect(this.box.x, this.box.y, 195, 195);
        if(this.symbol) {
            context.font = "100pt Sans-Serif";
            context.fillStyle = "#000";
            context.textAlign= "center";
            context.fillText(this.symbol, this.box.centerX(), (this.box.centerY()+48));
        };
    };
    this.clickHandler = function(currentTurn, x, y) {
        var detectedClick = false;
        if(this.box.hasCollided(x, y) && _.isEmpty(this.symbol)) {
            this.symbol = currentTurn;
            detectedClick = true;
        }
        return detectedClick;
    };
};

var Board = function() {
    this.rowSize = 3;

    this.movesMade = 0;

    this.squareCollection = (function() {
        //Yay for closures!
        var self = this;
        return _.map(_.range(self.rowSize), function(i) {
            return _.map(_.range(self.rowSize), function(j) {
                return new GameSquare((200 * i + 5), (200 * j + 5));
            });
        });
    }).bind(this)();

    this.checkWin = function() {
        var self = this;

        var checkRowsOrCols = function(type) {
            var winner = "";
            _.forEach(_.range(self.rowSize), function(i) {
                var initialSymbol = (type === "row") ? self.squareCollection[0][i].symbol : self.squareCollection[i][0].symbol;
                var accumulator = true;
                if (!_.isEmpty(initialSymbol)) {
                    _.forEach(_.range(self.rowSize), function(j) {
                        var check = (type === "row") ? self.squareCollection[j][i].symbol : self.squareCollection[i][j].symbol;
                        accumulator = ((check === initialSymbol) && accumulator);
                    });

                    if (accumulator && _.isEmpty(winner)) {
                        winner = initialSymbol;
                    }
                }
            });
            return winner;
        };

        var checkDiags = function(type) {
            var winner = "";
            var initialSymbol = (type === "forward") ? self.squareCollection[0][0].symbol : self.squareCollection[self.rowSize-1][0].symbol;
            var accumulator = true;
            var forEachPartial = _.partialRight(_.forEach, function(i) {
                if (!_.isEmpty(initialSymbol)) {
                    var check = (type === "forward") ? self.squareCollection[i][i].symbol : self.squareCollection[i][Math.abs((self.rowSize-1)-i)].symbol;
                    accumulator = ((initialSymbol === check) && accumulator);
                }
            });

            if (type === "forward") {
                forEachPartial(_.range(self.rowSize));
            } else {
                forEachPartial(_.range((self.rowSize-1), -1, -1));
            }

            if (accumulator) {
                winner = initialSymbol;
            };
            return winner;
        };


        var winner = (checkRowsOrCols("row") + checkRowsOrCols("col") + checkDiags("forward") + checkDiags("backward"));

        if (_.isEmpty(winner) && this.movesMade === 9) {
            winner = "tie";
        }
                            
        return winner;
    };
};

var Game = function() {
    var gameSelf = this;
    
    this.board = new Board();

    this.canvas = document.getElementById("board");
    this.context = this.canvas.getContext("2d");

    this.initializeGame = function() {
        this.context.fillStyle = "#000";
        this.context.fillRect(0,0, 640, 700);
        _.forEach(this.board.squareCollection, function(row) {
            _.forEach(row, function(square) {
                square.drawRoutine(gameSelf.context);
            });
        });
    };

    var canvasClickListener = function(event) {
        var x = (event.x) ? event.x : (event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft);
        var y = (event.y) ? event.y : (event.clientY + document.body.scrollTop + document.documentElement.scrollTop);
        x -= gameSelf.canvas.offsetLeft;
        y -= gameSelf.canvas.offsetTop;

        var currentTurn = (gameSelf.board.movesMade % 2 === 0) ? "O" : "X";

        _.forEach(gameSelf.board.squareCollection, function(row) {
            _.forEach(row, function(square) {
                if (square.clickHandler(currentTurn,x,y)) {
                    square.drawRoutine(gameSelf.context);
                    gameSelf.board.movesMade += 1;
                }
            });
        });

        var winCheck = gameSelf.board.checkWin();
        if (!_.isEmpty(winCheck)) {
            if (winCheck === "tie") {
                alert("Tie Game");
            } else {
                alert(winCheck + " has won");
            }
            gameSelf.board = new Board();
            gameSelf.initializeGame();
        }
    };

    this.canvas.addEventListener("mousedown", canvasClickListener);
};

var game = new Game();
game.initializeGame();
