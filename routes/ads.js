var AWS = require('aws-sdk');
if (!process.env.NODE_ENV) {
    // If developing locally, get credentials from local file.
    AWS.config.loadFromPath('./.local/credentials.json');
}
AWS.config.update({region: 'us-east-1'});
var db = new AWS.DynamoDB();
var table_name = 'ProjectR';
var panam = true;

exports.getAd = function(request, response) {
    var params = {
	"TableName": table_name,
	"Key": {
            "AdSpaceID": {
		"N": request.params.id
            }
	}
    };
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else {
	    response.send(data.Item);
	}
    });
};

exports.getAdTest = function(request, response) {
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
};
