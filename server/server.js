'use strict';

const startJoboffersGenerator = require('../siteGenerator/index.js');
const express = require('express');
const Client = require('ftps');
const fs = require('fs');

let app = express();

app.listen(8080, () => {
	console.log('Listening on localhost:8080');
});

app.post('/', (req, res) => {
	startJoboffersGenerator();
	ftp.mirror({
		remoteDir: './static',
		localDir: '../../twentyFifteenClone/dist',
		parallel: true,
		upload: true
	}).exec(console.log);
});

const ftp = new Client({
	host: 'ftp.andy-katharina.de',
	port: 21,
	username: 'andy-katharina.de',
	password: 'tP;s54/oN00!',
	protocol: 'ftp'
});




// ftp.put('./foo.txt', ['./foo.txt']).exec(console.log);

// let ftpserver = {
// 	host: 'home679493733.1and1-data.host',
// 	port: 22,
// 	user: 'u89121212',
// 	password: '025689ab',
// 	secure: true,
// 	secureOptions: { rejectUnauthorized: false }
// };

// console.log('befor client');	
// const ftp =  new Client();
// console.log('after client - befor ready');
// ftp.on('greeting', function() {
// 	console.log('in ready');
// 	ftp.put('foo.txt', 'foo.remote-copy.txt', function(err) {
// 		console.log('in the middle');
// 		if (err) {console.log(err);}
// 		else {console.log('works');}
// 		ftp.end();
// 		console.log('after end');
// 	});
// });
// // connect to localhost:21 as anonymous
// 	ftp.connect(ftpserver);
// console.log('real end');
