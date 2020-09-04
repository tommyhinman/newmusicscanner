const util = require('util');

let response;

async function artistScan() {
  // 1) Get known albums for this artists
  // 2) Call Spotify to get all albums for artist
  // 3) Compare, find new albums
  // 4) Store new albums for execution ID.
  // 5) (?) Update known albums with newly-found albums
}

/* Sample Input:
{
  "executionId": "exec-12345",
  "artist": { "artistId": "1234", "artistName":"abcd"}
}
*/

exports.artistScanLambdaHandler = async (event, context) => {
  try {
    const requestId = event.requestId;
    const artistId = event.artist.artistId;
    const artistName = event.artist.artistName;

    console.log("Scanning artist " + artistName + " with ID " + artistId);
    console.log("Request ID: " + requestId);

    const newAlbumCount = 5;

    response = {
      "artistId": artistId,
      "artistName": artistName,
      "newAlbumsCount": newAlbumCount

    }
  } catch (err) {
    console.log(err);
    return err;
  }
  return response;
};
