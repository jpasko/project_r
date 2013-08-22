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

function CreateAdSpaceCtrl($scope, AdSpaceCollection) {
    $scope.adSpace = {};

    $scope.create = function(newAdSpaceForm) {
	if (newAdSpaceForm.$valid) {
	    AdSpaceCollection.create($scope.adSpace, function() {
		window.location = "#/adspaces/";
	    });
	}
    }
}

function EditAdSpaceCtrl($scope, $routeParams, SingleAdSpace) {
    $scope.adSpace = SingleAdSpace.get({adSpaceID: $routeParams.AdSpaceID});

    $scope.adSpace.image = $scope.adSpace.image || "http://placehold.it/240x240";

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


function CreateAdCtrl($scope, $routeParams, AdCollection) {
    $scope.adSpaceID = $routeParams.AdSpaceID;

    $scope.ad = {};

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

function EditAdCtrl($scope, $routeParams, SingleAd) {
    $scope.adSpaceID = $routeParams.AdSpaceID;

    $scope.ad = SingleAd.get({adID: $routeParams.AdID,
			      adSpaceID: $routeParams.AdSpaceID});

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