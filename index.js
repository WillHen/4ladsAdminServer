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
	if (err) throw err;
});

// Create a server with a host and port
const server = Hapi.server({
	host: "localhost",
	port: 8000
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
		let players = await getCompetitions();
		return competitions;
	}
});

start();
