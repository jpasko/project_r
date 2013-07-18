var AWS = require('aws-sdk');
var http = require('http');
var express = require('express');
var app = express();

http.createServer(function(request, response) {
    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("Hello World");
    response.end();
}).listen(process.env.PORT || 8888);
