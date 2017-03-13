'use strict';

const startJoboffersGenerator = require('../siteGenerator/index.js');
const express = require('express');
const exec = require('child_process').execFile;

let app = express();

app.listen(8080, () => {
	console.log('Listening on localhost:8080');
});

app.post('/', (req, res) => {
	startJoboffersGenerator();
});