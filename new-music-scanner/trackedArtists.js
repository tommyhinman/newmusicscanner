const artistsDao = require('./storage/artistsDao')
const util = require('util');
let response;

async function getTrackedArtists() {
  return await artistsDao.getTrackedArtists();
}

exports.getTrackedArtistsLambdaHandler = async (event, context) => {
  try {
    const artistsList = await getTrackedArtists();
    response = {
      artists: artistsList,
    }
  } catch (err) {
    console.log(err);
    return err;
  }
  return response;
};
