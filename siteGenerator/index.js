'use strict';

const request = require("request");
const requestPromise = require("request-promise");
const fsPromise = require('fs-promise');
const Handlebars = require('handlebars');

const url = "http://localhost/wp-poc/wp-json/wp/v2/posts?categories=2"

const startJoboffersGenerator = () => {
	request(url, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			handleJoboffersContent(JSON.parse(body));
		}
		else{
			console.log('ERROR: ' + error);
			console.log('STATUS: ' + response.statusCode);
		}
	});

	const clearDist = async () => {
		
		try {

			const oldHtmlFiles = await fsPromise.readdir('../../twentyFifteenClone/dist/');
			oldHtmlFiles.filter(name => /\.html$/gmi.test(name)).forEach(file => {
				fsPromise.unlink(`../../twentyFifteenClone/dist/${file}`);
			});

		} catch (error) {
			console.log(error);
		}
	}

	const readPartials = async () => {
		
		const partialsDir = await fsPromise.readdir('../../twentyFifteenClone/partials/');
		partialsDir.map(async partialFileName => {
			const source = await fsPromise.readFile(`../../twentyFifteenClone/partials/${partialFileName}`, 'utf8');
			Handlebars.registerPartial(partialFileName.split('.')[0], source)
		});

	}

	const readHelpers = () => {
		Handlebars.registerHelper('renderJSON', function (input) {
			return `<pre><code>${JSON.stringify(input, false, 2)} </code></pre>`;
		});

		Handlebars.registerHelper('filename', function (input) {
			return input.replace(/ /g, '_');
		});

		Handlebars.registerHelper('renderDate', function (input) {
			let date = (input.split('T')[0]).split('-');
			let month = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
			date[2] = date[2].replace(/^0/gm, '');
			date[1] = date[1].replace(/^0/gm, '');			

			return `${date[2]}. ${month[date[1]-1]} ${date[0]}`;

		});
	}

	const getAuthor = async (post) => {
		const body = await requestPromise(`http://localhost/wp-poc/wp-json/wp/v2/users/${post.author}`);
		console.log('lade Author Partial');
		return JSON.parse(body).name;
	}

	const buildHandlebars = async (data) => {
		
		await readPartials();
		await readHelpers();
		const wrapperTemplateSource = await fsPromise.readFile('../../twentyFifteenClone/template/template.hbs', 'utf8');		
		const template = Handlebars.compile(wrapperTemplateSource);

		try {
			
			const templateFiles = await fsPromise.readdir('../../twentyFifteenClone/');
			
			await Promise.all(templateFiles.filter(file => /\.hbs$/mgi.test(file)).map(async templates => {

				const templateSource = await fsPromise.readFile(`../../twentyFifteenClone/${templates}`, 'utf8');
				const bodyHtml = Handlebars.compile(templateSource);
				const context = { body: bodyHtml, data: data}
				
				if (templates === 'joboffer.hbs')
				{
					for (let e of data) {
						console.log('überschreibe Partials für:     ', e.title.rendered);
						
						Handlebars.registerPartial('headline', e.title.rendered);
						Handlebars.registerPartial('content', e.content.rendered);
						Handlebars.registerPartial('author', await getAuthor(e));
						const html = template(context);
						await fsPromise.writeFile(`../../twentyFifteenClone/dist/joboffer_${e.title.rendered.replace(/ /g, '_')}.html`, html, 'utf8');
					}

				} else {
					const html = template(context);
					await fsPromise.writeFile(`../../twentyFifteenClone/dist/${templates.split('.')[0]}.html`, html, 'utf8');
				}
			}));

			console.log(`
					\n------------------------------------
					\n-> -> -> The build is ready <- <- <-
					\n------------------------------------`);
					
		} catch (error) {
			console.log(error);
		}
	}

	const handleJoboffersContent = async data => {
		await clearDist();
		await buildHandlebars(data);
	}
}

startJoboffersGenerator();

module.exports = startJoboffersGenerator;
