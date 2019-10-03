var browserstackApi = require("./api");
var browserstackAutomate = require("./automate");
var browserstackScreenshot = require("./screenshot");

module.exports = {
	createClient: browserstackApi.createClient,
	createAutomateClient: browserstackAutomate.createClient,
	createScreenshotClient: browserstackScreenshot.createClient
};
