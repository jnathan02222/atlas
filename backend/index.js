//Switch to Go eventually

const express = require('express')
const axios = require('axios')
const querystring = require('querystring')
require('dotenv').config();

const app = express()

var client_id = '0626b416c6164a5599c9c2c4af16d0b7'
var client_secret = process.env.SPOTIFY_CLIENT_SECRET 
var redirect_uri = "http://localhost:8888/api/callback" //Also change


function searchForPlaylist(token, search){
  axios({
    method: 'get',
    url : 'https://api.spotify.com/v1/search/',
    headers: {
      'Authorization': 'Bearer ' + token,
    },
    params : {
      q: search,
      type: 'playlist'
    }
  }).then(
    response => {
      if (response.status === 200) {
        console.log(response.data)
      }
    }
  )
}
function markPlaylist(){
  
}

const authOptions = {
  method: 'post',
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
  },
  data: new URLSearchParams({
    grant_type: 'client_credentials',
  }).toString(),
}

axios(authOptions).then(response => {
  if (response.status === 200) {
    searchForPlaylist(response.data.access_token, "sad")
  }
})








//API backend
function generateRandomString(n) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < n; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

app.get('/api/login', (req, res) => {
  var state = generateRandomString(16);
  var scope = 'user-read-private user-read-email';

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
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