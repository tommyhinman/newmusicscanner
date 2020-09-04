const { getTrackedArtists, putArtist } = require('./storage/artistsDao');
const { putKnownAlbums } = require('./storage/albumsDao');
const { getArtistAlbumData, getArtistsInPlaylist } = require('./util/spotify');
const util = require('util');

async function getTrackedArtistsFromStorage() {
  return await getTrackedArtists();
}

async function updateTrackedArtistsFromPlaylist(playlistId) {
  const artistsInPlaylist = await getArtistsInPlaylist(playlistId);
  console.log("Found " + artistsInPlaylist.length + " artists.");

  for (const artist of artistsInPlaylist) {
    const isNewArtist = await putArtist(artist);

    if(isNewArtist) {
      console.log(artist.artistName + " is a new artist.");

      // This is a new artist, so get & store all their albums so they don't show
      // up as new on the next scan.
      const allAlbums = await getArtistAlbumData(artist.artistId);
      console.log("Found " + allAlbums.length + " total albums for artist " + artist.artistId);
      await putKnownAlbums(artist.artistId, artist.artistName, allAlbums);
    } else {
      console.log(artist.artistName + " is not a new artist.");
    }
  }
}

exports.getTrackedArtistsLambdaHandler = async (event, context) => {
  var response;
  try {
    const artistsList = await getTrackedArtistsFromStorage();
    response = {
      artists: artistsList,
    }
  } catch (err) {
    console.log(err);
    return err;
  }
  return response;
};

exports.updateTrackedArtistsFromPlaylistLambdaHandler = async (event, context) => {
  const playlistId = event.playlistId;

  console.log("Updating tracked artists with playlistId " + playlistId);

  var response;
  try {
    await updateTrackedArtistsFromPlaylist(playlistId);
    response = {
      'statusCode': 200
    }
  } catch (err) {
    console.log(err);
    return err;
  }
  return response;
}
