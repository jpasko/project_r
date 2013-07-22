var AWS = require('aws-sdk');
if (!process.env.NODE_ENV) {
    // If developing locally, get credentials from local file.
    AWS.config.loadFromPath('./.local/credentials.json');
}
var db = new AWS.DynamoDB();
var express = require('express');
var app = express();
var panam = true;

app.get('/', function(request, response) {
    response.send('Hello World');
});

app.get('/adspace/:id', function(request, response) {
    if (panam) {
	response.send({
	    "title": "Pan American",
	    "text": "Overnight to Europe in your own private stateroom",
	    "image": "https://s3.amazonaws.com/project-r/pan-am-logo.png",
	    "link": "https://www.google.com"
	});
    } else {
	response.send({
	    "title": "Texaco",
	    "text": "The Texas Company",
	    "image": "https://s3.amazonaws.com/project-r/texaco-logo.jpg",
	    "link": "https://www.google.com"
	});
    }
    panam = !panam;
});

app.listen(process.env.PORT || 8888);
console.log('Server starting');
