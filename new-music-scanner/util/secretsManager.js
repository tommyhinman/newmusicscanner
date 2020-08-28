const AWS = require('aws-sdk');

const secretsManager = new AWS.SecretsManager({
  region: 'us-west-2'
});

function getAwsSecretSync(secretName) {
  return secretsManager.getSecretValue({ SecretId: secretName }).promise();
}

const getAwsSecret = async (secretName) => {
  var error;
  const response = await getAwsSecretSync(secretName).catch(err => (error = err));

  if (response && response.SecretString) {
    return JSON.parse(response.SecretString);
  } else {
    return error;
  }
}

exports.getAwsSecret = getAwsSecret;
