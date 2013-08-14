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
