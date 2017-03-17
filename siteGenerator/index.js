'use strict';

const request = require("request");
const fsPromise = require('fs-promise');
const Handlebars = require('handlebars');

const url = "http://localhost:8888/wordpress/wp-json/wp/v2/posts?categories=2"

const startJoboffersGenerator = () => {
	request(url, function (error, response, body) {
		if (!error && response.statusCode === 200) {
			handleJoboffersContent(JSON.parse(body));
		}
		else{
			console.log('error: ' + error);
			console.log('STATUS: ' + response.statusCode);
		}
	});

	const clearDist = async () => {
		
		try {

			const oldHtmlFiles = await fsPromise.readdir('../../twentySixteenClone/dist/');
			oldHtmlFiles.filter(name => /\.html$/gmi.test(name)).forEach(file => {
				fsPromise.unlink(`../../twentySixteenClone/dist/${file}`);
			});

		} catch (error) {
			console.log(error);
		}
	}

	const readPartials = async () => {
		const objectOfAllPartials = {}
		
		const partialsDir = await fsPromise.readdir('../../twentySixteenClone/partials/');
		await Promise.all(partialsDir.map(async partialFileName => {
			const source = await fsPromise.readFile(`../../twentySixteenClone/partials/${partialFileName}`, 'utf8');
			objectOfAllPartials[partialFileName.split('.')[0]] = source;
		}));

		return objectOfAllPartials;
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

	const buildHandlebars = async (data) => {
		
		Object.entries(await readPartials()).map(([key, value]) => Handlebars.registerPartial(key, value));
		await readHelpers();
		const wrapperTemplateSource = await fsPromise.readFile('../../twentySixteenClone/template/template.hbs', 'utf8');		
		const template = Handlebars.compile(wrapperTemplateSource);
		

		try {
			
			const templateFiles = await fsPromise.readdir('../../twentySixteenClone/');
			
			await Promise.all(templateFiles.filter(file => /\.hbs$/mgi.test(file)).map(async templates => {

				const templateSource = await fsPromise.readFile(`../../twentySixteenClone/${templates}`, 'utf8');
				const bodyHtml = Handlebars.compile(templateSource);
				const context = { body: bodyHtml, data: data}
				
				if(templates === 'joboffer.hbs')
				{
					await Promise.all(data.map(async e => {
						Handlebars.registerPartial('headline', e.title.rendered);
						Handlebars.registerPartial('content', e.content.rendered);

						const html = template(context);
						await fsPromise.writeFile(`../../twentySixteenClone/dist/joboffer_${e.title.rendered.replace(/ /g, '_')}.html`, html, 'utf8');
					}));

				} else {
					const html = template(context);
					await fsPromise.writeFile(`../../twentySixteenClone/dist/${templates.split('.')[0]}.html`, html, 'utf8');
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
