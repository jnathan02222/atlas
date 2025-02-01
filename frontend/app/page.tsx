'use client'
import { useEffect, useState, useRef, memo, createContext, useContext } from "react"
import axios from "axios"
import { SyncLoader } from 'react-spinners'
//https://coolors.co/cb3342-686963-8aa29e-3d5467-f1edee
//https://coolors.co/8a4f7d-887880-88a096-bbab8b-ef8275

const SongContext = createContext({value : {name : "", author : "", album : "", id : ""}, setValue : (val : {name : string, author :string, album : string, id : string})=>{}})
const PlayerContext = createContext({value: false, setValue : (prev : boolean) => {}})

const SearchBar = ({boxWidth, growDown, light, placeholder, type, onClick, onChange} : { boxWidth : number, growDown : boolean, light : boolean, placeholder : string, type : "playlist" | "track", onClick : (data : {name : string, author : string, album : string, id : string}) => void, onChange : () => void}) => {
  const [query, setQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Array<{name : string, author : string, album : string, id : string}>>([])
  const latestTimestamp = useRef(0)
  
  //Use latest timestamp to ensure latest result is used
  function setCurrentSearchResults(results : Array<{name : string, author : string, album : string, id : string}>, timestamp : number){
    if(timestamp > latestTimestamp.current){
      latestTimestamp.current = timestamp
      setSearchResults(results)
    }
  }
  <input placeholder="Search by keyword or song..." ></input>

  
  async function searchQuery(e : React.FormEvent<HTMLInputElement>){
    setQuery(e.currentTarget.value)
    onChange()

    const timestamp = Date.now()

    if( e.currentTarget.value.trim() == ""){
      setCurrentSearchResults([], timestamp)
      return
    }
    
    var result = await axios({
      method: 'get',
      url : '/api/search',
      params: {
        q: e.currentTarget.value.trim(),
        type: type
      },
    })
    setCurrentSearchResults(
      result.data[`${type}s`].items.filter((item : Record<string, any>) => item).map(
        (item : Record<string, any>) => 
          {
            if(type === "track"){
              return {
                name : item.name, 
                author : item.artists.map((artist : Record<string, any>) => artist.name).join(", "),
                id : item.id,
                album : item.album.name
              }
            }
            return {
              name : item.name, 
              author : item.owner.display_name,
              id : item.id,
              album : ""
            }
          }
        ), timestamp)

  }
  function results(){
    return (searchResults.length > 0 && 
      <div className={` border-2 rounded-md  ${light ? "border-[#887880]" : "bg-white"} ${growDown ? "border-t-0 rounded-t-none" : "border-b-0 rounded-b-none pt-0"}`} style={{width: boxWidth}}>
      {
        searchResults.map(
          (data : {name : string, author : string, album : string, id : string}, i : number) => {
            return (<button onClick={(e)=>{
              e.preventDefault()
              setCurrentSearchResults([], Date.now())
              onClick(data)
              setQuery(`${data.name} - ${data .author}`)

              }} className={`flex text-left w-full p-2  ${growDown ? "" : ""}  ${light ? "text-white hover:bg-gray-900" : "text-black hover:bg-gray-100"}`} key={i}>
              <div className="text-ellipsis truncate text-nowrap min-w-0">{data.name}</div>
              <div className="pl-2 pr-2">-</div>
              <div className="text-ellipsis text-nowrap truncate min-w-36">{data.author}</div>

            </button>)
          }
        )
      }
      </div>
      ) 
  }

  return (
    <div>
      {!growDown && results()}
      <input value={query} onChange={searchQuery} style={{width: boxWidth, height: 48}} placeholder={placeholder} className={` ${light ? "transition bg-transparent duration-300 border-2 p-2 rounded-md text-white border-[#887880] hover:border-white focus:border-white focus:outline-none" : "transition-color duration-300 border-2 p-2 rounded-md text-gray-700 w-96 hover:border-[#887880] focus:border-[#887880] focus:outline-none"}`}></input>
      {growDown && results()}
    </div>
  )

}

function Home({signInHandler} : {signInHandler : ()=> void}){
  return (
    <div className="flex min-h-screen  items-center  w-screen overflow-hidden select-none">
      <div className="flex items-center justify-center w-1/2 min-h-screen ml-[10%]">
        <div className="flex justify-center items-center animate-slow-spin aspect-square w-4/5">
          <img src="Emblem_of_the_United_Nations.svg" draggable="false" className="w-full drop-shadow-[20px_20px_35px_rgba(0,0,0,0.30)]"></img>
        </div>
        <div className="rounded-full bg-[#EF8275] border-4	border-[#EF8275] w-[13%] aspect-square absolute"></div>
        <img src="noun-wood-texture-586023.svg" draggable="false" className="w-[13%]  animate-slow-spin  opacity-[0.05] absolute"></img>

        <div className="rounded-full bg-white border-4	border-[#EF8275] w-[2%] aspect-square absolute"></div>
      </div>
      <div className="flex flex-col items-start absolute ml-[60%]">
        <img src="Full_Logo_black_RGB.svg" draggable="false" className="h-6"></img>
        <h1 className="text-black text-8xl">Atlas</h1>
        <div className="flex">
          <a href="http://localhost:8888/api/login" className="transition-color duration-300 hover:border-[#887880] border-2 p-2 mt-2 rounded-md text-gray-700  cursor-pointer" >Sign In</a>
          <button onClick={signInHandler} className="transition-color duration-300 hover:border-[#887880] border-2 p-2 ml-2 mt-2 rounded-md text-gray-700  cursor-pointer">Guest</button>
        </div>

      </div>
    </div>
  )
}

function Marquee({marqueeWidth, edgeWidth, endPause, selectedSong} : {marqueeWidth : number, edgeWidth : number, endPause : number, selectedSong : {name : string, author : string, album : string, id : string}}){
  const [position, setPosition] = useState(edgeWidth)
  const animationId = useRef<number>(0)
  const sliderRef = useRef<HTMLHeadingElement>(null)
  const [showSide, setShowSide] = useState(true)

  useEffect(()=>{
    if(!sliderRef.current){
      return
    }
    
    setPosition(edgeWidth)
    const width = sliderRef.current.scrollWidth 
    
    if(width <= marqueeWidth-edgeWidth){
      setShowSide(false)
      return
    }

    setShowSide(true)

    const animate = (x : number, direction : number, pause : number) => {
      setPosition(x)
      if(pause > 0){
        pause -= 1
      }
      const leftEdge = marqueeWidth-width-edgeWidth
      if(x < (leftEdge) || x > edgeWidth){
        direction *= -1
        if(x < leftEdge){
          x = leftEdge
        }else{
          x = edgeWidth
        }
        pause = endPause
      }

      animationId.current = window.requestAnimationFrame(()=>{animate(x+(pause === 0 ? direction : 0), direction, pause)})
    }
    animationId.current = window.requestAnimationFrame(()=>{animate(edgeWidth, -1, endPause)})

    return ()=>{cancelAnimationFrame(animationId.current)}
  },[selectedSong])

  return (
    <div className={`flex`} style={{ transform: `translateX(${-edgeWidth*2}px)` }}>
      <div style={{width: edgeWidth, transform: `translateX(${edgeWidth}px)`}} className={` ${showSide ? "bg-gradient-to-l from-transparent via-white to-white" : ""} z-10 `}></div>
      <div className={`text-nowrap overflow-x-hidden h-[62px]`} style={{width: marqueeWidth}}> 
        <h1 ref={sliderRef} className="text-5xl w-min" style={{ transform: `translateX(${position}px)` }}>{selectedSong.name}</h1>
      </div>
      <div style={{width: edgeWidth, transform: `translateX(${-edgeWidth}px)`}} className={`${showSide ? "bg-gradient-to-r from-transparent via-white to-white" : ""}`}></div>
    </div>
  )
}

function Player(){  //<div className="bg-black mr-5 rounded-sm" style={{width: 112, height: 112}}></div>
  const selectedSong = useContext(SongContext).value
  const scriptsLoaded = useRef(false)
  const [deviceId, setDeviceId] = useState("")
  const [coordinates, setCoordinates] = useState({x: 0, y: 0})
  const setPlayer = useContext(PlayerContext).setValue

  const animationRef = useRef(0)
  const actualCoordinates = useRef({x: 0, y: 0})

  useEffect(()=>{
    actualCoordinates.current = {x: 180*Math.random()-90, y: 360*Math.random()-90}
    function roundToDecimalPlaces(num : number, decimals : number) {
      let factor = Math.pow(10, decimals)
      let rounded = Math.round(num * factor) / factor
      return parseFloat(rounded.toFixed(decimals))
    }

    function updateCoordinates(){
      setCoordinates(prev => {
        const newCoordinates = {x:0, y:0}
        if(Math.abs(actualCoordinates.current.x - prev.x) < 0.1){
          newCoordinates.x = actualCoordinates.current.x
        }else{
          newCoordinates.x = prev.x + (actualCoordinates.current.x - prev.x)/10
        }
        if(Math.abs(actualCoordinates.current.y - prev.y) < 0.1){
          newCoordinates.y = actualCoordinates.current.y
        }else{
          newCoordinates.y = prev.y + (actualCoordinates.current.y - prev.y)/10
        }
        newCoordinates.x = roundToDecimalPlaces(newCoordinates.x, 6)
        newCoordinates.y = roundToDecimalPlaces(newCoordinates.y, 6)
        return newCoordinates
      })


      animationRef.current = window.requestAnimationFrame(updateCoordinates)
    }
    animationRef.current = window.requestAnimationFrame(updateCoordinates)

    return ()=>{cancelAnimationFrame(animationRef.current)}
  }, [selectedSong])
  
  function getCookie(name : string) {
    const cookies = document.cookie.split('; ')
    for (const cookie of cookies) {
      const [key, value] = cookie.split('=')
      if (key === name) {
        return decodeURIComponent(value)
      }
    }
    return null // Return null if the cookie isn't found
  }

  useEffect(() => {
    
    if(selectedSong.id !== ""){
      if(deviceId !== ""){
        axios({
          method: 'put',
          url: `/api/play-track`,
          data: {
            track: selectedSong.id,
            device: deviceId
          }
        })
      }
    }
    
  }, [selectedSong, deviceId])

  useEffect(() => {
    if(scriptsLoaded.current){
      return
    }

    const script = document.createElement("script")
    script.src = "https://sdk.scdn.co/spotify-player.js"
    script.async = true
    document.body.appendChild(script)
    scriptsLoaded.current = true

    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
            name: 'Atlas Webplayer',
            getOAuthToken: (cb : any) => { cb(getCookie("spotify_token")) },
            volume: 0.5
        })
        
        player.addListener('ready', ({ device_id } : {device_id : string}) => {
            console.log('Ready with Device ID', device_id)
            player.setVolume(0.5)
            setDeviceId(device_id)
        })

        player.addListener('not_ready', ({ device_id } : {device_id : string}) => {
            console.log('Device ID has gone offline', device_id)
        })

        player.connect()

        setPlayer(player)
      }
  }, [])


  return (
       <div className="flex items-center">
        {selectedSong.id !== "" &&
        <div className="w-full">
            
            <Marquee marqueeWidth={600} edgeWidth={48} endPause={60} selectedSong={selectedSong}></Marquee>
            <h2 className="text-ellipsis truncate text-nowrap" style={{width: 500}}>{`${selectedSong.author} - ${selectedSong.album}`}</h2>
            <h2 className="pt-2 text-gray-500">{`${coordinates.x}, ${coordinates.y}`}</h2>
          </div>
        }
      </div>
   
  )
}

function Vinyl(){
  return (
    <div className="flex items-center justify-center w-[25%]">
      <div className="flex justify-center items-center animate-slow-spin aspect-square w-4/5">
        <img src="Emblem_of_the_United_Nations.svg" draggable="false" className="w-full drop-shadow-[20px_20px_35px_rgba(0,0,0,0.1)]"></img>
      </div>
      <div className="rounded-full bg-[#88a096] border-4	border-[#88a096] w-[8%] aspect-square absolute"></div>
      <img src="noun-wood-texture-586023.svg" draggable="false" className="w-[8%]  animate-slow-spin  opacity-[0.05] absolute"></img>
      <div className="rounded-full bg-white border-4	border-[#88a096] w-[2%] aspect-square absolute"></div>
    
    </div>
  )
}
function Vinyls(){
  const selectedSong = useContext(SongContext).value
  const [songs, setSongs] = useState<Array<{songA: string, songB: string, count: number}>>([])
  
  useEffect(()=>{
    if(selectedSong.id !== ""){
      axios({
        method: 'get',
        url: '/api/neighbours',
        params: {
          track_id: selectedSong.id
        }
      }).then(
        (response : Record<string, any>) => {
          setSongs(prev => {
            return [...prev, response.data.neighbours]
          })
        }
      )
    }
    
  }, [selectedSong])
  return (
    <div className="flex justify-center items-center absolute top-0 left-0 w-screen h-screen -z-10">
      {false && <div>
        <h1 className="text-2xl text-gray-400 text-center">We're in uncharted waters here...</h1>
        <h2 className="text-gray-400 text-center ">Contribute to add this song!</h2>
      </div>}
    </div>
  )
}

function Search(){
  const setSelectedSong = useContext(SongContext).setValue

  return (
    <>
      <SearchBar onChange={()=>{}} boxWidth={400} type="track" growDown={false} light={false} placeholder="Search by track or keyword" onClick={(data)=>{setSelectedSong(data)}}></SearchBar>
    </>
  )
}

function Contribute(){
  const [showSearch, setShowSearch] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)

  const [tracks, setTracks] = useState<Array<{name : string, author : string, album : string, id : string}>>([])
  const [playlistId, setPlaylistId] = useState("")
  const [loading, setLoading] = useState(false)
  const [disable, setDisable] = useState(false)

  async function contributeTracks(){
    setDisable(true)
    await axios({
      method: 'put',
      url: `/api/contribute`,
      data: {
        tracks: tracks.map(track => track.id),
        playlist: playlistId
      }
    })
    setDisable(false)
  }

  return (
    <>
      <div className={`duration-300 transition  ${fadeIn ? "opacity-80" : "opacity-0"}`}>
        {showSearch && 
          <div className="top-0 left-0 absolute w-screen h-screen bg-black flex justify-center items-start pt-48">

              <div className="z-10">
                <SearchBar onChange={()=>{setTracks([])}} boxWidth={560} type="playlist" growDown={true} light={true} placeholder="Search for a playlist" 
                  onClick={
                  async (data) => {
                    setLoading(true)
                    const response = await axios({
                      method: 'get',
                      url : `/api/playlist-tracks?id=${data.id}`
                    })
                    setLoading(false)
                    setTracks(response.data.items.map(
                      (item : Record<string, any>) => {
                        return {name : item.track.name, author : item.track.artists.map((artist : Record<string, any>)=>artist.name).join(", "), album : item.track.album.name, id: item.track.id}
                      }
                    ))
                    setPlaylistId(data.id)
                  }
                  }></SearchBar>
                  {
                    loading && <div className="w-full flex justify-center pt p-4">
                      <SyncLoader color="#887880" loading={true} size={5}></SyncLoader>
                    </div>
                  }
                  {
                  tracks.length > 0 && 
                  <>
                    <div style={{width : 560}} className="overflow-y-auto h-48  bg-transparent mt-2 border-2 p-2 pt-0 rounded-md text-white border-[#887880]">
                      { tracks.map(
                        (track : {name : string, author : string, album : string}, i) => {
                          return (<div className=" mt-2" key={i}>
                            <h1 className="text-white text-nowrap truncate text-ellipsis">{track.name}</h1>
                            <h2 className="text-gray-300 text-xs text-nowrap truncate text-ellipsis">{`${track.author} - ${track.album}`}</h2>
                          </div>)
                        }
                      )}
                    </div>
                    <button onClick={contributeTracks} className="mt-2 transition-color duration-300 border-2 p-2 rounded-md text-white border-[#887880] cursor-pointer hover:border-white">Submit</button>
                    <style>
                      {`
                        /* width */
                        ::-webkit-scrollbar {
                          width: 10px;
                        }

                        /* Track */
                        ::-webkit-scrollbar-track {
                          display: none;
                        }

                        /* Handle */
                        ::-webkit-scrollbar-thumb {
                          background: white;
                          border-radius: 5px;
                        }
                      `}
                    </style>
                  </>
                  }
              </div>
              <div onClick={()=>{
              setFadeIn(false)
              setTimeout(()=>setShowSearch(false), 300)
              setTracks([])
              }} className="top-0 left-0 w-full h-full absolute"></div>
          </div>
        }
      </div>

      <button onClick={()=>{
        setShowSearch(true) 
        setFadeIn(true)
      }} className="transition-color duration-300 border-2 p-2  rounded-md text-gray-700 cursor-pointer hover:border-[#887880]">Contribute</button>
    </>
  )
}

function Map({handleLogout} : {handleLogout : ()=>void}){
  const [selectedSong, setSelectedSong] = useState<{name : string, author : string, album : string, id : string}>({name : "", author : "", album : "", id : ""})    
  
  return (
    <SongContext.Provider value={{value : selectedSong, setValue : setSelectedSong}}>
      <div className="w-screen h-screen flex flex-col justify-between p-16">
        <div className="flex justify-between items-start">
          <Player ></Player>
          <button onClick={handleLogout} className="transition-color duration-300 border-2 p-2 h-12 rounded-md text-gray-700 cursor-pointer hover:border-[#887880]">Log Out</button>

        </div>
        <Vinyls></Vinyls>
        <div className="flex justify-between items-end">
          <div className="flex gap-1 items-end">
            <Search></Search>
          </div>
          <div className="flex gap-1"> 
            <Contribute></Contribute>
            <button className="transition-color duration-300 border-2 p-2 w-12 h-12 rounded-md text-gray-700 cursor-pointer hover:border-[#887880]">?</button>

          </div>
        </div>
      </div>
    </SongContext.Provider>
  )
}

export default function App() {
  const [showMap, setShowMap] = useState(false)
  const [showHome, setShowHome] = useState(true)
  const [fadeIn, setFadeIn] = useState(false)
  const [player, setPlayer] = useState<any>() //Not sure what type this is
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(()=>{
    axios({
      method: 'get',
      url: '/api/login-state'
    }).then(
      response => {
        if(response.data.logged_in){
          signIn()
          setLoggedIn(true)
        }
      }
    )
  }, [])
  
  function signIn(){
    setFadeIn(true)
    setShowMap(true)
    setTimeout(()=>{setShowHome(false)}, 500)
  }
  return (
    <PlayerContext.Provider value={{value: player, setValue: setPlayer}}>
      <div className="overflow-hidden">
        <div className={`duration-500 transition  ${fadeIn ? "-translate-y-[10%] opacity-0" : ""}`}>
          {showHome && <Home signInHandler={signIn
            }></Home>}  
        </div>
        <div className={`overflow-hidden absolute top-0 duration-500 transition  ${fadeIn ? "" : "opacity-0 -translate-y-[10%]"}`}>
          {showMap && <Map handleLogout={()=>{
            setFadeIn(false)
            setShowHome(true)
            //setTimeout(()=>{setShowMap(false)}, 500)
            setShowMap(false) //Instantly, otherwise looks dumb
            player.disconnect()

            document.cookie = `spotify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`

            }}></Map> /**/} 
        </div>
      </div>
    </PlayerContext.Provider>
  )
}
