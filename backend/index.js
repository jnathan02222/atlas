//Switch to Go eventually

const express = require('express')
const axios = require('axios')
const app = express()
const port = 3000

var client_id = '0626b416c6164a5599c9c2c4af16d0b7';
var client_secret = '569fe22a11754975b18b10eb1bd52aef';

function searchForPlaylist(keyword){
  
}
function markPlaylist(){

}

const authOptions = {
  method: 'post',
  url: 'https://accounts.spotify.com/api/token',
  headers: {
    'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64'),
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  data: new URLSearchParams({
    grant_type: 'client_credentials',
  }).toString(),
}

axios(authOptions).then(response => {
  if (response.status === 200) {
    console.log(response.data)
  }
})



app.get('/', (req, res) => {
  res.send("Hello World!")
})
app.listen(3000, ()=>{
  console.log("Listening on 3000")
})

