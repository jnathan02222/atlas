const express = require('express')
const cookieParser = require("cookie-parser");
const app = express()
app.use(cookieParser());
app.use(express.json());

const axios = require('axios')
const pgp = require('pg-promise')()
const db = pgp({
  host: 'localhost',        
  port: 5432,               
  database: 'music_db',         
  user: 'postgres',           
  password: 'admin',   
})
require('dotenv').config();


var redirect_uri = "http://localhost:8888/api/callback" //Also change
var client_id = '0626b416c6164a5599c9c2c4af16d0b7'
var client_secret = process.env.SPOTIFY_CLIENT_SECRET 

/**
 * API Backend
 */

function generateRandomString(n) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < n; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// /api/search/playlist
app.get('/api/search', (req, res) => {
  
  axios({
    method: 'get',
    url : 'https://api.spotify.com/v1/search/',
    headers: {
      'Authorization': 'Bearer ' + req.cookies['spotify_token'],
    },
    params: {
      q: req.query.q,
      type: req.query.type,
      limit: 8
    }
  }).then(
    response => {
      res.json(response.data)
    }
  ).catch(
    error => {
      //Bruh
    }
  )
})

// /api/playlist-stop
app.get('/api/playlist-tracks', (req, res) => {
  axios({
    method: 'get',
    url : `https://api.spotify.com/v1/playlists/${req.query.id}/tracks`,
    headers: {
      'Authorization': 'Bearer ' + req.cookies['spotify_token'],
    }
  }).then(
    (response) => {
      res.json(response.data)
    }
  ).catch(
    (error)=>{
      //a problem for later
    }
  )

})  

// /api/contribute 
app.put('/api/contribute', (req, res) => {

})

// /api/neighbours
app.get('/api/neighbours', (req, res) => {

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
      //Bruh
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