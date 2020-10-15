const { getDataFromDynamo, putDataInDynamo, scanDynamoTable } = require('../util/dynamoDB');

module.exports = {
  createRequest: async function(requestId, requestTime) {
    console.log("Storing new request with ID " + requestId + ", requestTime " + requestTime);
    const params = {
        TableName: 'newMusicScanner-scanRequests',
        Item: {
          'requestId': requestId,
          'requestTime': requestTime
        }
    };
    request = await putDataInDynamo(params);
  },
  getRequest: async function(requestId) {
    const params = {
      TableName: 'newMusicScanner-scanRequests',
      FilterExpression: 'requestId = :request_id',
      ExpressionAttributeValues: {':request_id': requestId}
    };
    var request = await scanDynamoTable(params);

    //This response will always only have one result, unless something has gone terribly wrong.
    return request[0];
  },
  getLatestRequest: async function() {
    /*
      This finds the latest request ID by scanning the whole request table and digging through it
      for the biggest timestamp. This is kind of gross, but not a massive problem because this table
      will remain relatively small. I'll replace this with a better solution at some point. ( :) )
    */
    console.log("Getting latest scan request.");
    const params = {
      TableName: 'newMusicScanner-scanRequests',
    };
    const requestData = await scanDynamoTable(params);
    var latestRequest;
    requestData.forEach( (request) => {
      if(latestRequest == null || request.requestTime > latestRequest.requestTime) {
        latestRequest = request;
      }
    });
    return latestRequest;
  },
  getRecentRequests: async function(requestCount) {
    /*
      This gets the N most recent requests. See above comment - there's probably a smarter way to do this.
      (Also obviously - refactor this to get rid of the above function, it can just be n=1).

      IMO probably just switch to S3 or something since this is read-often and write-once-per-day.
    */
    console.log("Getting " + requestCount + " most recent requests.");
    const params = {
      TableName: 'newMusicScanner-scanRequests',
    };
    const requestData = await scanDynamoTable(params);
    const recentRequestsUnordered = requestData;
    const recentRequestsOrdered = recentRequestsUnordered.sort( function(a, b) {
      return b.requestTime - a.requestTime;
    });

    return recentRequestsOrdered.slice(0, requestCount);
  },
  storeScanRequestData: async function(requestId, requestData) {
    /*

    */
    console.log("Storing scan request data for request ID " + requestId);
    const params = {
      TableName: 'newMusicScanner-scanRequestData',
      Item: {
        'requestId': requestId,
        'requestData': requestData
      }
    };
    var request = await putDataInDynamo(params);
  },
  getScanRequestData: async function(requestId) {
    /*

    */
    console.log("Retrieving scan request data for request ID " + requestId);
    const params = {
      TableName: 'newMusicScanner-scanRequestData',
      Key: {
        'requestId': requestId
      }
    };
    var requestData = await getDataFromDynamo(params);
    return requestData.requestData;
  }
}


/*

console.log("Storing new request with ID " + requestId + ", requestTime " + requestTime + ", numberOfArtists " + numberOfArtists);
var putParams = {
  TableName: 'artists-requests',
  Item: {
    'requestId': requestId,
    'requestTime': requestTime,
    'numberOfArtists': numberOfArtists,
    'numberOfFinishedArtists': 0
  }
};
result = await putDataInDynamo(putParams);

console.log("Storing latest request ID " + requestId);
var putParams = {

}
return;
},
*/
