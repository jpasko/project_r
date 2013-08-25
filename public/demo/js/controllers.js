/**
 * Controllers
 */

function AdSpaceListCtrl($scope, AdSpaceCollection, SingleAdSpace) {
    $scope.AdSpaces = AdSpaceCollection.get();
    $scope.orderReverse = false;
    $scope.orderProp = "date";
    $scope.populateSearch = function(tag) {
	$scope.query = tag;
    }
}

function AdSpaceDetailCtrl($scope, $routeParams, AdCollection) {
    $scope.AdSpaceID = $routeParams.AdSpaceID;
    $scope.AdCollection = AdCollection.get({adSpaceID: $scope.AdSpaceID});
    $scope.orderReverse = false;
    $scope.orderProp = "title";
}

function CreateAdSpaceCtrl($scope, AdSpaceCollection, CustomFileReader) {
    // Pre-populate the adSpace object with a null image to allow the fallback
    // src attribute to work properly.
    $scope.adSpace = {image: "null"};

    // Read the file from the drop event on the tag with imageDrop directive.
    // The tag with the directive must also specify an on-change attribute,
    // which should reference this function.
    $scope.readFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.adSpace.image = result;
            });
    };

    // Call the create service which wraps a call to the REST API, thus creating
    // the new AdSpace.
    $scope.create = function(newAdSpaceForm) {
	if (newAdSpaceForm.$valid) {
	    AdSpaceCollection.create($scope.adSpace, function() {
		window.location = "#/adspaces/";
	    });
	}
    }
}

function EditAdSpaceCtrl($scope, $routeParams, SingleAdSpace, CustomFileReader) {
    $scope.adSpace = SingleAdSpace.get({adSpaceID: $routeParams.AdSpaceID});

    $scope.readFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.adSpace.image = result;
            });
    };

    $scope.update = function(AdSpaceForm) {
	if (AdSpaceForm.$valid) {
	    SingleAdSpace.update({adSpaceID: $routeParams.AdSpaceID},
				 $scope.adSpace, function() {
				     window.location = "#/adspaces/";
				 });
	}
    }

    $scope.del = function() {
	SingleAdSpace.del({adSpaceID: $routeParams.AdSpaceID}, function() {
	    window.location = "#/adspaces/";
	});
    }
}


function CreateAdCtrl($scope, $routeParams, AdCollection, CustomFileReader) {
    $scope.adSpaceID = $routeParams.AdSpaceID;

    $scope.ad = {image: "null"};

    $scope.readFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.ad.image = result;
            });
    };

    $scope.create = function(newAdForm) {
	if (newAdForm.$valid) {
	    AdCollection.create({adSpaceID: $routeParams.AdSpaceID},
				$scope.ad, function() {
				    window.location = "#/adspaces/" +
					$routeParams.AdSpaceID;
				});
	}
    }
}

function EditAdCtrl($scope, $routeParams, SingleAd, CustomFileReader) {
    $scope.adSpaceID = $routeParams.AdSpaceID;

    $scope.ad = SingleAd.get({adID: $routeParams.AdID,
			      adSpaceID: $routeParams.AdSpaceID});

    $scope.readFile = function() {         
        CustomFileReader.readAsDataUrl($scope.file, $scope)
            .then(function(result) {
                $scope.ad.image = result;
            });
    };

    $scope.update = function(AdForm) {
	if (AdForm.$valid) {
	    SingleAd.update({adSpaceID: $routeParams.AdSpaceID,
			     adID: $routeParams.AdID},
			    $scope.ad, function() {
				window.location =
				    "#/adspaces/" + $routeParams.AdSpaceID;
			    });
	}
    }

    $scope.del = function() {
	SingleAd.del({adSpaceID: $routeParams.AdSpaceID,
		      adID: $routeParams.AdID}, function() {
			  window.location =
			      "#/adspaces/" + $routeParams.AdSpaceID;
		      });
    }
}