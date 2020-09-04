const util = require('util');
const { v4: uuidv4}  = require('uuid');
const { createRequest } = require('./storage/requestsDao');

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
