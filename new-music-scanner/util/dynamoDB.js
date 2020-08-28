var AWS = require('aws-sdk');
AWS.config.update({region: 'us-west-2'});

function getDataFromDynamo(params) {
	return new Promise(resolve => {
		var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
		docClient.get(params, function(err, data) {
			if(err) {
				console.log("Error: ", err)
			} else {
				console.log("Success: ", data.Item)
				resolve(data.Item);
			}
		});
	});
}

function putDataInDynamo(params) {
	return new Promise(resolve => {
		var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
		docClient.put(params, function(err, data) {
			if(err) {
				console.log("Error: ", err)
			} else {
				console.log("Success: ", data)
				resolve(data);
			}
		});
	});
}

function scanDynamoTable(params) {
	return new Promise(resolve => {
		var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
		docClient.scan(params, function(err, data) {
			if(err) {
				console.log("Error when scanning artists table: ", err);
			} else {
				console.log("Successfully scanned artists table: ", data);
				resolve(data);
			}
		});
	})
}

function updateDataInDynamo(params) {
	return new Promise(resolve => {
		var docClient = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'});
		docClient.update(params, function(err, data) {
			if(err) {
				console.log("Error updating request with error: ", err)
			} else {
				console.log("Success updating request with data: ", data)
				resolve(data);
			}
		});
	});
}

module.exports = {
  getDataFromDynamo: getDataFromDynamo,
  putDataInDynamo: putDataInDynamo,
  updateDataInDynamo: updateDataInDynamo,
  scanDynamoTable: scanDynamoTable,
}
