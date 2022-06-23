const axios = require('axios');
const FormData = require('form-data');

const Config = {
	hctiUserId: process.env.HCTI_USER_ID,
	hctiApiKey: process.env.HCTI_API_KEY,
};

function response(statusCode = 200, body = '', headers = {}) {
	return {
		statusCode,
		body,
		headers,
	};
}

exports.handler = async function (event) {
	const token = event?.queryStringParameters?.token;
	if (!token) return response(400, 'Missing token');

	// Get tasks
	let tasks
	try {
		tasks = await axios.get('https://api.todoist.com/rest/v1/tasks', { headers: { 'authorization': 'Bearer ' + token } });
	} catch (err) {
		console.error(err);
		console.error('Could not get tasks');
	}

	if (!tasks || !tasks.data) return response(401, 'Could not get tasks');

	// Build content
	// Tasks
	const htmlTasks = tasks.data.map(t => {
		return '<div class="task"><div class="checkbox"></div>'+ t.content +'</div>';
	});

	// HTML
	const html = `
		<div class="image">
			<div class="tasks">
				${ htmlTasks.join('') }
			</div>
		</div>
	`;

	// CSS
	const css = `
		body {
			margin: 0;
		}
		.image {
			font-family: 'Montserrat', sans-serif;
			width: 1170px;
			height: 2532px;
			background-image: url(https://cdn.itaibo.com/background-tasks/background.jpg);
			background-size: cover;
			background-position: center center;
			color: #0b0511;
			font-size: 60px;
		}
		.tasks {
			padding-top: 70%;
			margin-left: 100px;
		}
		.task {
			margin-bottom: 30px;
		}
		
		.checkbox {
			display: inline-block;
			width: 60px;
			height: 60px;
			background-image: url(https://cdn.itaibo.com/background-tasks/check.png);
			background-size: cover;
			background-position: center center;
			margin-right: 30px;
			vertical-align: -7px;
		}
	`;

	// Generate image
	var bodyFormData = new FormData();
	bodyFormData.append('html', html);
	bodyFormData.append('css', css);
	bodyFormData.append('google_fonts', 'Montserrat');


	let image
	try {
		image = await axios({
			method: 'post',
			url: 'https://hcti.io/v1/image',
			data: bodyFormData,
			headers: { 'Content-Type': 'multipart/form-data' },
			auth: {
				username: Config.hctiUserId,
				password: Config.hctiApiKey,
			},
		});
	} catch (err) {
		console.error(err);
		console.error('Could not get image');
	}

	if (!image || !image.data) return response(500, 'Could not get image');

	const imageUrl = image.data.url;

	return response(302, '', {
		Location: imageUrl,
	});
};
