// Create a module named "adSpaceServices" with a dependency on "ngResource".
var adSpaceServices = angular.module("adSpaceServices", ["ngResource"]);

adSpaceServices.factory("AdSpaceCollection", function($resource){
    return $resource("/api/adspace", {}, {
	create: {method: "POST"},
	get: {method: "GET"}
    });
});

adSpaceServices.factory("SingleAdSpace", function($resource){
    return $resource("/api/adspace/:adSpaceID", {}, {
	get: {method: "GET"},
	update: {method: "PUT"},
	del: {method: "DELETE"}
    });
});

// A module for Ad services.
var adServices = angular.module("adServices", ["ngResource"]);

adServices.factory("AdCollection", function($resource){
    return $resource("/api/adspace/:adSpaceID/ad", {}, {
	create: {method: "POST"},
	get: {method: "GET"}
    });
});

adServices.factory("SingleAd", function($resource){
    return $resource("/api/adspace/:adSpaceID/ad/:adID", {}, {
	get: {method: "GET"},
	update: {method: "PUT"},
	del: {method: "DELETE"}
    });
});
