import Ramda from "./common/ramda.js";
import NaughtsAndCrosses from "./common/MemorySnap.js";
import Json_rpc from "./Json_rpc.js";

//strings
const source_of_image = [
    "./assets/Empty.png",
    "./assets/Cross.png",
    "./assets/Naught.png"
];
const image_names = [
    "Empty place",
    "Naught",
    "Cross"
];
const outcomes = [
    "Naughts win!",
    "Crosses win!",
    "The game has been drawn!"
];
const players = {
    "1": "Naughts",
    "2": "Crosses"
};

// Stats4
const document_game = Json_rpc.method("document_game");
const obtain_stats = Json_rpc.method("obtain_stats");
const game_board = document.getElementById("game_board");
const outcome_argument = document.getElementById("outcome_argument");

// Both players are displayed on either side.
// Players alternate turns with player 1 going first and player 2 second
let player_1 = document.getElementById("player1_name").value;
let player_2 = document.getElementById("player2_name").value;
let player1_type;
let board = NaughtsAndCrosses.empty_board();
let player_turn = 1; // Player to start playing

const shortened = (id) => document.getElementById(id);

const gap_images = Ramda.range(0, 3).map(function (index_of_column) {
    const column = document.createElement("div");
    column.className = "column";
    column.tabIndex = 0;
    column.setAttribute("aria-label", `Column ${index_of_column}`);

    column.onclick = function () {
        const columns_unoccupied = NaughtsAndCrosses.columns_unoccupied(board);
        if (!columns_unoccupied.includes(index_of_column)) {
            return;
        }
        board = NaughtsAndCrosses.turn(player_turn, index_of_column, board);
        player_turn = NaughtsAndCrosses.turn_of_player(board);
        new_board();

        if (NaughtsAndCrosses.is_finished(board)) {
            let outcome;
            let player_won;
            if (NaughtsAndCrosses.is_winning(1, board)) {
                outcome = 1;
                player_won = (
                    player1_type === 1
                    ? player_1
                    : player_2
                );
                document.getElementById("outcome_winner").textContent = (
                    `${player_won} has won!`
                );
            } else if (NaughtsAndCrosses.is_winning(2, board)) {
                outcome = 2;
                player_won = (
                    player1_type === 2
                    ? player_1
                    : player_2
                );
                document.getElementById("outcome_winner").textContent = (
                    `${player_won} has won!`
                );
            } else {
                outcome = 0;
                document.getElementById("outcome_winner").textContent = (
                    "The game has been tied"
                );
            }
            document.getElementById("outcome_message").textContent = (
                outcomes[outcome]
            );

            if (player1_type === 1) { // Who went first?
                document_game(player_1, player_2, outcome).then(
                    amend_stats(player_1, player_2)
                );
            } else {
                document_game(player_2, player_1, outcome).then(
                    amend_stats(player_1, player_2)
                );
            }

            outcome_argument.showModal();
        }
    };

    column.onkeydown = function (event) {
        if (
            event.key === "Enter" ||
            event.key === "Space" ||
            event.key === "ArrowDown"
        ) {
            column.onclick();
        }
        if (event.key === "ArrowLeft" && column.previousSibling) {
            column.previousSibling.focus();
        }
        if (event.key === "ArrowRight" && column.nextSibling) {
            column.nextSibling.focus();
        }
    };

    game_board.append(column);

    return Ramda.reverse(Ramda.range(0, 3).map(function () {
        const board_image = document.createElement("image");
        column.append(board_image);
        return board_image;
    }));
});

outcome_argument.onclick = function () {
    board = NaughtsAndCrosses.empty_board();
    player_turn = NaughtsAndCrosses.turn_of_player(board);
    switch_player();
    new_board();
    outcome_argument.close();
};

outcome_argument.onkeydown = outcome_argument.onclick;

const switch_player = function () {
    player1_type = 3 - player1_type;
    shortened("player1_type").textContent = players[player1_type];
    shortened("player2_type").textContent = players[3 - player1_type];
    shortened("player1_type_image").setAttribute(
        "src",
        source_of_image[player1_type]
    );
    shortened("player1_type_image").setAttribute(
        "alt",
        image_names[player1_type]
    );
    shortened("player2_type_image").setAttribute(
        "src",
        source_of_image[3 - player1_type]
    );
    shortened("player2_type_image").setAttribute(
        "alt",
        image_names[3 - player1_type]
    );
};

const new_board = function () {
    gap_images.forEach(function (column, index_of_column) {
        column.forEach(function (image, index_of_row) {
            const symbol = board[index_of_column][index_of_row];
            image.setAttribute("src", source_of_image[symbol]);
            image.setAttribute("alt", image_names[symbol]);
            image.className = (
                symbol === 0
                ? "unoccupied"
                : "occupied"
            );
        });
    });
    NaughtsAndCrosses.win_position(board).forEach(function ([index_of_column, index_of_row]) {
        const board_image = gap_images[index_of_column][index_of_row];
        board_image.className = "winning";
        board_image.setAttribute(
            "alt",
            `Winning ${board_image.getAttribute("alt")}`
        );
    });
    if (NaughtsAndCrosses.turn_of_player(board) === player1_type) {
        document.getElementById("player1_waiting").textContent = "Your go!";
        document.getElementById("player2_waiting").textContent = "You're next";
    } else {
        document.getElementById("player1_waiting").textContent = "You're next";
        document.getElementById("player2_waiting").textContent = "Your go!";
    }
};

const amend_stats = function (player_1, player_2) {
    return function (statistics) {
        const p1_stats = statistics[player_1];
        const p2_stats = statistics[player_2];

        shortened("p1_name").textContent = player_1;
        shortened("p1_elo").textContent = Math.round(p1_stats.elo);
        shortened("p1_win").textContent = p1_stats.player_1_wins;
        shortened("p1_lose").textContent = p1_stats.player_1_losses;
        shortened("p1_draw").textContent = p1_stats.player_1_draws;
        shortened("p1_streak").textContent = p1_stats.current_streak;

        shortened("p2_name").textContent = player_2;
        shortened("p2_elo").textContent = Math.round(p2_stats.elo);
        shortened("p2_win").textContent = p2_stats.player_2_wins;
        shortened("p2_lose").textContent = p2_stats.player_2_losses;
        shortened("_p2_draw").textContent = p2_stats.player_2_draws;
        shortened("p2_streak").textContent = p2_stats.current_streak;
    };
};

document.getElementById("p1_name").onchange = function () {
    player_1 = document.getElementById("p1_name").value;
    player_2 = document.getElementById("p2_name").value;
    obtain_stats([player_1, player_2]).then(
        amend_stats(player_1, player_2)
    );
};

document.getElementById("p2_name").onchange = (
    document.getElementById("p1_name").onchange
);

obtain_stats([player_1, player_2]).then(
    amend_stats(player_1, player_2)
);

player1_type = 2;
switch_player();


game_board.firstChild.focus();
new_board();

