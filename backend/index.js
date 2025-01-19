//Switch to Go eventually

const axios = require('axios')
require('dotenv').config();

/**
 * Database generation
 */

var client_id = '0626b416c6164a5599c9c2c4af16d0b7'
var client_secret = process.env.SPOTIFY_CLIENT_SECRET 

//Handles an error returned from the Spotify API
//callback should be the original function call that must be retried
//refreshTokenCallback should be the callback reformated to use an updated token
function handleSpotifyError(error, callback, refreshTokenCallback){
  if(error.response && error.response.status === 401){
    //Reauthenticate and then call the callback
    console.log("Reauthenticating.")
    refreshToken(refreshTokenCallback)
  }else if(error.response && error.response.status === 429){
    //Wait and then try again
    console.log("Rate limit.")
    const retryAfter = response.headers['retry-after'];
    setTimeout(() => {
      // Retry the request after the specified time
      callback()
    }, retryAfter * 1000);
  }else{
    //Try again
    console.log("Unexpected failure.")
    callback()
  }
}

async function searchForPlaylist(token, search){
  try{
    const response = await axios({
      method: 'get',
      url : 'https://api.spotify.com/v1/search/',
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      params : {
        q: search,
        type: 'playlist'
      }
    })
      
    //Mark playlists in database (async, requires it's own error handling)
    response.data.playlists.items.forEach(
      async element => {
        //Fetch tracks
        if(element) {
          markPlaylist(token, element)
        }
      }
    )
    //Determine next search term
  }catch (error){
    handleSpotifyError(error, ()=>{searchForPlaylist(token, search)}, (token)=>{searchForPlaylist(token, search)})
  }
}
async function markPlaylist(token, element){
  //First check if playlist is tracked


  //Then update counter and summary
  try{
    const response = await axios({
      method: 'get',
      url : element.tracks.href,
      headers: {
        'Authorization': 'Bearer ' + token,
      }
    })
    const name = element.name
    const tracks = response.data.items.filter(item=>item.track!==null).map(item=>item.track.id)
    console.log(tracks)
    
  }catch(error){
    handleSpotifyError(error, ()=>{markPlaylist(token, element)}, (token)=>{markPlaylist(token, element)})
  }
}

//Gets a fresh token then calls a callback function
async function refreshToken(callback){
  try {
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
      },
      data: new URLSearchParams({
        grant_type: 'client_credentials',
      }).toString(),
    })
    callback(response.data.access_token)
  } catch (error) {
    //Try until it works
    console.log("Failed to authenticate.")
    refreshToken(callback)
  }
}

refreshToken(token => searchForPlaylist(token, "sad"))



