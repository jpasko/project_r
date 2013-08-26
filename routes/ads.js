/**
 * Functions for Creating, Reading, Updating, and Deleting Ads.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

/**
 * Create a new Ad within the specified AdSpace.
 */
exports.createAd = function(request, response) {
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var ad = request.body;
    var newAdID = 0;
    var adSpaceID = request.params.adspace_id;
    var params = exports._adSpaceParams(response.app.get("adspace_table_name"),
				       adSpaceID);
    // Check if the AdSpace exists.
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else if (exports._isEmpty(data)) {
	    response.send( {"status": 400,
			    "message": "AdSpace does not exist"} );
	} else {
	    params = {
		"TableName": response.app.get("ads_table_name"),
		"KeyConditions": {
		    "AdSpaceID": {
			"AttributeValueList" : [{
			    "S": adSpaceID
			}],
			"ComparisonOperator" : "EQ"
		    }
		}
	    };
	    // Query to determine how many ads this AdSpace contains, and
	    // select an appropriate AdID.
	    db.query(params, function(err, data) {
		if (err) {
		    response.send(err);
		} else {
		    if (data.Count > 0) {
			for (var i = 0; i < data.Count; i++) {
			    if (data.Items[i].AdID.N > newAdID) {
				newAdID = data.Items[i].AdID.N;
			    }
			}
			newAdID++;
		    }
		    params = {
			"TableName": response.app.get("ads_table_name"),
			"Item": {
			    "AdSpaceID": {
				"S": adSpaceID
			    },
			    "AdID": {
				"N": newAdID + ""
			    },
			    "image": {
				"S": "null"
			    },
			    "date": {
				"S": new Date().toISOString()
			    }
			}
		    };
		    for (var attr in ad) {
			// The image attribute is a Base64 encoded file and must
			//  be processed separately.
			if (attr == "image" && !!ad["image"]) {
			    var file = exports._parseFile(ad[attr]);
			    if (file.isBase64) {
				var ext = file.ext;
				var key = adSpaceID + "_" + newAdID+ "." + ext;
				s3.upload(file.body, key);
				params.Item["image"] = {
				    "S": s3.getAdImageURL(adSpaceID,
							  newAdID, ext)
				};
			    }
			} else if (ad[attr] instanceof Array) {
			    params.Item[attr] = {"SS": ad[attr]};
			} else {
			    params.Item[attr] = {"S": ad[attr]};
			}
		    }
		    // Finally, put the new ad.
		    db.putItem(params, function(err, data) {
			if (err) {
			    response.send(err);
			} else {
			    response.send( {"status": 201,
					    "message": "Success",
					    "AdSpaceID": adSpaceID,
					    "AdID": newAdID} );
			}
		    });
		}
	    });
	}
    });
};

/**
 * Get a single Ad within the specified AdSpace. If no AdID is specified, a
 * random ad is chosen.
 */
exports.getAd = function(request, response) {
    var db = response.app.get("db");
    var params = {
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
	} else if (request.params.ad_id &&
		   request.params.ad_id >= 0 &&
		   request.params.ad_id < data.Count &&
		   data.Count > 0) {
	    response.send(
		exports._parseItem(data.Items[request.params.ad_id]));
	} else if (data.Count > 0 && !request.params.ad_id) {
	    response.send(
		exports._parseItem(
		    data.Items[exports._getRandomInt(data.Count - 1)]));
	} else {
	    response.send({"status": 404,
			   "message": "No such ad"});
	}
    });
};

/**
 * Get all ads in the specified AdSpace.
 */
exports.getAllAds = function(request, response) {
    var db = response.app.get("db");
    var params = {
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
	} else {
	    var result = {"Count": data.Count,
			  "Ads": []};
	    for (var i = 0; i < data.Count; i++) {
		result.Ads[i] = exports._parseItem(data.Items[i]);
	    }
	    response.send(result);
	}
    });
};

/**
 * Updates the specified ad. If it doesn't exist, a new ad is created.
 */
exports.updateAd = function(request, response) {
    var db = response.app.get("db");
    var s3 = response.app.get("s3");
    var ad = request.body;
    var adSpaceID = request.params.adspace_id;
    var adID = request.params.ad_id;
    var params = {
	"TableName": response.app.get("ads_table_name"),
	"Key": {
	    "AdSpaceID": {
		"S": adSpaceID
	    },
	    "AdID": {
		"N": adID + ""
	    }
	},
	"AttributeUpdates": {}
    };
    for (var attr in ad) {
	if (attr == "AdID" || attr == "AdSpaceID") {
	    continue;
	} else if (attr == "image") {
	    var file = exports._parseFile(ad[attr]);
	    if (file.isBase64) {
		var ext = file.ext;
		var key = adSpaceID + "_" + adID + "." + ext;
		s3.upload(file.body, key);
		params.AttributeUpdates[attr] = {
		    "Value": {
			"S": s3.getAdImageURL(adSpaceID, adID, ext)
		    },
		    "Action": "PUT"
		};
	    }
	} else {
	    params.AttributeUpdates[attr] = {
		"Value": {
		    "S": ad[attr]
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
 * Deletes the specified Ad if it exists without deleting the AdSpace.
 */
exports.deleteAd = function(request, response) {
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("ads_table_name"),
	"Key": {
	    "AdSpaceID": {
		"S": request.params.adspace_id
	    },
	    "AdID": {
		"N": request.params.ad_id + ""
	    }
	}
    };
    db.deleteItem(params, function(err, data) {
	if (err) {
	    response.send(err);
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
	    attribute["N"] : attribute["S"] ? attribute["S"] : null;
	result[attr] = value;
    }
    return result;
};

/**
 * Generates a random integer in the range [0, max).
 */
exports._getRandomInt = function(max) {
    return Math.floor(Math.random() * (max + 1));
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

// TEST
exports.test = function(request, response) {
    var test = request.body;
    var params = {};
    for (var attr in test) {
	params[attr] = {"S": test[attr]};
    }
    response.send(params);
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
