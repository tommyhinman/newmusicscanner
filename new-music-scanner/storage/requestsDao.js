const { putDataInDynamo, scanDynamoTable } = require('../util/dynamoDB');

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
    requestData.Items.forEach( (request) => {
      if(latestRequest == null || request.requestTime > latestRequest.requestTime) {
        latestRequest = request;
      }
    });
    return latestRequest;
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
