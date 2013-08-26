/**
 * Functions for Creating, Reading, Updating, and Deleting AdSpaces.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

/**
 * UUIDs are used as AdSpace identifiers.
 */
var uuid = require("node-uuid");

/**
 * Create a new AdSpace, returning JSON indicating the new AdSpaceID.
 */
exports.createAdSpace = function(request, response) {
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var adspace_id = uuid.v4();
    var adspace_body = request.body;
    var params = {
	"TableName": response.app.get("adspace_table_name"),
	"Item": {
	    "AdSpaceID": {
		"S": adspace_id
	    },
	    "date": {
		"S": new Date().toISOString()
	    },
	    "image": {
		"S": "null"
	    }
	}
    };
    for (var attr in adspace_body) {
	// The image attribute is a Base64 encoded file and must be processed
	// separately.
	if (attr == "image" && !!adspace_body["image"]) {
	    var file = exports._parseFile(adspace_body[attr]);
	    if (file.isBase64) {
		var ext = file.ext;
		var key = adspace_id + "." + ext;
		s3.upload(file.body, key);
		params.Item[attr] = {
		    "S": s3.getAdSpaceImageURL(adspace_id, ext)
		};
	    }
	} else if (adspace_body[attr] instanceof Array) {
	    params.Item[attr] = {"SS": adspace_body[attr]};
	} else {
	    params.Item[attr] = {"S": adspace_body[attr]};
	}
    }
    db.putItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else {
	    response.send( {"status": 201,
			    "message": "Success",
			    "AdSpaceID": adspace_id} );
	}
    });
};

/**
 * Get a single AdSpace.
 */
exports.getAdSpace = function(request, response) {
    var db = response.app.get("db");
    var params = exports._adSpaceParams(response.app.get("adspace_table_name"),
				       request.params.adspace_id);
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else if (!exports._isEmpty(data)) {
	    response.send(exports._parseItem(data.Item));
	} else {
	    response.send({"status": 404,
			   "message": "AdSpace does not exist"});
	}
    });
};

/**
 * Get all AdSpaces.
 */
exports.getAllAdSpaces = function(request, response) {
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("adspace_table_name")
    };
    db.scan(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else {
	    var result = {"status": 200,
			  "Count": data.Count,
			  "AdSpaces": []};
	    for (var i = 0; i < data.Count; i++) {
		result.AdSpaces[i] = exports._parseItem(data.Items[i]);
	    }
	    response.send(result);
	}
    });
};

/**
 * Updates the specified AdSpace. If it doesn't exist, a new AdSpace is created.
 */
exports.updateAdSpace = function(request, response) {
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var adspace_body = request.body;
    var adspace_id = request.params.adspace_id;
    var params = {
	"TableName": response.app.get("adspace_table_name"),
	"Key": {
	    "AdSpaceID": {
		"S": adspace_id
	    }
	},
	"AttributeUpdates": {}
    };
    for (var attr in adspace_body) {
	if (attr == "AdSpaceID") {
	    continue;
	} else if (attr == "image") {
	    var file = exports._parseFile(adspace_body[attr]);
	    if (file.isBase64) {
		var ext = file.ext;
		var key = adspace_id + "." + ext;
		s3.upload(file.body, key);
		params.AttributeUpdates[attr] = {
		    "Value": {
			"S": s3.getAdSpaceImageURL(adspace_id, ext)
		    },
		    "Action": "PUT"
		};
	    }
	} else if (adspace_body[attr] instanceof Array) {
	    params.AttributeUpdates[attr] = {
		"Value": {
		    "SS": adspace_body[attr]
		},
		"Action": "PUT"
	    };
	} else {
	    params.AttributeUpdates[attr] = {
		"Value": {
		    "S": adspace_body[attr]
		},
		"Action": "PUT"
	    };
	}
    }
    db.updateItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else {
	    response.send( {"status": 200,
			    "message": "Success"} );
	}
    });
};

/**
 * Deletes an AdSpace and all Ads it references.
 */
exports.deleteAdSpace = function(request, response) {
    var db = response.app.get("db");
    var params = exports._adSpaceParams(response.app.get("adspace_table_name"),
				       request.params.adspace_id);
    db.deleteItem(params).send();
    // Reassign params to facilitate a query of the Ads table.
    params = {
	"TableName": response.app.get("ads_table_name"),
	"KeyConditions": {
	    "AdSpaceID": {
		"AttributeValueList" : [{
		    "S": request.params.adspace_id
		}],
		"ComparisonOperator" : "EQ"
	    }
	}
    };
    db.query(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else if (data.Count > 0) {
	    var batch = [];
	    for (var i = 0; i < data.Count; i++) {
		batch[i] = {
                    "DeleteRequest": {
			"Key": {
			    "AdSpaceID": {
				"S": request.params.adspace_id
			    },
			    "AdID": {
				"N": data.Items[i].AdID.N
			    }
			}
		    }
		};
	    }
	    params = {
		"RequestItems": {}
	    };
	    params.RequestItems[response.app.get("ads_table_name")] = batch;
	    db.batchWriteItem(params, function(err, data) {
		if (err) {
		    response.send(err);
		} else {
		    response.send( {"status": 200,
				    "message": "Success"} );
		}
	    });
	} else {
	    response.send( {"status": 200,
			    "message": "Success"} );
	}
    });
};

/**
 * Parses an item returned from a query or getItem operation.
 */
exports._parseItem = function(item) {
    var result = {};
    for (var attr in item) {
	var attribute = item[attr];
	var value = attribute["N"] ?
	    attribute["N"] : attribute["S"] ?
	    attribute["S"] : attribute["SS"] ?
	    attribute["SS"] : null;
	result[attr] = value;
    }
    return result;
};

/**
 * Checks if the object is empty (has no properties of its own).
 */
exports._isEmpty = function(o){
    for(var i in o){
        if(o.hasOwnProperty(i)){
            return false;
        }
    }
    return true;
};

/**
 * Creates a request parameters object for AdSpace table.
 */
exports._adSpaceParams = function(tableName, adSpaceID) {
    return {
	"TableName": tableName,
	"Key": {
	    "AdSpaceID": {
		"S": adSpaceID
	    }
	}
    };
};

/**
 * Extracts the metadata from the Base64 encoded data and returns an object
 * containing the metadata and data.
 * @param {string} file The URL/Base64 encoded file.
 */
exports._parseFile = function(file){
    var result = {};
    var matches = file.match(/^data:.+\/(.+);base64,(.*)$/);
    if (!!matches && matches.length == 3) {
	result = {
	    "isBase64": true,
	    "ext": matches[1],
	    "body": new Buffer(matches[2], 'base64')
	};
    } else {
	result = {
	    "isBase64": false
	};
    }
    return result;
};
