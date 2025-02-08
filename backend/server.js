const express = require('express')
const cookieParser = require("cookie-parser");
const app = express()
app.use(cookieParser());
app.use(express.json());
require('dotenv').config();

const { Mutex } = require('async-mutex');
const mutex = new Mutex();

const axios = require('axios')
const pgp = require('pg-promise')()
const db = pgp({
  host: process.env.DB_HOST,        
  port: 5432,               
  database: 'music_db',         
  user: 'postgres',           
  password: process.env.DB_PASSWORD,   
})

const OpenAI = require('openai')
const openai = new OpenAI()

var redirect_uri = process.env.SPOTIFY_REDIRECT_URI //Also change
var client_id = '0626b416c6164a5599c9c2c4af16d0b7'
var client_secret = process.env.SPOTIFY_CLIENT_SECRET 
var spotify_token = ""

/**
 * API Backend
 */

//Gets a fresh token then calls a callback function
async function refreshToken(){
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
  const release = await mutex.acquire();
  spotify_token = response.data.access_token
  release();
}
refreshToken() //RUN TO GET TOKEN

async function readGlobalSpotifyToken() {
  const release = await mutex.acquire(); // Lock
  try {
    return spotify_token;
  } finally {
    release(); // Unlock (preserves return value)
  }
}

async function spotifySearch(token, req){
  return axios({
    method: 'get',
    url : 'https://api.spotify.com/v1/search/',
    headers: {
      'Authorization': 'Bearer ' + token,
    },
    params: {
      q: req.query.q,
      type: req.query.type,
      limit: 8
    }
  })
}

async function getSpotifyPlaylist(token, req){
  return axios({
    method: 'get',
    url : `https://api.spotify.com/v1/playlists/${req.query.id}/tracks`,
    headers: {
      'Authorization': 'Bearer ' + token,
    }
  })
}

async function getSpotifyTracks(token, ids){
  return axios({
    method: 'get',
    url : `https://api.spotify.com/v1/tracks`,
    headers: {
      'Authorization': 'Bearer ' + token,
    },
    params: {
      ids: ids.join(",")
    }
  })
}



function generateRandomString(n) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < n; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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

// /api/search/playlist
app.get('/api/search', async (req, res) => {
  try {
    const response = await spotifySearch(req.cookies['spotify_token'], req) 
    res.json(response.data)
  }catch (error) {
    if(error.status === 401){
      for(var i = 0; i < 3; i++){ //Attempt 3 times
        try {
          //Use general token
          const response = await spotifySearch(await readGlobalSpotifyToken(), req)
          res.json(response.data)
          break
        } catch (error) {
          if(error.status !== 401){
            break
          }
          await refreshToken()
        }
      }
    }
  }
})

// /api/playlist-stop
app.get('/api/playlist-tracks', async (req, res) => {
  try{
    const response = await getSpotifyPlaylist(req.cookies['spotify_token'], req)
    res.json(response.data)
  }catch(error){
    for(var i = 0; i < 3; i++){ //Attempt 3 times
      try {
        //Use general token
        const response = await getSpotifyPlaylist(await readGlobalSpotifyToken(), req)
        res.json(response.data)
        break
      } catch (error) {
        if(error.status !== 401){
          break
        }
        await refreshToken()
      }
    }
  }
})  

// /api/contribute 
app.put('/api/contribute', async (req, res) => {

  //Get vector embedding if necessary
  /*const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: `Playlist title: ${req.body.playlist.name}`,
    encoding_format: "float",
    dimensions: 512
  })*/
  //console.log(response.data)
  //Error handling

  await Promise.all(
    getCombinations(req.body.tracks).map(
      async combo => {
        //POTENTIAL FOR SPEEDUP / LESS STORAGE
        //BEWARE OF CONCURRENCY ISSUES
        try{
          //Check if the playlist is being tracked. Fails if the correlation already exists for this playlist
          await db.none(`INSERT INTO names VALUES('${combo[0]}','${combo[1]}','${req.body.playlist.id}')`)
          //Upsert correlation count
          await db.none(`
            INSERT INTO correlations VALUES('${combo[0]}','${combo[1]}',1)
            ON CONFLICT (songA, songB) DO
            UPDATE SET count = correlations.count + 1
            `)
        }catch(error){
          //oublie moi
          //error promise somehow
        }
      }
    )
  )
  res.json({success : true})
})

// /api/neighbours
app.get('/api/neighbours', (req, res) => {
  const track_id = req.query.track_id
  db.any(`SELECT * FROM correlations WHERE songA = '${track_id}' OR songB = '${track_id}'`).then(
    async (data)=>{
      //Select all playlists that contain the song 
      //Get vectors for each playlist
      //K cluster
      const neighbours = data.sort((a, b) => a.count - b.count).slice(0, 5)
      const ids = [...neighbours.map((neighbour) => neighbour.songa !== track_id ? neighbour.songa : neighbour.songb), track_id]

      try{
        const response = await getSpotifyTracks(req.cookies['spotify_token'], ids)
        res.json({neighbours : neighbours, tracks : response.data.tracks})
      }catch(error){
        console.log(error)
        for(var i = 0; i < 3; i++){ //Attempt 3 times
          try {
            //Use general token
            const response = await getSpotifyTracks(await readGlobalSpotifyToken(), ids)
            res.json({neighbours : neighbours, tracks : response.data.tracks})
            break
          } catch (error) {
            console.log(error)
            if(error.status !== 401){
              break
            }
            await refreshToken()
          }
        }
      }

    }
  ).catch(
    error => {
      
    }
  )
})

// /api/login-state
app.get('/api/login-state', (req, res) => {
  axios({
    method: 'get',
    url : `https://api.spotify.com/v1/me`,
    headers: {
      'Authorization': 'Bearer ' + req.cookies['spotify_token'],
    }
  }).then(
    (response) => {
      res.json({logged_in : true})
    }
  ).catch(
    (error)=>{
      res.json({logged_in : false})
    }
  )
})

// /api/play-track
app.put('/api/play-track', (req, res) => {
  axios({
    method: 'put',
    url: `https://api.spotify.com/v1/me/player/play?device_id=${req.body.device}`,
    headers: {
      'Authorization': 'Bearer ' + req.cookies['spotify_token'],
    },
    data: {
      uris: ["spotify:track:"+req.body.track]
    }
  }).then(
    response => {
      res.send("Playback started")
    }
  ).catch(
    error => {
      console.log(error)
      //bruh
    }
  )
})

app.get('/api/callback', (req, res) => {
  var code = req.query.code || null;
  var state = req.query.state || null;

  if (state === null) {
    //lol
  } else {
    axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': 'Basic ' + (new Buffer.from(client_id + ':' + client_secret).toString('base64')),
      },
      data: new URLSearchParams({
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code',
      }).toString(),
    }).then(
      (response) => {
        res.cookie('spotify_token', response.data.access_token);
        res.redirect("http://localhost:3000/")
      }
    ).catch(
      (error)=> {
        //oopsy
      }
    )
  }
})

app.get('/api/login', (req, res) => {
  var state = generateRandomString(16);
  var scope = 'user-read-private user-read-email streaming';

  res.redirect('https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
})
app.listen(8888, ()=>{
  console.log("Listening on 8888")
})