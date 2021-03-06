/**
 * REST API Node.js server for AdCrafted.
 *
 * Currently, 3 environments are supported.
 *
 * LOCAL:
 *   Ensure that the (.gitignored) aws-credentials file exists at
 *   ./.local/credentials.json and contains the attributes accessKeyId and
 *   secreteAccessKey.
 *   Then, to start the server locally, enter these commands:
 *   $ export NODE_ENV=local
 *   $ node server.js
 *
 * DEVELOPMENT (live sandbox):
 *   Ensure that the environment variables are correct:
 *   NODE_ENV=development, and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are
 *   set.
 *
 * PRODUCTION:
 *   Ensure that the environment variables are correct:
 *   NODE_ENV=production, and AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are
 *   set.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

/**
 * Include modules here.
 */
var express  = require("express")
  , path     = require("path")
  , ads      = require("./../../routes/ads")
  , adspaces = require("./../../routes/adspaces");

/**
 * The Express application.
 */
var app = express();

/**
 * REST API environment-specific application configuration.
 */
app.configure("local", function() {
    console.log("Using local settings for REST API.");
    app.use(express.logger("dev"));
    app.set("s3_bucket", "adcrafted-s3-dev");
    app.set("adspace_table_name", "AdCrafted-AdSpace-DEV");
    app.set("ads_table_name", "AdCrafted-Ad-DEV");
});
app.configure("development", function() {
    app.use(express.logger("dev"));
    app.set("s3_bucket", "adcrafted-s3-dev");
    app.set("adspace_table_name", "AdCrafted-AdSpace-DEV");
    app.set("ads_table_name", "AdCrafted-Ad-DEV");
});
app.configure("production", function() {
    app.use(express.logger("tiny"));
    app.set("s3_bucket", "adcrafted-s3-prod");
    app.set("adspace_table_name", "AdCrafted-AdSpace-PROD");
    app.set("ads_table_name", "AdCrafted-Ad-PROD");
});

/**
 * General application configuration.
 */
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.compress());
    app.use(express.static(path.join(__dirname, "./public")));
    // Error handler.
    app.use(function(err, request, response, next){
	console.error(err.stack);
	response.send(500, '500 - Error.');
    });
    // 404 handler.
    app.use(function(request, response, next){
	response.send(404, '404 - Not Found.');
    });
});

/**
 * The REST API, to be secured by an authentication service.
 */
// CREATE a new AdSpace.
app.post("/adspace", adspaces.createAdSpace);

// RETRIEVE all AdSpaces.
app.get("/adspace", adspaces.getAllAdSpaces);

// RETRIEVE a single AdSpace.
app.get("/adspace/:adspace_id", adspaces.getAdSpace);

// UPDATE an AdSpace.
app.put("/adspace/:adspace_id", adspaces.updateAdSpace);

// DELETE an AdSpace and all ads it may reference.
app.del("/adspace/:adspace_id", adspaces.deleteAdSpace);

// CREATE an ad in the specified AdSpace.
app.post("/adspace/:adspace_id/ad", ads.createAd);

// RETRIEVE all ads within the specified AdSpace.
app.get("/adspace/:adspace_id/ad", ads.getAllAds);

// RETRIEVE a single ad from the specified AdSpace.
app.get("/adspace/:adspace_id/ad/:ad_id", ads.getAd);

// UPDATE an ad.
app.put("/adspace/:adspace_id/ad/:ad_id", ads.updateAd);

// DELETE an ad without deleting the AdSpace.
app.del("/adspace/:adspace_id/ad/:ad_id", ads.deleteAd)

exports.app = app;
