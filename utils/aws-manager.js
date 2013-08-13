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

    // Test public attribute;
    this.foo = [];
}

/**
 * TEST -- list all buckets.
 */
S3.prototype.test = function() {
    this.s3.listBuckets((function(err, data) {
	console.log("Before: " + this.foo);
	for (var index in data.Buckets) {
	    var bucket = data.Buckets[index];
	    console.log("Bucket: ", bucket.Name, ' : ', bucket.CreationDate);
	    this.foo[index] = bucket.Name;
	}
	console.log("After: " + this.foo);
    }).bind(this));
};

/**
 * Create the specified S3 folder.
 * @return {boolean} success.
 */
S3.prototype.createFolder = function(name) {

};

/**
 * Delete the specified folder from S3.
 * @return {boolean} success.
 */
S3.prototype.delFolder = function(name) {

};

/**
 * Upload a file to S3.  The file is named <adID>.ext and placed into the
 * <folderName> folder within the S3 bucket.
 * @return {boolean} success.
 */
S3.prototype.upload = function(file, folderName, adID) {
    var params = {
	"ACL": "public-read",
	"Bucket": this.bucket
    };
};

/**
 * Delete the selected file from S3.
 * @return {boolean} success.
 */
S3.prototype.del = function(folderName, adID) {

};

/**
 * Returns the public URL.
 * @return {string} The url.
 */
S3.prototype.getURL = function(adSpaceID, adID) {
    return "https://" + this.bucket + ".s3.amazonaws.com/" + adSpaceID + "/" + adID;
};

// Finally, assign the S3 object to exports, to be used as a module.
exports.S3 = S3;
