const { putDataInDynamo, scanDynamoTable } = require('../util/dynamoDB');

module.exports = {
	getTrackedArtists: async function() {
		var params = {
			TableName: 'newMusicScanner-trackedArtists',
		};

		var artistsData = await scanDynamoTable(params);

		return artistsData.Items;
	},
	// Add artist to tracked artists. Returns true if artist did not already exist.
	putArtist: async function(artist) {
		const params = {
			TableName: 'newMusicScanner-trackedArtists',
			Item: {
				artistId: artist.artistId,
				artistName: artist.artistName
			},
			ReturnValues: "ALL_OLD"
		};

		const result = await putDataInDynamo(params);

		return result.Attributes == null;
	}

}
