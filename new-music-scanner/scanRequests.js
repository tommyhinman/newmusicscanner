const util = require('util');
const { v4: uuidv4}  = require('uuid');
const { createRequest, getLatestRequest } = require('./storage/requestsDao');
const { getFoundAlbumsForRequest } = require('./storage/albumsDao');
const moment = require('moment');

let response;

async function newScanRequest() {
  const requestId = uuidv4();
  const requestTime = Date.now();
  await createRequest(requestId, requestTime);

  return requestId;
}

// Generate a new request ID and store the current request, then return ID
exports.newScanRequestLambdaHandler = async (event, context) => {
  try {
    const requestId = await newScanRequest();

    response = {
      "requestId": requestId
    };
  } catch (error) {
    console.log(error);
    return error;
  }

  return response;
}

exports.getLatestRequestLambdaHandler = async (event, context) => {
  const latestRequest = await getLatestRequest();
  console.log("Latest request: " + latestRequest.requestId);

  const foundAlbums = await getFoundAlbumsForRequest(latestRequest.requestId);


  const totalArtistCount = foundAlbums.Items.length;
  var totalAlbumCount = 0;
  foundAlbums.Items.forEach( (artist) => {
    totalAlbumCount += artist.albums.length;
  })

  // For now, just respond with a human-readable string.
  const dateString = moment(latestRequest.requestTime).utcOffset(-8).format("LLL");
  var response = "Latest scan request: " + dateString + " with ID " + latestRequest.requestId + "\n";
  response += "Found " + totalArtistCount + " artists and " + totalAlbumCount + " albums.";
  foundAlbums.Items.forEach( (artist) => {
    response += artist.artistName + ":\n";

    artist.albums.forEach( (album) => {
      response += "\t- " + album.albumName + " - " + album.albumUri + "\n";
    });

    response += "\n";
  })

  return {
      'statusCode': 200,
      'body': response,

  }
}
