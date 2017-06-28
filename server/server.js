'use strict';

const startJoboffersGenerator = require('../siteGenerator/index.js');
const express = require('express');
const Client = require('ftps');

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
let isAllowedToGenerate = false;

app.post('/', (req, res) => {
	
	console.log('-------------POST-------------');
	console.log('New Post - Gate is: ' + isAllowedToGenerate);
	if (isAllowedToGenerate) {
		new Promise((resolve) => {
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

			isAllowedToGenerate = !isAllowedToGenerate;
			console.log('Changed isAllowedToGenerate to: ' + isAllowedToGenerate);
		})
	} else {
		isAllowedToGenerate = !isAllowedToGenerate;
		console.log('Changed isAllowedToGenerate to: ' + isAllowedToGenerate);
	}
});
