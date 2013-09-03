/**
 * Master Node.js server for AdCrafted.
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
  , path       = require("path")
  , api        = require("./apps/api/api")
  , manage     = require("./apps/manage/manage");

/**
 * Express application.
 */
var app = express();

/**
 * Environment-specific Express application configuration.
 */
app.configure("local", function() {
    console.log("Using local settings for Default Application.");
    app.use(express.logger("dev"));
    app.use(express.static(path.join(__dirname, "public")));
    // AWS configuration and AWS-related settings.
    AWS.config.loadFromPath("./.local/credentials.json");
    app.set("s3_bucket", "project-r");
    app.set("adspace_table_name", "AdSpace-dev");
    app.set("ads_table_name", "Ads-dev");
    // Subdomains for the API and the management application.
    app.use(express.vhost("api.test.com", api.app));
    app.use(express.vhost("manage.test.com", manage.app));
});
app.configure("development", function() {
    console.log("Using development settings.");
    app.use(express.logger("dev"));
    // AWS configuration and AWS-related settings.
    AWS.config.update({region: 'us-east-1'});
    app.set("s3_bucket", "project-r");
    app.set("adspace_table_name", "AdSpace-dev");
    app.set("ads_table_name", "Ads-dev");
    // Subdomains for the API and the management application.
    app.use(express.vhost("api.adcrafted.com", api.app));
    app.use(express.vhost("manage.adcrafted.com", manage.app));
});
app.configure("production", function() {
    console.log("Using production settings.");
    app.use(express.logger("tiny"));
    // AWS configuration and AWS-related settings.
    AWS.config.update({region: 'us-east-1'});
    app.set("s3_bucket", "project-r");
    app.set("adspace_table_name", "AdSpace-dev");
    app.set("ads_table_name", "Ads-dev");
    // Subdomains for the API and the management application.
    app.use(express.vhost("api.adcrafted.com", api.app));
    app.use(express.vhost("manage.adcrafted.com", manage.app));
});

/**
 * General Express application configuration.
 */
app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.favicon());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.compress());
    app.set("views", __dirname + "/views");
    app.set("view engine", "jade");
    app.set("email_table", "AdCrafted-emails");
    // Create a DynamoDB management instance and share among the applications.
    var db = new AWS.DynamoDB();
    app.set("db", db);
    api.app.set("db", db);
    manage.app.set("db", db);
    // Create an S3 management instance and share among the applications.
    var s3_SDK = new AWS.S3();
    app.set("s3", new AWSManager.S3(s3_SDK, app.get("s3_bucket")));
    api.app.set("s3", new AWSManager.S3(s3_SDK, api.app.get("s3_bucket")));
    manage.app.set("s3", new AWSManager.S3(s3_SDK, manage.app.get("s3_bucket")));
    // Error handler.
    app.use(function(err, request, response, next){
	console.error(err.stack);
	response.send(500, "500 - Internal server error");
    });
    // 404 handler.
    app.use(function(request, response, next){
	response.status(404).render("404", {title: "Page Not Found"});
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

    // NOTE: The app also currently serves a UI demo at /demo. The demo is an
    // Angular.js client of the following REST API.

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

    // =========================================================================
    // END URL routing.
    // =========================================================================

    app.listen(process.env.PORT || 8888);
}

init();
