const axios = require('axios');
const querystring = require('querystring');
var util = require('util');
const { getAwsSecret } = require('./secretsManager');

function filterAlbumIds(artistAlbumData) {

    var itemList = artistAlbumData.items;
    var albumList = [];

    try {
        itemList.forEach(function(album) {
            // console.log("Album: " + album.name);
            albumList.push({
                "albumId": album.id,
                "albumName": album.name,
                "albumType": album.album_type,
                "albumUri": album.external_urls.spotify,
                "releaseDate": album.release_date,
                "releaseDatePrecision": album.release_date_precision,
                "albumArtists": album.artists,
            })
        })
    } catch (err) {
        console.log(err);
    }

    return albumList;
}

// Call Spotify API for given URL. Use the getAuthToken api to get a token first.
async function querySpotifyApi(authToken, url) {
  try {
    const response = await axios.get(
        url,
        {
          headers: {
            Accept: 'application/json',
            'Content-Type':'application/x-www-form-urlencoded',
            'Authorization': 'Bearer ' + authToken,
          },
        }
    );
    return response.data;
  } catch (error) {
    const errorMessage = "Error retrieving data from Spotify with url: " + url;
    console.error(errorMessage, error);
  }
}

async function spotifyApiDelete(authToken, url, data) {
  try {
    const response = await axios.delete(
      url,
      {
        headers: {
          'Accept': 'application/json',
          'Content-Type':'application/x-www-form-urlencoded',
          'Authorization': 'Bearer ' + authToken,
        },
        data: data
      }
    );
  } catch (error) {
    const errorMessage = "Error calling DELETE api from Spotify with url: " + url;
    console.error(errorMessage, error);
  }
}

// Retrieve a Spotify auth token, for use in future APIs.
// Reference: https://developer.spotify.com/documentation/general/guides/authorization-guide/
// Borrowed from: https://gist.github.com/donstefani/70ef1069d4eab7f2339359526563aab2
async function getAuthToken() {
    // Get the client ID & secret from AWS secrets manager.
    const spotifyCredentials = await getAwsSecret('spotifyApiCredentials');
    var client_id = spotifyCredentials.spotifyClientId;
    var client_secret = spotifyCredentials.spotifyClientSecret;

    try {

      const params = {
        grant_type: "client_credentials"
      };
      const headers = {
        headers: {
          Accept: 'application/json',
          'Content-Type':'application/x-www-form-urlencoded',
        },
        auth: {
          username: client_id,
          password: client_secret
        }
      }
      const response = await axios.post(
        'https://accounts.spotify.com/api/token',
        querystring.stringify(params),
        headers
      );
      return response.data.access_token;
    } catch (error) {
      console.log(error);
    }
}

// Calls Spotify's API to get all album data for an artist ID.
// Spotify limits to 50 albums per result, so pass in an offset to get more.
async function queryArtistAlbumData(authToken, artistId, offset) {
  const spotifyUrl = 'https://api.spotify.com/v1/artists/' + artistId + '/albums?limit=50&market=US&offset=' + offset;
  return await querySpotifyApi(authToken, spotifyUrl);
}

// Calls Spotify's API get to get all playlist data for a playlist ID.
// Spotify limits to 50 tracks per result, so pass in an offset to get more.
async function queryPlaylistTracks(authToken, playlistId, offset) {
  const spotifyUrl = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks?limit=50&market=US&offset=' + offset;
  return await querySpotifyApi(authToken, spotifyUrl);
}

// Calls Spotify's API to get Artist info for a given Artist ID.
async function queryArtist(authToken, artistId) {
  const spotifyUrl = 'https://api.spotify.com/v1/artists/' + artistId;
  return await querySpotifyApi(authToken, spotifyUrl);
}

// Calls Spotify's API to get Album info for a given Album ID.
async function queryAlbum(authToken, albumId) {
  const spotifyUrl = 'https://api.spotify.com/v1/albums/' + albumId;
  return await querySpotifyApi(authToken, spotifyUrl);
}

async function removePlaylistTracks(authToken, playlistId, tracks) {
  const spotifyUrl = 'https://api.spotify.com/v1/playlists/' + playlistId + '/tracks';

}


module.exports = {
    // Retrieve albums for an artist ID. Handles batching and filtering data to useful fields.
    getArtistAlbumData: async function(artistId) {
        var authToken = await getAuthToken();

        var artistAlbums = [];

        console.log("Getting first 50 artist albums from Spotify for artist ID ", artistId)
        var firstArtistAlbumData = await queryArtistAlbumData(authToken, artistId, 0);
        for(var artistAlbum of filterAlbumIds(firstArtistAlbumData)) {
            artistAlbums.push(artistAlbum);
        }

        if(firstArtistAlbumData.total > 50) {
            for(var currentOffset = 50; currentOffset < firstArtistAlbumData.total; currentOffset += 50) {
                console.log("Getting next 50 albums for artistId " + artistId + " with offset " + currentOffset);
                var artistAlbumData = await queryArtistAlbumData(authToken, artistId, currentOffset);
                for(var artistAlbum of filterAlbumIds(artistAlbumData)) {
                    artistAlbums.push(artistAlbum);
                }
            }
        }
        return artistAlbums;
    },
    // Retrieve a list of all artists in a given Spotify Playlist ID. Handles filtering duplicates.
    getArtistsInPlaylist: async function(playlistId) {
        console.log("Getting artists from Spotify playlist");
        var authToken = await getAuthToken();

        var artists = [];
        var uniqueArtistIds = new Set();

        console.log("Querying first 50 for playlistId ", playlistId);
        var firstPlaylistData = await queryPlaylistTracks(authToken, playlistId, 0);
        for(var playlistItem of firstPlaylistData.items) {
            for(var curItemArtist of playlistItem.track.artists) {
              if(!uniqueArtistIds.has(curItemArtist.id)) {
                var artist = {
                    artistId: curItemArtist.id,
                    artistName: curItemArtist.name
                };
                artists.push(artist);
                uniqueArtistIds.add(curItemArtist.id);
              }
            }
        }
        if(firstPlaylistData.total > 50) {
            for(var currentOffset = 50; currentOffset < firstPlaylistData.total; currentOffset += 50) {
                var playlistData = await queryPlaylistTracks(authToken, playlistId, currentOffset);
                for(var playlistItem of playlistData.items) {
                    for(var curItemArtist of playlistItem.track.artists) {
                      if(!uniqueArtistIds.has(curItemArtist.id)) {
                        var artist = {
                            artistId: curItemArtist.id,
                            artistName: curItemArtist.name
                        };
                        artists.push(artist);
                        uniqueArtistIds.add(curItemArtist.id);
                      }
                    }
                }
            }
        }

        return artists;
    },
    // Retrieve data for a given Spotify artist ID.
    getArtist: async function(artistId) {
      console.log("Get artist from Spotify with ID: " + artistId);
      var authToken = await getAuthToken();

        return await queryArtist(authToken, artistId);
    },
    // Retrieve data for a given Spotify album ID.
    getAlbum: async function(albumId) {
      console.log("Get album from Spotify with ID: " + albumId);
      var authToken = await getAuthToken();

      return await queryAlbum(authToken, albumId);
    }
}
