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
}

/**
 * Upload an object to S3.
 * @param {Buffer} body The Buffer containing the file data.
 * @param {number} key.
 */
S3.prototype.upload = function(body, key) {
    var params = {
	"ACL": "public-read",
	"Body": body,
	"Bucket": this.bucket,
	"Key": key
    };
    this.s3.putObject(params, function(err, data) {
	if (err) {
	    console.log("Error uploading S3 object: " + err);
	}
    });
};

/**
 * Delete the selected object from S3.
 * @param {number} adSpaceID.
 * @param {number} adID.
 * @param {string} ext.
 */
S3.prototype.del = function(adSpaceID, adID, ext) {
    var key = adSpaceID + "_" + adID + "." + ext;
    var params = {
	"Bucket": this.bucket,
	"Key": key
    };
    this.s3.deleteObject(params, function(err, data) {
	if (err) {
	    console.log("Error deleting S3 object: " + err);
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
    return "https://" + this.bucket + ".s3.amazonaws.com/" +
	adSpaceID + "_" + adID + "." + ext;
};

// Assign the S3 object to exports, to be used as a module.
exports.S3 = S3;
