var express = require('express');
var ads = require('./routes/ads');
var app = express();

app.get('/', function(request, response) {
    response.send('Project R - GET /adspace/:id to retrieve an ad.');
});

app.get('/:id', ads.getAd);
app.get('/adspace/:id', ads.getAdTest);

app.listen(process.env.PORT || 8888);
