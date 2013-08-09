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
var express = require("express")
  , AWS     = require("aws-sdk")
  , routes  = require("./routes")
  , ads     = require("./routes/ads")
  , landing = require("./routes/landing")
  , http    = require("http")
  , path    = require("path")
  , async   = require("async");

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
    app.set("s3", new AWS.S3());
    // Error handler.
    app.use(function(err, req, res, next){
	console.error(err.stack);
	res.send(500, '500 - Error.');
    });
    // 404 handler.
    app.use(function(req, res, next){
	res.send(404, '404 - Not Found.');
    });
});

/**
 * Initialize the Express application.
 */
function init() {
    // Render the home page.
    app.get("/", routes.index);

    // Retrieve a single ad from the specified AdSpace.  If no ad exists in
    // the AdSpace, a 404 response is returned; if more than one ad exists,
    // one is chosen at random.
    app.get("/adspace/:adspace_id", ads.getAd);

    // Get a specific ad from an AdSpace.
    app.get("/adspace/:adspace_id/ad/:ad_id", ads.getAd);

    // Retrieve a JSON representation for each ad in the specified AdSpace.
    app.get("/adspace/:adspace_id/all", ads.getAllAds);

    // Create a new AdSpace.
    app.post("/adspace", ads.createAdSpace);

    // Create a new ad in the specified AdSpace.
    app.post("/adspace/:adspace_id", ads.createAd);

    // Replace the specified ad with a new one, or create one if it doesn't
    // exist.
    app.put("/adspace/:adspace_id/ad/:ad_id", ads.replaceAd);

    // Delete an entire AdSpace and all ads it may reference.
    app.del("/adspace/:adspace_id", ads.deleteAdSpace);

    // Delete a specific ad without deleting the AdSpace.
    app.del("/adspace/:adspace_id/ad/:ad_id", ads.deleteAd);

    // Collect an email.
    app.post("/email", landing.collectEmail);

    app.listen(process.env.PORT || 8888);
}

init();
