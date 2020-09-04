const { getDataFromDynamo, putDataInDynamo } = require('../util/dynamoDB');

module.exports = {
  getKnownAlbums: async function(artistId) {
    console.log("Requesting known albums for artist Id " + artistId);
    var params = {
      TableName: 'newMusicScanner-knownAlbums',
      Key: {
        'artistId' : artistId
      }
    };

    const knownAlbumData = await getDataFromDynamo(params);
    if (knownAlbumData != null) {
      return knownAlbumData.albums;
    } else {
      return [];
    }
  },
  putKnownAlbums: async function(artistId, artistName, albums) {
    console.log("Storing known albums for artistId " + artistId);
    var params = {
      TableName: 'newMusicScanner-knownAlbums',
      Item: {
        'artistId': artistId,
        'artistName': artistName,
        'albums': albums
      }
    };
    const result = await putDataInDynamo(params);
    console.log("Finished storing known albums.");
  },
  storeFoundAlbums: async function(requestId, artistId, artistName, albums) {
    if(albums.length > 0) {
      console.log("Storing " + albums.length + " newly-found albums, with requestId " + requestId + " artistId " + artistId + " artistName " + artistName);
      const params = {
        TableName: 'newMusicScanner-foundAlbums',
        Item: {
          'requestId': requestId,
          'artistId': artistId,
          'artistName': artistName,
          'albums': albums
        }
      };
      const result = await putDataInDynamo(params);
    }
    console.log("Finished storing newly-found albums.");
  }

}
