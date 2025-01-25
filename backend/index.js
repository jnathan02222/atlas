//Switch to Go eventually
const pgp = require('pg-promise')()
const db = pgp({
  host: 'localhost',        
  port: 5432,               
  database: 'music_db',         
  user: 'postgres',           
  password: 'admin',   
})

const axios = require('axios')
require('dotenv').config();

/**
 * Database generation
 */

var client_id = '0626b416c6164a5599c9c2c4af16d0b7'
var client_secret = process.env.SPOTIFY_CLIENT_SECRET 

//Handles an error returned from the Spotify API
//callback should be the original function call that must be retried
//refreshTokenCallback should take a token and run the callback with the updated token
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

function getCombinations(list) {
  const result = []
  for(var i = 0; i < list.length; i++){
    for(var j = i+1; j < list.length; j++){
      result.push([list[i], list[j]].sort())
    }
  }
  return result
}

async function markPlaylist(token, element){
  //First check if playlist is tracked
  try{
    //WARNING - Potential race condition here!
    const data = await db.any(`SELECT * FROM playlists WHERE playlistID = '${element.id}'`)
    if(data.length > 0){
      return 
    }
    db.none(`INSERT INTO playlists VALUES('${element.id}')`)
  }catch(error){
    console.log('ERROR:', error)
    return
  }


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
    console.log(name)
    const tracks = response.data.items.filter(item=>item.track!==null).map(item=>item.track.id)
    //Get all n choose 2 combinations
    for(const combo of getCombinations(tracks)){
      //Make call to database to update embedding and tick up counter for songs 
      db.none(`INSERT INTO names VALUES('${combo[0]}','${combo[1]}','${name}')`)
      db.none(`
        INSERT INTO correlations VALUES('${combo[0]}','${combo[1]}',1)
        ON CONFLICT (songA, songB) DO
        UPDATE SET count = correlations.count + 1
        `)
    }
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

refreshToken(token => searchForPlaylist(token, "indie movie"))



