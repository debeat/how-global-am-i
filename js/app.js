
(function () {

	// Declare namespace
	$.extend(window, { HowGlobalAmI: {} });

	var facebookAppId = '207970642575542';
	var facebookAppSecret = '09cc80dff2318192cc6eeaaeecf9d922';
	var map = null;
	var geocoder = null;
	var markers = new Array();
	var totalRows = 0;
	var errorCount = 0;
	var recordsProcessed = 0;
	var useExternalGeoCodeService = false;

	$(document).ready(function (e) {

		window.fbAsyncInit = function () {
			FB.init({
				appId: facebookAppId,
      			channelUrl : 'channel.html', // Channel File
				status: true,
				cookie: true,
				xfbml: true
			});

			fbApiInit = true;
		};

		// Load the SDK Asynchronously
		(function(d){
			var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
			if (d.getElementById(id)) {return;}
			js = d.createElement('script'); js.id = id; js.async = true;
			js.src = "https://connect.facebook.net/en_US/all.js";
			ref.parentNode.insertBefore(js, ref);
		}(document));

		$("a[href=#login]").click(function (event) {

			FB.login(function (response) {
				if (response.session) {
					if (response.perms) {
						// user is logged in and granted some permissions.
						// perms is a comma separated list of granted permissions
						console.log("logged in - WITH perms");
						setMyLocation();
					} else {
						// user is logged in, but did not grant any permissions
						console.log("logged in - no perms");
						setMyLocation();
					}
				} else {
					// user is not logged in
					console.log("not logged in");
				}
			}, { scope: "user_location,friends_location,read_friendlists" });

			event.preventDefault();

		});

		$("a[href=#get-my-location]").click(function (event) {

			setMyLocation();

			event.preventDefault();

		});

		$("a[href=#get-friends-location]").click(function (event) {

			addFriendsLocation();

			event.preventDefault();

		});

		initializeGoogleMaps();
	});

	function fbEnsureInit(callback) {
		if (!window.fbApiInit) {
			setTimeout(function () { fbEnsureInit(callback); }, 50);
		} else {
			if (callback) {
				callback();
			}
		}
	}

	fbEnsureInit(function () {
		console.log("this will be run once FB is initialized");

		FB.getLoginStatus(function (response) {
			if (response.session) {
				// logged in and connected user, someone you know
				setMyLocation();
			} else {
				// no user session available, someone you dont know
			}
		});

	});

	function setMyLocation() {
		FB.api("/me", function (response) {
			if (response && response.location && response.location.id) {
				FB.api("/" + response.location.id, function (locationResponse) {
					map.setCenter(new google.maps.LatLng(locationResponse.location.latitude, locationResponse.location.longitude));
					map.setZoom(4);
					addMarker(new google.maps.LatLng(locationResponse.location.latitude, locationResponse.location.longitude));
				});
			}
		});
	}

	function addFriendsLocation() {
		var query = FB.Data.query("SELECT uid, name, pic_square, current_location FROM user WHERE uid IN (SELECT uid2 FROM friend WHERE uid1 = me())");

		query.wait(function (rows) {
			for (var i = 0; i < rows.length; i++) {
				if (rows[i].current_location != null) {
					if (useExternalGeoCodeService) {
						window.setTimeout("HowGlobalAmI.codeAddress('" + rows[i].current_location.city + "', '" + rows[i].current_location.country + "')", i * 100);
					} else {
						totalRows++;
						window.setTimeout("HowGlobalAmI.geoCodeFacebookLocation('" + rows[i].current_location.id + "')", i * 100);
					}
				}
			}

			$("#totalFriends").text(totalRows);
		});
	}

	function geoCodeFacebookLocation(locationId) {
		FB.api("/" + locationId, function (locationResponse) {
			if (locationResponse.location != null) {
				createMarker(new google.maps.LatLng(locationResponse.location.latitude, locationResponse.location.longitude));
			} else {
				errorCount++;
			}

			recordsProcessed++;
			$("#currentFriendNo").text(recordsProcessed);

			if (recordsProcessed == totalRows) {
				initCluster();
			}
		});
	}

	function codeAddress(city, country) {
		$.getJSON("http://api.geonames.org/searchJSON?formatted=true&q=" + city + "," + country + "&maxRows=10&lang=en&username=demo", function (result) {
			if (result.totalResultsCount > 0) {
				for (var i = 0; i < result.geonames.length; i++) {
					if (result.geonames[i].name == city) {
						createMarker(new google.maps.LatLng(result.geonames[i].lat, result.geonames[i].lng));
						break;
					}
				}
			} else {
				errorCount++;
			}

			recordsProcessed++;
		});

		if (errorCount + markers.length == totalRows) {
			initCluster();
		}
	}

	function initCluster() {
		var markerCluster = new MarkerClusterer(map, markers);
	}

	function createMarker(latLong) {
		var marker = new google.maps.Marker({
			position: latLong
		});

		markers.push(marker);
	}

	function addMarker(latLong) {
		var marker = new google.maps.Marker({
			map: map,
			position: latLong
		});

		markers.push(marker);
	}

	function initializeGoogleMaps() {
		var myOptions = {
			center: new google.maps.LatLng(20, 0),
			zoom: 3,
			mapTypeId: google.maps.MapTypeId.HYBRID,
			mapTypeControl: false
		}

		map = new google.maps.Map(document.getElementById("map"), myOptions);
		geocoder = new google.maps.Geocoder();

		// Monitor the window resize event and let the map know when it occurs
		if (window.attachEvent) {
			window.attachEvent("onresize", function () { google.maps.event.trigger(this.map, "resize"); });
		} else {
			window.addEventListener("resize", function () { google.maps.event.trigger(this.map, "resize"); }, false);
		}
	}

	HowGlobalAmI.codeAddress = codeAddress;
	HowGlobalAmI.geoCodeFacebookLocation = geoCodeFacebookLocation;
	HowGlobalAmI.initCluster = initCluster;
	window.initializeGoogleMaps = initializeGoogleMaps;

})();