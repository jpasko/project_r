var AWS = require('aws-sdk');
if (!process.env.NODE_ENV) {
    AWS.config.loadFromPath('./.local/credentials.json');
}
var db = new AWS.DynamoDB();
db.listTables(function(err, data) {
    console.log(data.TableNames);
});

var s3 = new AWS.S3();
s3.listBuckets(function(err, data) {
    for (var index in data.Buckets) {
	var bucket = data.Buckets[index];
	console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
    }
});

var http = require('http');
var express = require('express');
var app = express();

http.createServer(function(request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("Hello World");
    response.end();
}).listen(process.env.PORT || 8888);
