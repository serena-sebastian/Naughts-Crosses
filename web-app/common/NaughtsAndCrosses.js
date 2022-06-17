import Ramda from ".../common/ramda.js";
/**
 * NaughtsAndCrosses.js is a game module to model "Naughts and Crosses".
 * @namespace NaughtsAndCrosses
 * @author Serena Sebastian
 * @version 2022
 */
const NaughtsAndCrosses = Object.create(null);

/**
 * A Board is a square grid that symbolds can be placed on one at a time.
 * Symbols fill up any empty position on the board.
 * It is implemented as an array of columns of unoccupied slots.
 * @memberof NaughtsAndCrosses
 * @typedef {NaughtsAndCrosses.Symbol_or_unoccupied[][]} Board
 */

/**
 * A symbol is either a naught or cross that players place in the grid.
 * @memberof NaughtsAndCrosses
 * @typedef {(1 | 2)} Symbol
 */

/**
 * Either a symbol or an unoccupied slot.
 * @memberof NaughtsAndCrosses
 * @typedef {(NaughtsAndCrosses.Symbol| 0)} Symbol_or_unoccupied
 */

/**
 * A series of symbol strings for {@link NaughtsAndCrosses.str_from_symb}.
 * @memberof NaughtsAndCrosses
 * @enum {string[]}
 * @property {string[]} original ["0", "1", "2"]
 * Displays symbols by their index.
 * @property {string[]} symbols ["⬛", "⭕", "❌"]
 * Displays symbols as naughts and crosses.
 */

NaughtsAndCrosses.symbol_str = Object.freeze({
    "original": ["0", "1", "2"],
    "symbols": ["⬛", "⭕", "❌"]
});

/**
 * Forming a new empty board with specified dimensions.
 * Or else returns a standard 3 x 3 board.
 * @memberof NaughtsAndCrosses
 * @function
 * @param {number} [Board_width = 3] The width of the new board.
 * @param {number} [Board_height = 3] The height of the new board.
 */
NaughtsAndCrosses.empty_board = function (Board_width = 3, Board_height = 3) {
    return Ramda.repeat(Ramda.repeat(0, Board_height), Board_width);
};

/**
 * Returns array of columns which are unoccupied to occupy a symbol.
 * @memberof NaughtsAndCrosses
 * @function
 * @param {NaughtsAndCrosses.Board} board The board to check for free columns.
 * @returns {number[]} An array of column indices of free columns.
 */
NaughtsAndCrosses.columns_unoccupied = Ramda.pipe(
    Ramda.addIndex(Ramda.map)((column, index) => (
        Ramda.includes(0, column)
        ? index
        : -1
    )),
    Ramda.reject(Ramda.equals(-1))
);

//NaughtsAndCrosses.rows_unoccupied = Ramda.pipe(
    //Ramda.addIndex(Ramda.map)((row, index) => (
        //Ramda.includes(0, row)
        //? index
        //: -1
    //)),
    //Ramda.reject(Ramda.equals(-1))
//);
// problem!! because this gives me free colums instead of all the free slots.
// how can I manipulate this to give me all the free positions instead.

/**
 * Returns if the game has ended: either player winning or a draw
 * A draw occurs when the board is full
 * @memberof NaughtsAndCrosses
 * @function
 * @param {NaughtsAndCrosses.Board} board The board being tested.
 * @returns {boolean} Returns whether game has finished or not.
 */
NaughtsAndCrosses.is_finished = function (board) {
    return (
        NaughtsAndCrosses.is_winning(1, board) ||
        NaughtsAndCrosses.is_winning(2, board) ||
        NaughtsAndCrosses.columns_unoccupied(board).length === 0
        //NaughtsAndCrosses.rows_unoccupied(board).length === 0
    );
};

const win_column = function (player_symbol) {
    return function (column) {
        return Ramda.includes(
            [player_symbol, player_symbol, player_symbol],
            Ramda.aperture(3, column)
        );
    };
};

const win_vertical = function (player_symbol, board) {
    return Ramda.any(win_column(player_symbol), board);
};

const win_horizontal = function (player_symbol, board) {
    return win_vertical(player_symbol, Ramda.transpose(board));
};

const stagger = function (board) {
    const column_index = board.length;
    return board.map(function (column, counter) {
        return [
            ...Ramda.repeat(0, counter),
            ...column,
            ...Ramda.repeat(0, column_index - 1 - counter)
        ];
    });
};

const other_stagger = Ramda.pipe(Ramda.reverse, stagger, Ramda.reverse);

const win_positive_diagonal = function (player_symbol, board) {
    return win_horizontal(player_symbol, other_stagger(board));
};

const win_negative_diagonal = function (player_symbol, board) {
    return win_horizontal(player_symbol, stagger(board));
};

/**
 * Returns if there has been a win.
 * A win occurs if there are three symbols in a row.
 * This could happen either horizontally, vertically, or diagonally.
 * @memberof NaughtsAndCrosses
 * @function
 * @param {(1 | 2)} player_symbol Identifying which palyer won.
 * @param {Connect4.Board} board The board.
 * @returns {boolean} Returns if there is a win on board for the player.
 */
NaughtsAndCrosses.is_winning = function (player_symbol, board) {
    return (
        win_vertical(player_symbol, board) ||
        win_horizontal(player_symbol, board) ||
        win_positive_diagonal(player_symbol, board) ||
        win_negative_diagonal(player_symbol, board)
    );
};

/**
 * Returns the player to have a turn next.
 * @memberof NaughtsAndCrosses
 * @function
 * @param {NaughtsAndCrosses.Board} board The board.
 * @returns {(1 | 2)} The next player to have a turn.
 */
NaughtsAndCrosses.turn_of_player = function (board) {
    const flat_arrays = Ramda.flatten(board);
    return (
        Ramda.count(
            Ramda.equals(1),
            flat_arrays
        ) === Ramda.count(
            Ramda.equals(2),
            flat_arrays
        )
        ? 1
        : 2
    );
};

/**
 * A turn is a go played by the player.
 * A new board is returned with the symbol placed by the player.
 * @memberof NaughtsAndCrosses
 * @function
 * @param {NaughtsAndCrosses.Symbol} symbol The symbol which is added.
 * @param {number} index_of_column The column the player adds the token to
 * @param {NaughtsAndCrosses.Board} board The board that the turn is made on.
 * @returns {(NaughtsAndCrosses.Board | undefined)} If the turn is allowed,
 * return the new board, otherwise return `undefined`.
 */
NaughtsAndCrosses.turn = function (symbol, index_of_column, board) {
    if (NaughtsAndCrosses.is_finished(board)) {
        return undefined;
    }
    if (NaughtsAndCrosses.turn_of_player(board) !== symbol) {
        return undefined;
    }
    const index_of_row = Ramda.indexOf(0, board[index_of_column]);
    if (index_of_row === undefined) {
        return undefined;
    }
    return Ramda.update(
        index_of_column,
        Ramda.update(index_of_row, symbol, board[index_of_column]),
        board
    );
};

// problem! retuns it to the column instead of the position
// how do I change that?

/**
 * Dimensions of the board returned as an array of [width, height].
 * @memberof NaughtsAndCrosses
 * @function
 * @param {NaughtsAndCrosses.Board} board The board for checking size.
 * @returns {number[]} The width and height of the board, [width, height].
 */
NaughtsAndCrosses.dimensions = function (board) {
    return [board.length, board[0].length];
};

const replace_symbols = (symbol_str) => (symbol) => (
    symbol_str[symbol] || symbol
);

const replace_symbols_board = function (symbol_str) {
    return function (board) {
        return Ramda.map(Ramda.map(replace_symbols(symbol_str)), board);
    };
};

/**
 * Returns a {@link NaughtsAndCrosses.string} like function,
 * maps symbols to string variations
 * @memberof NaughtsAndCrosses
 * @function
 * @param {string[]} symbol_str
 * Strings to represent symbols as examples are given in
 * {@link NaughtsAndCrosses.symbol_str}
 * @returns {function} The string variation.
 */
NaughtsAndCrosses.str_from_symb = (symbol_str) => (board) => Ramda.pipe(
    Ramda.transpose, // Columns displayed vertically.
    Ramda.reverse, // Empty gaps at the top.
    replace_symbols_board(symbol_str),
    Ramda.map(Ramda.join(" ")), // Space bar added between each gap.
    Ramda.join("\n") // Rows stcaked.
)(board);

/**
 * Returns a string variation of a board for playing in the console
 * @memberof NaughtsAndCrosses
 * @function
 * @param {NaughtsAndCrosses.Board} board The board being represented.
 * @returns {string} The string variation.
 */
NaughtsAndCrosses.to_string = NaughtsAndCrosses.str_from_symb(["0", "1", "2"]);

const winning_places = function (column) {
    let connected_streak = 1;
    let beginning_place = 0;
    let final_symbol = 0;

    column.some(function (symbol, index) {
        if (symbol !== 0 && symbol === final_symbol) {
            connected_streak += 1;
            return;
        }
        if (connected_streak >= 3) {
            return true;
        }
        beginning_place = index;
        connected_streak = 1;
        final_symbol = symbol;
    });
    if (connected_streak < 3) {
        return [];
    }
    return Ramda.range(beginning_place, beginning_place + connected_streak);
};

const vertical_win_position = function (board) {
    return board.flatMap(function (column, column_position) {
        return winning_places(column).map(
            (row_position) => [column_position, row_position]
        );
    });
};

const horizontal_win_position = function (board) {
    return vertical_win_position(Ramda.transpose(board)).map(function ([r, c]) {
        return [c, r];
    });
};

const diagonal_pos_win_position = function (board) {
    return horizontal_win_position(other_stagger(board)).map(
        function ([cols, rows]) {
            return [cols, rows - (board.length - 1 - cols)];
        }
    );
};

const daigonal_neg_win_position = function (board) {
    return horizontal_win_position(stagger(board)).map(
        function ([cols, rows]) {
            return [cols, rows - cols];
        }
    );
};

/**
 * Returns the indicies (colum, row) of gaps from the win
 * Even if there is more than one win contributing to the end
 * Multiple indicies will be presented
 * An empty index is returned if there is no win
 * @memberof NaughtsAndCrosses
 * @function
 * @param {NaughtsAndCrosses.board} board The board being processed.
 * @returns {number[][]} An array of win indicies
 */
NaughtsAndCrosses.win_positions = function (board) {
    return Ramda.dropRepeats([
        ...vertical_win_position(board),
        ...horizontal_win_position(board),
        ...diagonal_pos_win_position(board),
        ...daigonal_neg_win_position(board)
    ]);
};


//const print_terminal = function (board) {
//    console.log(NaughtsAndCrosses.str_from_symb(
//      NaughtsAndCrosses.symbol_str.symbols
//  )(board));
//  return board;
//};
//debugger;

export default Object.freeze(NaughtsAndCrosses);
