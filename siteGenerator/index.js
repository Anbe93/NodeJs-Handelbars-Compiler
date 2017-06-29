'use strict';

const request = require("request-promise");
const fsExtra = require('fs-extra');
const Handlebars = require('handlebars');

const ApiPort = 80;

const url = `http://localhost:${ApiPort}/wp-poc/wp-json/wp/v2/posts?categories=2`

const startJoboffersGenerator = (callback) => {
	request(url)
		.then(function (response, body) {
			handleJoboffersContent(JSON.parse(body), callback);
		})
		.catch(function (error) {
			console.log('ERROR: ' + error);
			console.log('STATUS: ' + response.statusCode);
		});

	const clearDist = async () => {
		try {
			const oldHtmlFiles = await fsExtra.readdir('../../twentyFifteenClone/dist/');
			oldHtmlFiles.filter(name => /\.html$/gmi.test(name)).forEach(file => {
				fsExtra.unlink(`../../twentyFifteenClone/dist/${file}`);
			});
		} catch (error) {
			console.log(error);
		}
	}

	const registerPartials = async () => {
		const partialsFiles = await fsExtra.readdir('../../twentyFifteenClone/partials/');
		partialsFiles.map(async partialFileName => {
			const source = await fsExtra.readFile(`../../twentyFifteenClone/partials/${partialFileName}`, 'utf8');
			Handlebars.registerPartial(partialFileName.split('.')[0], source);
		});
	}

	const registerHelpers = () => {
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
		const body = await request(`http://localhost:${ApiPort}/wp-poc/wp-json/wp/v2/users/${post.author}`);
		console.log('lade Author Partial');
		return JSON.parse(body).name;
	}

	const buildHandlebars = async (data) => {
		await registerPartials();
		await registerHelpers();

		try {
			const wrapperTemplate = Handlebars.compile(await fsExtra.readFile('../../twentyFifteenClone/template/template.hbs', 'utf8'));
			const templateFiles = await fsExtra.readdir('../../twentyFifteenClone/');
			
			await Promise.all(templateFiles.filter(templateFile => /\.hbs$/mgi.test(templateFile)).map(async template => {
				const templateSource = await fsExtra.readFile(`../../twentyFifteenClone/${template}`, 'utf8');
				const htmlBody = Handlebars.compile(templateSource);
				const context = { body: htmlBody, data: data}
				
				if (template === 'joboffer.hbs') {
					for (let e of data) {
						console.log('überschreibe Partials für:     ', e.title.rendered);
						Handlebars.registerPartial('headline', e.title.rendered);
						Handlebars.registerPartial('content', e.content.rendered);
						Handlebars.registerPartial('author', await getAuthor(e));

						const html = wrapperTemplate(context);
						await fsExtra.writeFile(`../../twentyFifteenClone/dist/joboffer_${e.title.rendered.replace(/ /g, '_')}.html`, html, 'utf8');
					}
				} else {
					const html = wrapperTemplate(context);
					await fsExtra.writeFile(`../../twentyFifteenClone/dist/${template.split('.')[0]}.html`, html, 'utf8');
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

	const handleJoboffersContent = async (data, callback) => {
		await clearDist();
		await buildHandlebars(data);
		if (typeof callback === "function") callback();
	}
}

module.exports = startJoboffersGenerator;
