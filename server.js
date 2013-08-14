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
  , adspaces   = require("./routes/adspaces")
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
    // URLs for human-readable content in the browser, rendered on the server.
    // =========================================================================

    // Render the landing page.
    app.get("/", website.index);

    // =========================================================================
    // The REST API.
    // =========================================================================

    // CREATE a new AdSpace.
    app.post("/api/adspace", adspaces.createAdSpace);

    // RETRIEVE all AdSpaces.
    app.get("/api/adspace", adspaces.getAllAdSpaces);

    // RETRIEVE a single AdSpace.
    app.get("/api/adspace/:adspace_id", adspaces.getAdSpace);

    // UPDATE an AdSpace.
    app.put("/api/adspace/:adspace_id", adspaces.updateAdSpace);

    // DELETE an AdSpace and all ads it may reference.
    app.del("/api/adspace/:adspace_id", adspaces.deleteAdSpace);

    // CREATE an ad in the specified AdSpace.
    app.post("/api/adspace/:adspace_id/ad", ads.createAd);

    // RETRIEVE all ads within the specified AdSpace.
    app.get("/api/adspace/:adspace_id/ad", ads.getAllAds);

    // RETRIEVE a single ad from the specified AdSpace.
    app.get("/api/adspace/:adspace_id/ad/:ad_id", ads.getAd);

    // UPDATE an ad.
    app.put("/api/adspace/:adspace_id/ad/:ad_id", ads.updateAd);

    // DELETE an ad without deleting the AdSpace.
    app.del("/api/adspace/:adspace_id/ad/:ad_id", ads.deleteAd);

    // =========================================================================
    // Miscellaneous URLs.
    // =========================================================================

    // RETRIEVE a random ad from the specified AdSpace.
    app.get("/api/adspace/:adspace_id/random", ads.getAd);

    // Collect an email.
    app.post("/email", landing.collectEmail);

    // TEST
    app.post("/test", ads.test);

    // =========================================================================
    // END URL routing.
    // =========================================================================

    app.listen(process.env.PORT || 8888);
}

init();
