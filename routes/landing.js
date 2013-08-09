/**
 * A collection of server interactions to use with the landing page.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

// Email validator (among other things).
var check = require('validator').check;

// Collects emails.
exports.collectEmail = function(request, response) {
    var db = response.app.get("db");
    try {
	var email = request.body.email;
	check(email).isEmail();
	var params = {
	    "TableName": response.app.get("email_table"),
	    "Item": {
		"email": {
		    "S": email
		}
	    }
	};
	db.putItem(params, function(err, data) {
	    if (err) {
		response.send(err);
	    } else {
		response.send( {"status": 200,
				"message": "Success"} );
	    }
	});
    } catch (e) {
	response.send( {"status": 400,
			"message": "your email appears to be invalid"} );
    }
};
