/**
 * Functions for Creating, Reading, Updating, and Deleting Ads.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

// UUIDs are used as AdSpace identifiers.
var uuid = require('node-uuid');

// Get a single AdSpace.
exports.getAdSpace = function(request, response) {
    var db = response.app.get("db");
    var params = exports.adSpaceParams(response.app.get("adspace_table_name"),
				       request.params.adspace_id);
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else {
	    response.send(exports.parseItem(data.Item));
	}
    });
};

// Get all AdSpaces.
exports.getAllAdSpaces = function(request, response) {
    var db = response.app.get("db");
    var params = {
	"TableName": response.app.get("adspace_table_name")
    };
    db.scan(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else {
	    var result = {"Count": data.Count,
			  "AdSpaces": []};
	    for (var i = 0; i < data.Count; i++) {
		result.AdSpaces[i] = exports.parseItem(data.Items[i]);
	    }
	    response.send(result);
	}
    });
};

// Get an Ad within an AdSpace specified by the id in the request params.
// If no AdID is specified, a random ad is chosen.
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
		exports.parseAdQuery(data.Items[request.params.ad_id]));
	} else if (data.Count > 0 && !request.params.ad_id) {
	    response.send(
		exports.parseAdQuery(
		    data.Items[exports.getRandomInt(data.Count - 1)]));
	} else {
	    response.send( {"status": 404,
			    "message": "No such ad"} );
	}
    });
};

// Get all ads in the specified AdSpace.
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
		result.Ads[i] = exports.parseAdQuery(data.Items[i]);
	    }
	    response.send(result);
	}
    });
};

// Create a new AdSpace, returning JSON indicating the new AdSpaceID.
exports.createAdSpace = function(request, response) {
    var db = response.app.get("db");
    var adspace_id = uuid.v4();
    var params = {
	"TableName": response.app.get("adspace_table_name"),
	"Item": {
	    "AdSpaceID": {
		"S": adspace_id
	    },
	    "publisher_id": {
		"S": "placeholder"
	    }
	}
    };
    db.putItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else {
	    response.send( {"status": 200,
			    "message": "Success",
			    "AdSpaceID": adspace_id} );
	}
    });
};

// Create a new Ad within an existing AdSpace specified by the id.
// Returns JSON indicating the new AdID.
exports.createAd = function(request, response) {
    var db = response.app.get("db");
    var ad = request.body;
    var newAdID = 0;
    var adSpaceID = request.params.adspace_id;
    var params = exports.adSpaceParams(response.app.get("adspace_table_name"),
				       adSpaceID);
    // Check if the AdSpace exists.
    db.getItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else if (exports.isEmpty(data)) {
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
			    "title": {
				"S": ad.title ? ad.title : "null"
			    },
			    "text": {
				"S": ad.text ? ad.text : "null"
			    },
			    "image": {
				"S": ad.image ? ad.image : "null"
			    },
			    "link": {
				"S": ad.link ? ad.link : "null"
			    }
			}
		    };
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

// Replaces the specified ad.  If it doesn't exist, a new ad is created.
exports.replaceAd = function(request, response) {
    var db = response.app.get("db");
    var ad = request.body;
    var adID = request.params.ad_id;
    var adSpaceID = request.params.adspace_id;
    var params = {
	"TableName": response.app.get("ads_table_name"),
	"Item": {
	    "AdSpaceID": {
		"S": adSpaceID
	    },
	    "AdID": {
		"N": adID + ""
	    },
	    "title": {
		"S": ad.title ? ad.title : "null"
	    },
	    "text": {
		"S": ad.text ? ad.text : "null"
	    },
	    "image": {
		"S": ad.image ? ad.image : "null"
	    },
	    "link": {
		"S": ad.link ? ad.link : "null"
	    }
	}
    };
    db.putItem(params, function(err, data) {
	if (err) {
	    response.send(err);
	} else {
	    response.send( {"status": 201,
			    "message": "Success",
			    "AdSpaceID": adSpaceID,
			    "AdID": adID} );
	}
    });
};

// Deletes an AdSpace and all Ads it references.
exports.deleteAdSpace = function(request, response) {
    var db = response.app.get("db");
    var params = exports.adSpaceParams(response.app.get("adspace_table_name"),
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

// Deletes the specified Ad if it exists without deleting the AdSpace.
exports.deleteAd = function(request, response) {
    var db = response.app.get("db");
    var params = exports.adsParams(response.app.get("ads_table_name"),
				     request.params.adspace_id,
				     request.params.ad_id);
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
 * Parses an Ad.
 */
exports.parseAd = function(ad) {
    return {"title": ad.Item.title ? ad.Item.title.S : null,
	    "text": ad.Item.text ? ad.Item.text.S : null,
	    "image": ad.Item.image ? ad.Item.image.S : null,
	    "link": ad.Item.link ? ad.Item.link.S : null
	   };
}

/**
 * Parses an Ad returned in a query.
 */
exports.parseAdQuery = function(ad) {
    return {"title": ad.title ? ad.title.S : null,
	    "text": ad.text ? ad.text.S : null,
	    "image": ad.image ? ad.image.S : null,
	    "link": ad.link ? ad.link.S : null
	   };
}

/**
 * Parses an item returned from a query.
 */
exports.parseItem = function(item) {
    var result = {};
    for (var attr in item) {
	var attribute = item[attr];
	var value = attribute["N"] ?
	    attribute["N"] : attribute["S"] ? attribute["S"] : "null";
	result[attr] = value;
    }
    return result;
}

/**
 * Generates a random integer in the range [0, max).
 */
exports.getRandomInt = function(max) {
    return Math.floor(Math.random() * (max + 1));
}

/**
 * Checks if the object is empty (has no properties of its own).
 */
exports.isEmpty = function(o){
    for(var i in o){
        if(o.hasOwnProperty(i)){
            return false;
        }
    }
    return true;
}

/**
 * Creates a request parameters object for adSpaceTable.
 */
exports.adSpaceParams = function(tableName, adSpaceID) {
    return {
	"TableName": tableName,
	"Key": {
	    "AdSpaceID": {
		"S": adSpaceID
	    }
	}
    };
}

/**
 * Creates a request parameters object for adsTable.
 */
exports.adsParams = function(tableName, adSpaceID, adID) {
    return {
	"TableName": tableName,
	"Key": {
	    "AdSpaceID": {
		"S": adSpaceID
	    },
	    "AdID": {
		"N": adID + ""
	    }
	}
    };
}

// TEST
exports.test = function(request, response) {
    var s3 = response.app.get("s3");
    s3.test();
    response.send("TEST");
};
