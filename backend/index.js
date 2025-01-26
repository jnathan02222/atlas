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
var client_id = '0626b416c6164a5599c9c2c4af16d0b7'
var client_secret = process.env.SPOTIFY_CLIENT_SECRET 

/**
 * Database generation
 */


//Handles an error returned from the Spotify API
//callback should be the original function call that must be retried
//refreshTokenCallback should take a token and run the callback with the updated token
async function handleSpotifyError(error, callback, refreshTokenCallback){
  if(error.response && error.response.status === 401){
    //Reauthenticate and then call the callback
    console.log("Reauthenticating.")
    await refreshToken(refreshTokenCallback)
  }else if(error.response && error.response.status === 429){
    //Wait and then try again
    console.log("Rate limit.")
    const retryAfter = response.headers['retry-after'];
    // Retry the request after the specified time
    await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
    await callback()
  }else{
    //Try again
    console.log("Unexpected failure.")
    await callback()
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
    await Promise.all(
      response.data.playlists.items.map(
        async element => {
          //Fetch tracks
          if(element) {
            await markPlaylist(token, element)
          }
        }
      )
    )
    //Determine next search term
    console.log("DONE")
  }catch (error){
    await handleSpotifyError(error, ()=>{searchForPlaylist(token, search)}, (token)=>{searchForPlaylist(token, search)})
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
    await Promise.all(
      getCombinations(tracks).map(
        async combo => {
          //POTENTIAL FOR SPEEDUP 
          //BEWARE OF CONCURRENCY ISSUES
  
          //If the correlation is being tracked
          const data = await db.any(`SELECT * FROM correlations WHERE songA = '${combo[0]}' AND songB = '${combo[1]}'`)
          console.log(combo)
          if(data.length > 0){
            try{
              //Check if the playlist is being tracked. Fails if the correlation already exists for this playlist
              await db.none(`INSERT INTO names VALUES('${combo[0]}','${combo[1]}','${element.id}')`)
              //Iterate correlation count
              await db.none(`
                UPDATE correlations 
                SET count = correlations.count + 1 
                WHERE songA = '${combo[0]}' AND songB = '${combo[1]}'
                `)
            }catch(error){
    
            }
          }
        }
      )
    )

  }catch(error){
    await handleSpotifyError(error, ()=>{markPlaylist(token, element)}, (token)=>{markPlaylist(token, element)})
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
    await callback(response.data.access_token)
  } catch (error) {
    //Try until it works
    console.log("Failed to authenticate.")
    await refreshToken(callback)
  }
}

refreshToken(token => searchForPlaylist(token, "indie movie"))



