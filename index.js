"use strict";
const { Pool, Client } = require("pg");

const Hapi = require("hapi");

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.FOUR_LADS_DB,
    port: process.env.DB_PORT
});

pool.connect((err, client, done) => {
    console.log("connect 2");
    if (err) throw err;
});

// Create a server with a host and port
const server = Hapi.server({
    host: "localhost",
    port: 3000,
    routes: { cors: true }
});

const start = async () => {
    try {
        await server.start();
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
};

const getCompetitions = () => {
    return new Promise((resolve, reject) => {
        let query = {
            name: "fetch-competitions",
            text: "SELECT * FROM competitions"
        };
        pool.query(query, (err, res) => {
            if (err) {
                reject(err.stack);
            } else {
                resolve(res.rows);
            }
        });
    });
};

const createSavePlayerQuery = payload => {
    let queryString = "";
    let valuesString = "";
    let currentValue = 1;
    let valuesArray = [];
    let finalquery = "INSERT INTO players(";

    for (let prop in payload) {
        queryString = queryString += prop + ",";
        valuesString += "$" + currentValue + ",";
        currentValue++;
        valuesArray.push(payload[prop]);
    }

    valuesString = valuesString.slice(0, -1);
    queryString = queryString.slice(0, -1);

    finalquery =
        finalquery + queryString + ") VALUES(" + valuesString + ") RETURNING *";

    return { queryString: finalquery, values: valuesArray };
};

const createUpdatePlayerQuery = payload => {
    let queryString = "";
    let valuesString = "";
    let currentValue = 1;
    let valuesArray = [];
    let finalquery = "UPDATE players SET";

    // status=($1) WHERE id = ANY($2)
    let playerId = 0;

    for (let prop in payload) {
        if (prop === "player_id") {
            playerId = payload[prop];
            continue;
        }
        queryString += " " + prop + "=($" + currentValue + "),";
        currentValue++;
        valuesArray.push(payload[prop]);
    }
    queryString = queryString.slice(0, -1);
    // currentValue++;
    valuesArray.push(playerId);

    finalquery =
        finalquery +
        queryString +
        "WHERE player_id =($" +
        currentValue +
        ") RETURNING *;";

    return { queryString: finalquery, values: valuesArray };
};

const getPlayers = () => {
    return new Promise((resolve, reject) => {
        let query = {
            name: "fetch-players",
            text: "SELECT * FROM players"
        };
        pool.query(query, (err, res) => {
            if (err) {
                reject(err.stack);
            } else {
                resolve(res.rows);
            }
        });
    });
};

const savePlayer = payload => {
    let query = createSavePlayerQuery(payload);

    return new Promise((resolve, reject) => {
        pool.query(query.queryString, query.values, (err, res) => {
            if (err) {
                reject(err.stack);
            } else {
                resolve(res.rows);
            }
        });
    });
};

const updatePlayer = payload => {
    let query = createUpdatePlayerQuery(payload);
    return new Promise((resolve, reject) => {
        pool.query(query.queryString, query.values, (err, res) => {
            if (err) {
                console.log(err.stack);
                reject(err.stack);
            } else {
                resolve(res.rows);
            }
        });
    });
};

const getPlayerById = id => {
    return new Promise((resolve, reject) => {
        let query = {
            name: "fetch-player-by-id" + id,
            text: "SELECT * FROM players WHERE player_id=" + id
        };
        pool.query(query, (err, res) => {
            if (err) {
                reject(err.stack);
            } else {
                resolve(res.rows);
            }
        });
    });
};

server.route({
    method: "GET",
    path: "/competitions",
    handler: async (request, h) => {
        let competitions = await getCompetitions();
        return competitions;
    }
});

server.route({
    method: "GET",
    path: "/players",
    handler: async (request, h) => {
        let players = await getPlayers();
        return players;
    }
});

server.route({
    method: "GET",
    path: "/getPlayer/{id?}",
    handler: async (request, h) => {
        let player = await getPlayerById(request.params.id);
        return player;
    }
});

server.route({
    method: "POST",
    path: "/savePlayer/",
    handler: async (request, h) => {
        try {
            if (request.payload.player_id) {
                let response = updatePlayer(request.payload);
                return response;
            } else {
                let response = savePlayer(request.payload);
                return response;
            }
        } catch (error) {
            console(error);
            throw error;
        }
    }
});

start();
