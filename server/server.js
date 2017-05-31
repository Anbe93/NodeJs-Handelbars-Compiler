'use strict';

const startJoboffersGenerator = require('../siteGenerator/index.js');
const express = require('express');
const ftp = require('ftps');
const exec = require('child_process').execFile;

let app = express();
debugger;
let ftpserver = new ftp({
	host: 'home679493733.1and1-data.host',
	port: 22,
	username: 'u89121212',
	password: '025689ab',
	protocol: 'sftp'
});

app.listen(8080, () => {
	console.log('Listening on localhost:8080');
});

app.post('/', (req, res) => {
	startJoboffersGenerator();
});

// debugger;
// ftpserver.cd('./static').put('../../twentyFifteenClone/dist/index.html');