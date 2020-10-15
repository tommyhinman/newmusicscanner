function isAlbumVariousArtists(album) {
  for(var artist of album.albumArtists) {
    if(artist.name == "Various Artists") {
      return true;
    }
  }
  return false;
}

/*
 * This is really rough for now. Simply check if the album is released in the last week.
 * Some notes:
 * - Sometimes the releaseDatePrecision is "year" instead of "day". i.e. released in 2020. Not sure
 *   how frequent this is, but it happens. What should I do with these?
 * - Sometimes an artist puts up an old album and I might actually care. Usually I won't.
 *   not exactly sure there's a way to distinguish these programatically :)
*/
function isAlbumNewRelease(album, request) {
  const requestDateTime = request.requestTime;
	if(album.releaseDatePrecision == "day") {
		var releaseDateTime = new Date(album.releaseDate);
		var timeDifference = requestDateTime - releaseDateTime.getTime();
		var totalDays = Math.ceil(timeDifference / (1000 * 3600 * 24));

		if(totalDays <= 7) {
			return true;
		}
	}
	return false;
}

function shouldFilterAlbum(album) {
  return isAlbumVariousArtists(album);
}

function isAlbumHighPriority(album, request) {
  return isAlbumNewRelease(album, request);
}

module.exports = {

  /*
    Takes in a list of artistId->albums.
    Returns a flattened list of albums, deduplicated by ID with tracked artists preserved.
  */
  flattenRequestFoundAlbums: async function(artistsToAlbums) {

    // For each artist, we want to go through their albums and add to a flattened list.
    // Albums can be duplicated if we found it for more than one tracked artist, so squash those
    // and maintain a "primary artists" list for each album.
    var processedAlbumIds = [];
    var processedAlbumsByAlbumId = {};
    artistsToAlbums.forEach( (artist) => {
      artist.albums.forEach( (album) => {
          if (processedAlbumIds.includes(album.albumId)) {

            // We've already processed this album under a different tracked artist. Add artist ID and skip.
            const previouslyProcessedAlbum = processedAlbumsByAlbumId[album.albumId];
            const artistInfo = {
              "name": artist.artistName,
              "id": artist.artistId
            };
            previouslyProcessedAlbum.primaryArtists.push(artistInfo);
          } else {
            const artistInfo = {
              "name": artist.artistName,
              "id": artist.artistId
            };
            album.primaryArtists = [artistInfo];
            processedAlbumsByAlbumId[album.albumId] = album;
            processedAlbumIds.push(album.albumId);
          }
      })
    })

    // Flatten album dictionary into a list.
    var flattenedAlbums = [];
    for( var processedAlbumId in processedAlbumsByAlbumId) {
      flattenedAlbums.push(processedAlbumsByAlbumId[processedAlbumId]);
    }
    console.log("Flattened albums!");
    // console.log(flattenedAlbums);

    return flattenedAlbums;
  },

  // Takes in a list of albums, and filters out ones we don't want, based on a set of rules.
  filterRequestFoundAlbums: async function(unfilteredAlbums) {
    var filteredAlbums = [];

    unfilteredAlbums.forEach( (album) => {
      if (!shouldFilterAlbum(album)) {
        filteredAlbums.push(album);
      }
    });

    console.log("Filtered albums!");
    // console.log(filteredAlbums);

    return filteredAlbums;
  },

  //TODO sort function!

  /*
    Takes in a list of albums,
    Returns a structure with high and low priority album lists, each sorted and ready for human consumption.
  */
  prioritizeRequestFoundAlbums: async function(albums, request) {
    var prioritizedAlbums = {
      lowPriorityAlbums: [],
      highPriorityAlbums: [],
    };

    albums.forEach( (album) =>  {
      if (isAlbumHighPriority(album, request)) {
        prioritizedAlbums.highPriorityAlbums.push(album);
      } else {
        prioritizedAlbums.lowPriorityAlbums.push(album);
      }
    });

    console.log("Prioritized albums!");
    // console.log(JSON.stringify(prioritizedAlbums));
    return prioritizedAlbums;
  }
}
