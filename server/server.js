'use strict';

const startJoboffersGenerator = require('../siteGenerator/index.js');
const express = require('express');
const Client = require('ftps');
const fs = require('fs');

let app = express();

// ftp config
const ftp = new Client({
	host: 'ftp.andy-katharina.de',
	port: 21,
	username: 'andy-katharina.de',
	password: 'tP;s54/oN00!',
	protocol: 'ftp'
});

// sftp config
/*const ftp = new Client({
	host: 'home679493733.1and1-data.host',
	port: 22,
	username: 'u89121212',
	password: '025689ab',
	protocol: 'sftp'
});*/

app.listen(8080, () => {
	console.log('Listening on localhost:8080');
});

// Gate to prevent the first of two simular posts
let gate = false;

app.post('/', (req, res) => {
	console.log('New Post - Gate is: ' + gate);
	if (gate) {
		new Promise(async (resolve) => {
			startJoboffersGenerator(callback => {
				resolve();
			});
			
		}).then( () => {
			ftp.mirror({
				remoteDir: './static',
				localDir: '../../twentyFifteenClone/dist',
				parallel: true,
				upload: true
			}).exec(console.log);

			gate = !gate;
			console.log('Changed gate to: ' + gate);
		})
	} else {
		gate = !gate;
		console.log('Changed gate to: ' + gate);
	}
});
