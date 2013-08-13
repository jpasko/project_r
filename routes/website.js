/**
 * A collection of server commands to render templates required to display the
 * website.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

/**
 * Renders an index (landing page) template.
 */
exports.index = function(request, response) {
    response.render("index", {title: "AdCrafted"});
};

/**
 * Renders all AdSpaces.
 */
exports.allAdSpaces = function(request, response) {
    response.render("all-adspaces", {title: "AdCrafted | View all AdSpaces"});
};

/**
 * Renders a single AdSpace.
 */
exports.singleAdSpace = function(request, response) {
    response.render(
	"single-adspace",
	{title: "AdCrafted | AdSpace " + request.params.adspace_id});
};

/**
 * Renders a single ad.
 */
exports.singleAd = function(request, response) {
    response.render("single-ad", {title: "AdCrafted | View Ad"});
};

/**
 * TEST upload page.
 */
exports.upload = function(request, response) {
    var fs = response.app.get("fs");
    response.render("upload", {title: "AdCrafted", adSpace: "4324", ad: "0"});
};
