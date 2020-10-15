const util = require('util');
const { v4: uuidv4}  = require('uuid');
const { createRequest, getLatestRequest, getRecentRequests, getRequest, storeScanRequestData, getScanRequestData } = require('./storage/requestsDao');
const { getFoundAlbumsForRequest } = require('./storage/albumsDao');
const moment = require('moment-timezone');
const { flattenRequestFoundAlbums, filterRequestFoundAlbums, prioritizeRequestFoundAlbums, sortRequestFoundAlbums } = require('requestProcessor/requestProcessor')

let response;

async function newScanRequest() {
  const requestId = uuidv4();
  const requestTime = Date.now();
  await createRequest(requestId, requestTime);

  return requestId;
}

function createJsonRequestResults(request, requestData) {

  const resultsObj = {
    'request': request,
    'albums': requestData
  }

  return JSON.stringify(resultsObj);
}

function createHumanReadableRequestResults(request, requestData) {

  const highPriorityAlbums = requestData.highPriorityAlbums;
  const dateString = moment(request.requestTime).tz('America/Los_Angeles').format("LLL");

  var response = "Latest scan request: " + dateString + " with ID " + request.requestId + "\n";
  response += "Found " + highPriorityAlbums.length + " high priority albums.\n\n";

  highPriorityAlbums.forEach( (album) => {
    var albumArtistNames = [];
    album.albumArtists.forEach( (albumArtist) => { albumArtistNames.push(albumArtist.name); } );
    response += "- " + albumArtistNames.join(" & ") + " - " + album.albumName;
    response += " - " + album.albumUri;
    response += "\n";
  })

  return response;
}

async function processScanRequest(requestId) {
  // 0) Get request information
  const request = await getRequest(requestId);

  // 1) Get all artist->albums for request // ID
  const foundAlbumsByArtist = await getFoundAlbumsForRequest(requestId);
  // console.log(JSON.stringify(foundAlbums));

  // 2) Deduplicate and flatten foundAlbum structure
  const flattenedAlbums = await flattenRequestFoundAlbums(foundAlbumsByArtist);

  // 3) Filter out unwanted albums.
  const filteredAlbums = await filterRequestFoundAlbums(flattenedAlbums);

  // 4) Sort albums.
  const sortedAlbums = await sortRequestFoundAlbums(filteredAlbums);

  // 5) Prioritize and sort albums.
  const prioritizedAlbums = await prioritizeRequestFoundAlbums(sortedAlbums, request);

  // 6) Store in processed request table
  await storeScanRequestData(requestId, prioritizedAlbums);
  // console.log(JSON.stringify(prioritizedAlbums));
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


// TODO: This function needs to get deleted at some point, or if I want to continue using
// it, it should get moved into a separate function and probably separate file.
exports.getLatestRequestLambdaHandler = async (event, context) => {

  const formatAsJson = event.queryStringParameters && event.queryStringParameters.format &&
    event.queryStringParameters.format.toLowerCase() == "json";

  const latestRequest = await getLatestRequest();
  console.log("Latest request: " + latestRequest.requestId);

  const requestData = await getScanRequestData(latestRequest.requestId);

  var response;
  if(formatAsJson) {
    response = createJsonRequestResults(latestRequest, requestData);
  } else {
    response = createHumanReadableRequestResults(latestRequest, requestData);
  }

  return {
      'statusCode': 200,
      'headers': {
        "Access-Control-Allow-Headers" : "Content-Type",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
      },
      'body': response,

  }
}

exports.getRequestLambdaHandler = async (event, context) => {
  const formatAsJson = event.queryStringParameters && event.queryStringParameters.format &&
    event.queryStringParameters.format.toLowerCase() == "json";

  var requestId;
  if (event.queryStringParameters && event.queryStringParameters.requestId) {
    requestId = event.queryStringParameters.requestId;
  } else if (event.requestId) {
    requestId = event.requestId;
  } else {
    console.log("No request ID!");
    throw "No request ID set!";
  }

  const request = await getRequest(requestId);
  const requestData = await getScanRequestData(requestId);

  var response;
  if(formatAsJson) {
    response = createJsonRequestResults(request, requestData);
  } else {
    response = createHumanReadableRequestResults(request, requestData);
  }

  return {
    'statusCode': 200,
    'headers': {
      "Access-Control-Allow-Headers" : "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
    },
    'body': response
  };
}

exports.processScanRequestLambdaHandler = async (event, context) => {
  try {
      const requestId = event.requestId;
      await processScanRequest(requestId);
  } catch (error) {
    console.log(error);
    return error;
  }
}

exports.getRecentRequestsLambdaHandler = async (event, context)  => {

  var recentRequests = await getRecentRequests(10);

  return {
    'statusCode': 200,
    'headers': {
      "Access-Control-Allow-Headers" : "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
    },
    'body': JSON.stringify(recentRequests),
  };
}
