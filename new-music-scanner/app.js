// const axios = require('axios')
// const url = 'http://checkip.amazonaws.com/';
const spotify = require('./spotify')
const util = require('util');
let response;

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 *
 */
exports.lambdaHandler = async (event, context) => {
    try {
        const artistId = event.queryStringParameters.artistId;
        const playlistId = event.queryStringParameters.playlistId;
        const allAlbums = await spotify.getArtistAlbumData(artistId);
        const artistInfo = await spotify.getArtist(artistId);
        // const allArtists = await spotify.getArtistsInPlaylist(playlistId);

        const msg = JSON.stringify(allAlbums) + JSON.stringify(artistInfo);

        response = {
            'statusCode': 200,
            'body': JSON.stringify({
                message: msg,
            })
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response;
};
