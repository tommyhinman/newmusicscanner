const { putDataInDynamo } = require('../util/dynamoDB');

module.exports = {
  createRequest: async function(requestId, requestTime) {
    console.log("Storing new request with ID " + requestId + ", requestTime " + requestTime);
    var putParams = {
        TableName: 'newMusicScanner-scanRequests',
        Item: {
          'requestId': requestId,
          'requestTime': requestTime
        }
    };
    request = await putDataInDynamo(putParams);
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
