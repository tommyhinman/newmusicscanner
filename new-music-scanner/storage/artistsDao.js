const { scanDynamoTable } = require('../util/dynamoDB');

module.exports = {
	getTrackedArtists: async function() {
		var params = {
			TableName: 'newMusicScanner-trackedArtists',
		};

		var artistsData = await scanDynamoTable(params);

		return artistsData.Items;
	}
}
