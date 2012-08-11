(function(collections, model, $, _, Backbone, undefined) {
	
	collections.FriendsCollection = Backbone.Collection.extend({

		model: model

	});

})(HowGlobalAmI.Collections, HowGlobalAmI.Models.Friend, jQuery, _, Backbone);