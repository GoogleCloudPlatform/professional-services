var BrowserStack = require("../lib/browserstack");

var client = BrowserStack.createClient({
	username: "scott.gonzalez",
	password: "fCPL8wgktWw4ppPdXfMXFDbiZRkdfDuq",
	// version: 3
});

function debug(error, data) {
	if (error) {
		console.error(error.stack);
	}

	console.log(data);
}

// client.getBrowsers(debug);

// client.createWorker({
// 	os: 'Windows',
// 	browser: 'firefox',
// 	os_version: '8',
// 	browser_version: '35.0',
// 	device: null,
// 	url: 'http://google.com',
// 	'browserstack.video': 'hello'
// }, debug);

client.terminateWorker(69985366, debug);

// client.getProjects(debug);

// client.getProject(7130202, debug);

// client.getBuilds({limit: 3}, debug);

// client.getSessions("e499ccafe5302e90e83f5ecd23052e7e30e94a99", debug);

// client.getSession("e1999a2ea44c171982f3073639434d0b9a88ad7b", debug);

// client.getApiStatus(debug);

// client.getBrowsers(debug);

// client.generateScreenshots({
// 	"browsers": [
// 		{
// 			"os": "Windows",
// 			"os_version": "7",
// 			"browser_version": "8.0",
// 			"browser": "ie"
// 		}
// 	],
// 	"url": "http://google.com"
// }, debug);

// client.getJob("c15a669aeb820ccdd2533588f0e7cb358583e0db", debug);
