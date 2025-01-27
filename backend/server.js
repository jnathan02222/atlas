const express = require('express')
const cookieParser = require("cookie-parser");
const app = express()
app.use(cookieParser());

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
app.get('/api/search/playlist', (req, res) => {
  console.log(req.query.q)
  console.log(req.cookies['spotify_token'])
  axios({
    method: 'get',
    url : 'https://api.spotify.com/v1/search/',
    headers: {
      'Authorization': 'Bearer ' + req.cookies['spotify_token'],
    },
    params: {
      q: req.query.q,
      type: 'playlist',
      limit: 10
    }
  }).then(
    response => {
      console.log(response.data)
      res.json(response.data)
    }
  ).catch(
    error => {
      //Bruh
    }
  )

})
// /api/search/track 
// /api/contribute 
// /api/neighbours
// /api/player/play 

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
  var scope = 'user-read-private user-read-email';

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