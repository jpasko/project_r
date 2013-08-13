/**
 * Node.js server for AdCrafted.
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
var express    = require("express")
  , AWS        = require("aws-sdk")
  , ads        = require("./routes/ads")
  , website    = require("./routes/website")
  , landing    = require("./routes/landing")
  , AWSManager = require("./utils/aws-manager")
  , http       = require("http")
  , fs         = require("fs")
  , path       = require("path")
  , async      = require("async");

/**
 * Express application.
 */
var app = express();

/**
 * Environment-specific Express application configuration.
 */
app.configure("local", function() {
    console.log("Using local settings.");
    AWS.config.loadFromPath("./.local/credentials.json");
    app.set("s3_bucket", "project-r");
    app.set("adspace_table_name", "AdSpace-dev");
    app.set("ads_table_name", "Ads-dev");
    app.use(express.logger("dev"));
});
app.configure("development", function() {
    console.log("Using development settings.");
    AWS.config.update({region: 'us-east-1'});
    app.set("s3_bucket", "project-r");
    app.set("adspace_table_name", "AdSpace-dev");
    app.set("ads_table_name", "Ads-dev");
    app.use(express.logger("dev"));
});
app.configure("production", function() {
    console.log("Using production settings.");
    AWS.config.update({region: 'us-east-1'});
    app.set("s3_bucket", "project-r");
    app.set("adspace_table_name", "AdSpace-dev");
    app.set("ads_table_name", "Ads-dev");
    app.use(express.logger("tiny"));
});

/**
 * General Express application configuration.
 */
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.favicon());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, "public")));
    app.set("views", __dirname + "/views");
    app.set("view engine", "jade");
    app.set("email_table", "AdCrafted-emails");
    app.set("db", new AWS.DynamoDB());
    app.set("s3", new AWSManager.S3(new AWS.S3(), app.get("s3_bucket")));
    app.set("fs", fs);
    // Error handler.
    app.use(function(err, request, response, next){
	console.error(err.stack);
	response.send(500, '500 - Error.');
    });
    // 404 handler.
    app.use(function(request, response, next){
	//response.send(404, '404 - Not Found.');
	response.render('404', {title: '404'});
    });
});

/**
 * Initialize the Express application.
 */
function init() {
    // =========================================================================
    // URLs for human-readable content in the browser.
    // =========================================================================

    // Render the landing page.
    app.get("/", website.index);

    // Show all AdSpaces and allow AdSpace creation.
    // app.get("/adspaces", website.allAdSpaces);

    // Show all ads within a single AdSpace and allow ad creation as well as
    // AdSpace deletion.
    // app.get("/adspaces/:adspace_id", website.singleAdSpace);

    // Show a single ad and allow modification and deletion.
    // app.get("/adspaces/:adspace_id/ad/:ad_id", website.singleAd);

    // =========================================================================
    // The REST API.
    // =========================================================================

    // Get all AdSpaces.
    app.get("/api/adspace", ads.getAllAdSpaces);

    // Get a specific AdSpace.
    app.get("/api/adspace/:adspace_id", ads.getAdSpace);

    // Get all ads within the specified AdSpace.
    app.get("/api/adspace/:adspace_id/ad", ads.getAllAds);

    // Get a random ad from the specified AdSpace.
    app.get("/api/adspace/:adspace_id/ad/random", ads.getAd);

    // Get a specific ad from the specified AdSpace.
    app.get("/api/adspace/:adspace_id/ad/:ad_id", ads.getAd);

    // Create a new AdSpace.
    app.post("/api/adspace", ads.createAdSpace);

    // Create a new ad in the specified AdSpace.
    app.post("/api/adspace/:adspace_id", ads.createAd);

    // Update the specified ad, or create one if it doesn't exist.
    app.put("/api/adspace/:adspace_id/ad/:ad_id", ads.replaceAd);

    // Delete an entire AdSpace and all ads it may reference.
    app.del("/api/adspace/:adspace_id", ads.deleteAdSpace);

    // Delete a specific ad without deleting the AdSpace.
    app.del("/api/adspace/:adspace_id/ad/:ad_id", ads.deleteAd);

    // =========================================================================
    // Miscellaneous URLs.
    // =========================================================================

    // Collect an email.
    app.post("/email", landing.collectEmail);

    // TEST
    // app.get("/test", ads.test);

    // TEST UPLOAD
    // app.get("/upload", website.upload);

    // =========================================================================
    // END URL routing.
    // =========================================================================

    app.listen(process.env.PORT || 8888);
}

init();
