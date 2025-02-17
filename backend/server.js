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
  //ssl: { rejectUnauthorized: false }
})

const { manyKMeansWithSilhouette } = require('clustering')
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

// /api/search/
app.get('/api/search', async (req, res) => {
  try {
    const response = await spotifySearch(req.cookies['spotify_token'], req) 
    if(req.query.type === "playlist"){
      response.data.playlists.items = response.data.playlists.items.filter(playlist => playlist && playlist.public)
    }
    res.json(response.data)
  }catch (error) {
    //console.log(error)
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

// /api/playlist-tracks
app.get('/api/playlist-tracks', async (req, res) => {
  try{
    const response = await getSpotifyPlaylist(req.cookies['spotify_token'], req)
    res.json(response.data)
  }catch(error){
    console.log(error)
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
  const playlists = await db.any(`SELECT * FROM embeddings WHERE playlist = '${req.body.playlist.id}'`)

  if(playlists.length === 0){
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: `Playlist title: ${req.body.playlist.name}`,
      encoding_format: "float",
      dimensions: 512
    })
    await db.none(`INSERT INTO embeddings VALUES ('${req.body.playlist.id}', '[${response.data[0].embedding.toString()}]')`)
  }

  //POTENTIAL FOR SPEEDUP / LESS STORAGE
  //BEWARE OF CONCURRENCY ISSUES

  //Mark each song and playlist as recorded
  const untracked = new Set()
  await Promise.all(
    req.body.tracks.map(async track => {
        try {
          await db.none(`INSERT INTO names VALUES('${track}','${req.body.playlist.id}')`)
          untracked.add(track)
        } catch (error) {
          //If it already exists it will error without marking the track as untracked
        }
      }
    )
  )

  //Only update correlation if at least one of the tracks is untracked
  await Promise.all(
    getCombinations(req.body.tracks).filter(combo => untracked.has(combo[0]) || untracked.has(combo[1])).map(
      async combo => {
        //Upsert correlation count
        await db.none(`
          INSERT INTO correlations VALUES('${combo[0]}','${combo[1]}',1)
          ON CONFLICT (songA, songB) DO
          UPDATE SET count = correlations.count + 1
          `)
      }
    )
  )
  res.json({success : true})
})

// /api/neighbours
app.get('/api/neighbours', async (req, res) => {
  const track_id = req.query.track_id
  //console.log(track_id)

  const data = await db.any(`SELECT * FROM correlations WHERE songA = '${track_id}' OR songB = '${track_id}'`)
  //console.log(data)
  //Select all playlists that contain the song 
  //Get vectors for each playlist
  //K cluster
  //console.log(data.sort((a, b) => a.count - b.count).reverse())
  const neighbours = data.sort((a, b) => a.count - b.count).reverse().slice(0, 5)
  const ids = [...neighbours.map((neighbour) => neighbour.songa !== track_id ? neighbour.songa : neighbour.songb), track_id]

  for(var i = 0; i < 3; i++){ //Attempt 3 times
    try {
      //Use general token
      const response = await axios({
        method: 'get',
        url : `https://api.spotify.com/v1/tracks`,
        headers: {
          'Authorization': 'Bearer ' + await readGlobalSpotifyToken(),
        },
        params: {
          ids: ids.join(",")
        }
      })
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
})

app.get('/api/region-name', async (req, res) => {
  const playlists = []
  await Promise.all(
    req.query.tracks.map(async track => {
      const data = await db.any(`SELECT playlist FROM names WHERE song = '${track}'`)
      playlists.push(...data.map(item => item.playlist))
    })
  )
  const vectors = []
  await Promise.all(
    playlists.map(async playlist => {
      const vectorItem = await db.one(`SELECT embedding FROM embeddings WHERE playlist = '${playlist}'`)
      const vectorString = vectorItem.embedding
      vectors.push(vectorString.slice(1, -1).split(',').map(Number))
    })
  )
  //K means 
  const {centroids, clusters} = manyKMeansWithSilhouette(vectors, 1, Math.min(3, vectors.length))
  
  //Get playlist name for centroid of largest cluster
  var maxClusterSize = 0
  var maxClusterIndex = 0
  clusters.forEach((cluster, i) => {
    if(cluster.length > maxClusterSize){
      maxClusterIndex = i
      maxClusterSize = cluster.length
    } 
  })
  
  const data = await db.one(`SELECT * FROM embeddings ORDER BY embedding <=> '[${centroids[maxClusterIndex].toString()}]' LIMIT 1`)
  const bestPlaylist = data.playlist
  const vector = data.embedding.slice(1, -1).split(',').map(Number).slice(0, 2)

  const response = await axios({
    method: 'get',
    url: `https://api.spotify.com/v1/playlists/${bestPlaylist}`,
    headers: {
      'Authorization': 'Bearer ' + await readGlobalSpotifyToken(),
    }
  })
  res.json({name : response.data.name, vector : vector})
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

app.get('/api/current-playing-track', (req, res) => {
  axios({
    method: 'get',
    url: `https://api.spotify.com/v1/me/player/currently-playing`,
    headers: {
      'Authorization': 'Bearer ' + req.cookies['spotify_token'],
    }
  }).then(
    response => {
      res.send(response.data)
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
        res.redirect(process.env.WEBSITE_URL)
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
  var scope = 'user-read-private user-read-email streaming playlist-read-private user-top-read user-read-currently-playing';

  res.redirect('https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
})


// app.get('/api/user-playlists', async (req, res) => {
//   var result = []
//   var offset = 0

//   while(true){
//     const response = await axios({
//       method: 'get',
//       url : 'https://api.spotify.com/v1/me/playlists',
//       headers: {
//         'Authorization': 'Bearer ' + req.cookies['spotify_token'],
//       },
//       params: {
//         offset: offset, 
//         limit: 50
//       }
//     })
//     result = result.concat(response.data.items)
//     if(!response.data.next){
//       break
//     }
    
//     offset += 50
//   }
//   res.json({playlists: result})
// })

app.get('/api/user-top-tracks', async (req, res) => {
  var response = await axios({
    method: 'get',
    url : 'https://api.spotify.com/v1/me/top/tracks',
    headers: {
      'Authorization': 'Bearer ' + req.cookies['spotify_token'],
    },
    params: {
      offset: 0, 
      limit: 50,
      time_range: 'long_term'

    }
  })
  let result = response.data.items
  res.json({tracks : result})
})

app.listen(8888, ()=>{
  console.log("Listening on 8888")
})