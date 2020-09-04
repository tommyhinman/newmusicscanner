const util = require('util');
const { getKnownAlbums, storeFoundAlbums, putKnownAlbums } = require('./storage/albumsDao.js');
const { getArtistAlbumData } = require('./util/spotify.js');

let response;

async function artistScan(requestId, artistId, artistName) {
  // 1) Get known albums for this artists
  const knownAlbums = await getKnownAlbums(artistId);
  const knownAlbumIds = [];
  console.log("Known albums: ");
  knownAlbums.forEach(album => {
    knownAlbumIds.push(album.albumId);
    // console.log("Album ID: " + album.albumId + " Album Name: " + album.albumName);
  });
  console.log("Known album IDs: " + knownAlbumIds);


  // 2) Call Spotify to get all albums for artist
  const allAlbums = await getArtistAlbumData(artistId);
  console.log("Found " + allAlbums.length + " total albums.")

  // 3) Compare, find new albums
  var newAlbums = [];
  allAlbums.forEach(album => {
    if (!knownAlbumIds.includes(album.albumId)) {
      newAlbums.push(album);
    }
  });

  // 3.5) Log new albums
  console.log("Found " + newAlbums.length + " new albums: ");
  newAlbums.forEach(album => {
    console.log("Album ID: " + album.albumId + " Album Name: " + album.albumName);
  })

  if (newAlbums.length > 0) {
    // 4) Store newly-found albums for execution ID.
    await storeFoundAlbums(requestId, artistId, artistName, newAlbums);

    // 5) (?) Update known albums with newly-found albums
    await putKnownAlbums(artistId, artistName, allAlbums);
  }

  return newAlbums.length;
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

    const newAlbumCount = await artistScan(requestId, artistId, artistName);

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
