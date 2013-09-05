/**
 * A collection of AWS clients to simplify interactions with AWS services.
 *
 * Author: James Pasko (james@adcrafted.com).
 */

/**
 * A manager to simplify interactions with Amazon's S3 through their Node.js
 * SDK. 
 *
 * @constructor
 */
function S3(s3, bucket) {
    // AWS-SDK S3 object for Node.js.
    this.s3 = s3;

    // The S3 bucket name.
    this.bucket = bucket;

    // All supported image types.
    this.imageTypes = ["jpeg", "png", "gif", "tiff"];
}

/**
 * Upload an object to S3.
 * @param {Buffer} body The Buffer containing the file data.
 * @param {number} key.
 * @param {number} contentType.
 */
S3.prototype.upload = function(body, key, contentType) {
    var params = {
	"ACL": "public-read",
	"Body": body,
	"Bucket": this.bucket,
	"Key": key,
	"ContentType": contentType
    };
    this.s3.putObject(params, function(err, data) {
	if (err) {
	    console.log("Error uploading S3 object: " + err);
	}
    });
};

/**
 * Deletes all possible images for the AdSpace.
 * @param {number} adSpaceID.
 * @param {string} ext.
 */
S3.prototype.deleteAdSpaceImage = function(adSpaceID) {
    var allPossibleImages = [];
    for (var i = 0; i < this.imageTypes.length; i++) {
	allPossibleImages[i] = {
	    "Key": adSpaceID + "." + this.imageTypes[i]
	}
    }
    var params = {
	"Bucket": this.bucket,
	"Delete": {
	    "Objects": allPossibleImages
	}
    };
    this.s3.deleteObjects(params, function(err, data) {
	if (err) {
	    console.log("Error deleting S3 AdSpace image: " + err);
	}
    });
};

/**
 * Deletes all possible images for the Ad.
 * @param {number} adSpaceID.
 * @param {number} adID.
 * @param {string} ext.
 */
S3.prototype.deleteAdImage = function(adSpaceID, adID) {
    var allPossibleImages = [];
    for (var i = 0; i < this.imageTypes.length; i++) {
	allPossibleImages[i] = {
	    "Key": adSpaceID + "_" + adID + "." + this.imageTypes[i]
	}
    }
    var params = {
	"Bucket": this.bucket,
	"Delete": {
	    "Objects": allPossibleImages
	}
    };
    this.s3.deleteObjects(params, function(err, data) {
	if (err) {
	    console.log("Error deleting S3 Ad image: " + err);
	}
    });
};

/**
 * Returns the public URL for an AdSpace image.
 * @param {number} adSpaceID.
 * @param {string} ext.
 * @return {string} The url.
 */
S3.prototype.getAdSpaceImageURL = function(adSpaceID, ext) {
    return "https://" + this.bucket + ".s3.amazonaws.com/" +
	adSpaceID + "." + ext;
};

/**
 * Returns the public URL for an Ad image.
 * @param {number} adSpaceID.
 * @param {number} adID.
 * @param {string} ext.
 * @return {string} The url.
 */
S3.prototype.getAdImageURL = function(adSpaceID, adID, ext) {
    return "https://s3.amazonaws.com/" + this.bucket + "/" +
	adSpaceID + "_" + adID + "." + ext;
};

// Assign the S3 object to exports, to be used as a module.
exports.S3 = S3;
