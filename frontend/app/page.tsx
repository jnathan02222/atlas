'use client'
import { useEffect, useState, useRef, createContext, useContext } from "react"
import axios from "axios"
import { SyncLoader } from 'react-spinners'
import { Stage, Layer, Image, Line, Text, Group, Star, Circle } from 'react-konva'
import useImage from 'use-image'
import Slider from '@mui/material/Slider'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'

//https://coolors.co/cb3342-686963-8aa29e-3d5467-f1edee
//https://coolors.co/8a4f7d-887880-88a096-bbab8b-ef8275

const SongContext = createContext({value : {name : "", author : "", album : "", id : "", play : false}, setValue : (val : Song | ((song: Song) => Song))=>{}})
const PlayerContext = createContext({value: null, setValue : (prev : any) => {}, maxWidth : 0, setMaxWidth : (prev : number) => {}})

type Song = {name : string, author : string, album : string, id : string, play : boolean}

//Math util
function getCombinations(list : Array<any>) {
  const result = []
  for(var i = 0; i < list.length; i++){
    for(var j = i+1; j < list.length; j++){
      result.push([list[i], list[j]].sort())
    }
  }
  return result
}

function average(...numbers : number[]) {
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}

function getDistanceAndAngle(x1 : number, y1 : number, x2 : number, y2 : number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx); // Angle in radians

  return { distance: distance, angle: angle };
}

function getXYDifference(distance : number, angle : number) {
  const dx = distance * Math.cos(angle);
  const dy = distance * Math.sin(angle);

  return { dx: dx, dy: dy };
}

function shortenVector(v : {x : number, y : number}, scale : number) {
  v.x = v.x * scale 
  v.y = v.y * scale
}

const SearchBar = ({boxWidth, growDown, light, placeholder, type, onClick, onChange, defaultSearch, disable} : { boxWidth : number, growDown : boolean, light : boolean, placeholder : string, type : "playlist" | "track", onClick : (data : Song) => void, onChange : () => void, defaultSearch : string, disable : boolean}) => {
  const [query, setQuery] = useState(defaultSearch)
  const [searchResults, setSearchResults] = useState<Array<Song>>([])
  const latestTimestamp = useRef(0)
  

  useEffect(()=>{
    function handleClick(e : MouseEvent){
      setSearchResults([])
      
    }
    window.addEventListener('click', handleClick)
    return ()=>{window.removeEventListener('click', handleClick)}
  },[])

  //Use latest timestamp to ensure latest result is used
  function setCurrentSearchResults(results : Array<Song>, timestamp : number){
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
                album : item.album.name,
                play : true
              }
            }
            return {
              name : item.name, 
              author : item.owner.display_name,
              id : item.id,
              album : "",
              play : false

            }
          }
        ), timestamp)

  }
  function results(){
    return (searchResults.length > 0 && 
      <div className={` border-2 rounded-md  ${light ? "border-[#887880]" : "bg-white"} ${growDown ? "border-t-0 rounded-t-none" : "border-b-0 rounded-b-none pt-0"}`} style={{width: boxWidth}}>
      {
        searchResults.map(
          (data : Song, i : number) => {
            return (<button onClick={(e)=>{
              e.preventDefault()
              setCurrentSearchResults([], Date.now())
              onClick(data)
              setQuery(`${data.name} - ${data.author}`)

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
    <div className="z-10">
      {!growDown && results()}
      <input disabled={disable} value={query} onChange={searchQuery} style={{width: boxWidth, height: 48}} placeholder={placeholder} className={` ${light ? `transition bg-black duration-300 border-2 p-2 rounded-md  border-[#887880]  focus:outline-none ${disable ? "text-[#887880] cursor-not-allowed" : "hover:border-white focus:border-white text-white"}` : "transition-colors duration-300 border-2 p-2 rounded-md text-gray-700 w-96 hover:border-[#887880] focus:border-[#887880] focus:outline-none"}`}></input>
      {growDown && results()}
    </div>
  )

}

function Home({signInHandler} : {signInHandler : ()=> void}){

  return (
    <div className="flex min-h-screen  items-center  w-screen overflow-hidden select-none">
      <div className="flex items-center justify-center w-1/2 min-h-screen ml-[10%] ">
        <div className="flex justify-center items-center  aspect-square w-4/5 drop-shadow-[20px_20px_35px_rgba(0,0,0,0.30)]">
          <img src="/Emblem_of_the_United_Nations.svg" draggable="false" className="w-full animate-slow-spin "></img>
        </div>
        <div className="rounded-full bg-[#EF8275] border-4	border-[#EF8275] w-[13%] aspect-square absolute"></div>
        <img src="/noun-wood-texture-586023.svg" draggable="false" className="w-[13%]  animate-slow-spin  opacity-[0.05] absolute"></img>

        <div className="rounded-full bg-white border-4	border-[#EF8275] w-[2%] aspect-square absolute"></div>
      </div>
      <div className="flex flex-col items-start absolute ml-[60%]">
        <img src="/Full_Logo_Black_RGB.svg" draggable="false" className="h-6"></img>
        <h1 className="text-black text-8xl">Atlas</h1>
        <div className="flex">
          <a href={`/api/login`} className="transition-colors duration-300 hover:border-[#887880] border-2 p-2 mt-2 rounded-md text-gray-700  cursor-pointer" >Sign In</a>
          <button onClick={signInHandler} className="transition-colors duration-300 hover:border-[#887880] border-2 p-2 ml-2 mt-2 rounded-md text-gray-700  cursor-pointer">Guest</button>
        </div>

      </div>
    </div>
  )
}

function Marquee({marqueeWidth, edgeWidth, height, endPause, selectedSong, children, darkMode} : {marqueeWidth : number, height: number, edgeWidth : number, endPause : number, selectedSong : Song, children : React.ReactNode, darkMode : boolean }){
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
  }, [selectedSong])

  return (
    <div className={`flex`} style={{ transform: `translateX(${-edgeWidth*2}px)` }}>
      <div style={{width: edgeWidth, transform: `translateX(${edgeWidth}px)`}} className={` ${showSide ? `transition-all duration-300 bg-gradient-to-l from-transparent ${darkMode ? "via-black to-black" : "via-white to-white"}` : ""} z-10 `}></div>
      <div className={`text-nowrap overflow-x-hidden`} style={{width: marqueeWidth, height: height}}> 
        <div ref={sliderRef} className="w-fit" style={{ transform: `translateX(${position}px)` }}>{children}</div>
      </div>
      <div style={{width: edgeWidth, transform: `translateX(${-edgeWidth}px)`}} className={`${showSide ? `transition-all duration-300 bg-gradient-to-r from-transparent ${darkMode ? "via-black to-black" : "via-white to-white"}` : ""}`}></div>
    </div>
  )
}

function Player({darkMode} : {darkMode : boolean}){  //<div className="bg-black mr-5 rounded-sm" style={{width: 112, height: 112}}></div>
  const selectedSong = useContext(SongContext).value
  const setSelectedSong = useContext(SongContext).setValue

  const scriptsLoaded = useRef(false)
  const [deviceId, setDeviceId] = useState("")
  const [coordinates, setCoordinates] = useState({x: 0, y: 0})
  const setPlayer = useContext(PlayerContext).setValue
  const setMaxWidth = useContext(PlayerContext).setMaxWidth

  const animationRef = useRef(0)
  const actualCoordinates = useRef({x: 0, y: 0})
  const nameRef = useRef<HTMLHeadingElement>(null)
  const authorRef = useRef<HTMLHeadingElement>(null)

  useEffect(()=>{
    if(selectedSong.id !== "" && nameRef.current && authorRef.current){
      setMaxWidth(Math.min(Math.max(nameRef.current.clientWidth, authorRef.current.clientWidth), 600))
    }

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
    if(selectedSong.id !== "" && selectedSong.play){
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
            setPlayer(player)
            player.setVolume(0.5)
            setDeviceId(device_id)
        })

        player.addListener('not_ready', ({ device_id } : {device_id : string}) => {
            console.log('Device ID has gone offline', device_id)
        })

        player.addListener('player_state_changed', ((info : Record<string, any>) => {
          if(!info || info.paused){
            return 
          }
          //The player may not return the correct id of the track, use the Web API instead
          axios({
            method: 'get',
            url: '/api/current-playing-track'
          }).then((response : Record<string, any>) => {
            const current_track = response.data.item
            setSelectedSong(
              (prev : Song) => {
                if(!prev || !current_track || prev.id === current_track.id){
                  return prev
                }
                return {name : current_track.name, author : current_track.artists.map((artist : Record<string, any>)=>artist.name).join(", "), album : current_track.album.name, id : current_track.id, play : false}
              }
            )
          })

        }))

        player.connect()

      }
  }, [])


  return (
       <div className="flex items-center">
        {selectedSong.id !== "" &&
        <div className="w-full">
            
            <Marquee darkMode={darkMode} marqueeWidth={600} height={62} edgeWidth={48} endPause={120} selectedSong={selectedSong}>
              <h1 ref={nameRef} className={`text-5xl w-min ${darkMode ? "text-white" : ""}`} >{selectedSong.name}</h1>
            </Marquee>
            <Marquee darkMode={darkMode} marqueeWidth={600} height={25} edgeWidth={48} endPause={120} selectedSong={selectedSong}>
              <h2 className={`${darkMode ? "text-white" : ""}`} ref={authorRef}>{`${selectedSong.author} - ${selectedSong.album}`}</h2>
            </Marquee>

            <h2 className={`pt-2 ${darkMode ? "text-gray-300" : "text-gray-500"}`}>{`${coordinates.x}, ${coordinates.y}`}</h2>
          </div>
        }
      </div>
   
  )
}

type Disk = {x: number, y: number, image: number, velocity : {x : number, y : number}, acceleration : {x : number, y : number}, song : Song, opacity : number, size : number, movementDamp : number} 
//type Label = {name : string, opacity : number}
type Correlation = {songa: string, songb: string, count: number}

function Vinyls({constellationMode, loggedIn, userId} : {constellationMode : boolean, loggedIn : boolean, userId : string | null}){
  const DISC_SIZE = 100
  const LABEL_WIDTH = 500
  const LABEL_HEIGHT = 48
  //const LABEL_OFFSET_X = 400 
  //const LABEL_OFFSET_Y = 200
  const ZOOM_MAX = 1.5
  const ZOOM_MIN = 0.3
  
  const selectedSong = useContext(SongContext).value
  const setSelectedSong = useContext(SongContext).setValue
  const maxWidth = useContext(PlayerContext).maxWidth

  const [discs, setDiscs] = useState<Record<string, Disk>>({})
  const correlations = useRef<Record<string, number>>({})
  const mappedSongs = useRef<Set<string>>(new Set())
  const focusedDisks = useRef<Set<string>>(new Set())
  const fadedDisks = useRef<Set<string>>(new Set())

  const [stageDimensions, setStageDimensions] = useState({w: window.innerWidth, h : window.innerHeight})
  const animationRef = useRef(0)
  const [rotation, setRotation] = useState(0)
  const [camera, setCamera] = useState({x : 0, y : 0})
  const [zoom, setZoom] = useState(1)
  const cameraTarget = useRef({x : 0, y : 0})
  const zoomTarget = useRef(1)

  const imagePaths = ['/vinyl1.svg', '/vinyl2.svg', '/vinyl3.svg', '/vinyl4.svg', '/vinyl5.svg'];
  const images = imagePaths.map(path => {
    const [image] = useImage(path)
    return image
  })
  const [starImage] = useImage('/star.svg')
  
  const cameraLocked = useRef(false)
  const mouseDown = useRef(false)
  const mouseStart = useRef({x:0, y:0})
  const cameraStart = useRef({x:0, y:0})
  

  const [gettingConstellation, setGettingConstellation] = useState(false)

  async function getConstellation(regenerate : boolean){
    if(!userId || gettingConstellation){
      return
    }
    setGettingConstellation(true)

    //Get top tracks
    var response: Record<string, any> = (await axios({
      method: 'get',
      url: '/api/constellation',
      params: {
        user: userId
      }
    }))
    if(regenerate || (loggedIn && response.data.name.length === 0)){
      await axios({method: 'post', url: '/api/constellation'})
      response = (await axios({
        method: 'get',
        url: '/api/constellation',
        params: {
          user: userId
        }
      }))
    }

    // //Add disks
    const updatedDiscs : Record<string, Disk> = {}

    var angle = 0
    const radius = DISC_SIZE*25/(2*Math.PI)

    response.data.tracks.forEach((track : Record<string, any>, index : number)=> {
      updatedDiscs[track.id] = {
        x : Math.cos(angle)*radius, 
        y : Math.sin(angle)*radius, 
        image : Math.floor(Math.random()*images.length), 
        velocity : {x : 0, y : 0}, 
        acceleration : {x : 0, y : 0}, 
        opacity : 0,
        song : {name : track.name, author : track.artists.map((artist : Record<string, any>) => artist.name).join(', '), album : track.album.name, id : track.id, play : true},
        size : 0.35 - response.data.rankings[track.id]/100, 
        movementDamp : 0.5
      }
      angle += (2*Math.PI)/25
    })
    
    correlations.current = {}
    const newCorrellations = (await axios({method: 'get', url: '/api/correlations', params: {track_ids: Object.keys(response.data.rankings)}})).data.correlations
    newCorrellations.forEach((correlation : Correlation) => {
      correlations.current[`${correlation.songa}:${correlation.songb}`] = correlation.count
    })
    
    const labels : Record<string, Array<string>> = {}
    mappedSongs.current = new Set()
    response.data.tracks.map((track : Record<string, any>) => {
      //Get all neighbours that have not been mapped
      const neighbours = newCorrellations.filter((c : Correlation) => (track.id === c.songa || track.id === c.songb) && !mappedSongs.current.has(c.songa) && !mappedSongs.current.has(c.songb))      
      if(neighbours.length > 0){
        const trackIds = [track.id, ...neighbours.map((c : Correlation) => track.id !== c.songa ? c.songa : c.songb)]
        const labelTag = `_${track.id}`
        updatedDiscs[labelTag] = {
          ...updatedDiscs[track.id],
        }
        trackIds.forEach(id => {
          correlations.current[`${track.id}:${labelTag}`] = 1
        })
        labels[labelTag] = trackIds
        
        neighbours.forEach((c : Correlation) => {
          mappedSongs.current.add(c.songa)
          mappedSongs.current.add(c.songb)
        })
      }
    })

    await Promise.all(Object.entries(labels).map(async ([labelTag, trackIds]) => {
      const response : Record<string, any> = await axios({
        method: 'get',
        url: '/api/region-name',
        params: {
          tracks: trackIds
        }
      })
      updatedDiscs[labelTag].song = {name : response.data.name, album : "", author : "", id : "", play : false} 
      updatedDiscs[labelTag].x = average(...trackIds.map(id => updatedDiscs[id].x))
      updatedDiscs[labelTag].y = average(...trackIds.map(id => updatedDiscs[id].y))
      updatedDiscs[labelTag].size = 0.5
      updatedDiscs[labelTag].movementDamp = 0
    }))
    //Constellation name
    // updatedDiscs["_"] = {
    //   x : -radius*1.2, 
    //   y : -radius*1.2, 
    //   image : Math.floor(Math.random()*images.length), 
    //   velocity : {x : 0, y : 0}, 
    //   acceleration : {x : 0, y : 0}, 
    //   opacity : 0,
    //   song : {name : `${response.data.name[0].name}`, album : "", author : "", id : "", play : false},
    //   size : 1, 
    //   movementDamp : 0
    // }
    setDiscs(updatedDiscs)
    zoomTarget.current = ZOOM_MIN+0.2
    cameraTarget.current = {x: 0, y: 0}
    
    setGettingConstellation(false)


  }
  useEffect(()=>{
    setDiscs({})
    correlations.current = {}
    mappedSongs.current = new Set()
    if(constellationMode) getConstellation(false)
  },[constellationMode])


  function handleMouseDown(e :  React.MouseEvent<HTMLDivElement, MouseEvent>){
    mouseStart.current = {x : e.clientX, y : e.clientY}
    mouseDown.current = true
    cameraLocked.current = false 
    cameraStart.current = camera
  }
  function handleMouseMove(e : MouseEvent){
    if(!mouseDown.current){
      return 
    }
    const start = renderedToCoordinate(mouseStart.current) 
    const end = renderedToCoordinate({x : e.clientX, y : e.clientY})
    
    const newCamera = {x: cameraStart.current.x + start.x - end.x, y: cameraStart.current.y + start.y - end.y}
    setCamera(newCamera)
    cameraTarget.current = newCamera
  }
  function handleMouseUp(){
    mouseDown.current = false
  }
  function renderedToCoordinate(point : {x : number, y : number}){
    return {
      x: (point.x - stageDimensions.w/2)/zoom,
      y: (point.y - stageDimensions.h/2)/zoom 
    }
  }

  useEffect(()=>{
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)

    return ()=>{
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)

    }
  },[zoom])

  async function updateMap(selectedSong : Song){
    const response : Record<string, any> = await axios({
      method: 'get',
      url: '/api/neighbours',
      params: {
        track_id: selectedSong.id,
        radius: 1
      }
    })
  
    const neighbours : Array<Correlation> = response.data.neighbours 
    const tracks : Record<string, Song> = {}
    response.data.tracks.forEach((track : Record<string, any>)=>{
      tracks[track.id] = {name : track.name, author : track.artists.map((artist : Record<string, any>) => artist.name).join(', '), album : track.album.name, id : track.id, play : true}
    })

    const trackIds = response.data.tracks.map((track : Record<string, any>) => track.id)
    //Add labels if some of the tracks are unlabeled
    //console.log(mappedSongs.current)
    const unlabeledTracks = trackIds.reduce((acc : number, track : string) => acc + (mappedSongs.current.has(track) ? 0 : 1), 0)
    var label : string = ""
    if(neighbours.length > 0 && unlabeledTracks > 4){

      const response : Record<string, any> = await axios({
        method: 'get',
        url: '/api/region-name',
        params: {
          tracks: trackIds
        }
      })
      label = response.data.name
    }
    setDiscs(prev => {
      var updatedDisks = {...prev}
      //Check if there is a link between currently displayed songs and new songs
      
      var connected = false
      for(const neighbour of neighbours){
        if(prev[neighbour.songa] || prev[neighbour.songb]){
          connected = true 
          break
        }
      }

      //If not clear data structures
      if(!connected){
        correlations.current = {}
        updatedDisks = {}
        mappedSongs.current = new Set()
      }

      

      if(!updatedDisks[selectedSong.id] && neighbours.length > 0){
        updatedDisks[selectedSong.id] = {
          x : 0, 
          y : 0, 
          image : Math.floor(Math.random()*images.length), 
          velocity : {x : 0, y : 0}, 
          acceleration : {x : 0, y : 0}, 
          opacity : 0,
          song : tracks[selectedSong.id],
          size : 1,
          movementDamp : 1
        }
      }
      if(updatedDisks[selectedSong.id]){
        //updatedDisks[selectedSong.id].movementDamp = 0.5
      }
      
      function getRandomDisk(spread : number, song : Song){
        const spreadX = (Math.random()-0.5)*2 * spread //Radius of spread
        const spreadY = Math.sqrt(spread*spread-spreadX*spreadX)
        return {
          x : updatedDisks[selectedSong.id].x + spreadX, 
          y : updatedDisks[selectedSong.id].y + (Math.random() > 0.5 ? spreadY : -spreadY), 
          image : Math.floor(Math.random()*images.length),
          velocity : {x : 0, y : 0}, 
          acceleration : {x : 0, y : 0}, 
          opacity : 0,
          song : song,
          size : 1,
          movementDamp : 1
        }
      }

      if(label !== ""){
        const labelTag = `_${selectedSong.id}`
        updatedDisks[labelTag] = getRandomDisk(500, {name : label, album : "", author : "", id : "", play : false})
        correlations.current[`${selectedSong.id}:${labelTag}`] = 1
        trackIds.forEach((track : string) => mappedSongs.current.add(track))

      }
      

      for(const neighbour of neighbours){
        if(!updatedDisks[neighbour.songa]){
          updatedDisks[neighbour.songa] = getRandomDisk(150, tracks[neighbour.songa])
        }
        if(!updatedDisks[neighbour.songb]){
          updatedDisks[neighbour.songb] = getRandomDisk(150, tracks[neighbour.songb])
        }
        if(!correlations.current[`${neighbour.songa}:${neighbour.songb}`]){
          correlations.current[`${neighbour.songa}:${neighbour.songb}`] = neighbour.count
        }
      }
      return updatedDisks
    })
  }

  useEffect(()=>{
    focusedDisks.current = new Set()
    focusedDisks.current.add(selectedSong.id)

    if(selectedSong.id !== "" && !constellationMode){
      updateMap(selectedSong)
    }
  }, [selectedSong, constellationMode])

  useEffect(() => {
    // Update stage size when the window is resized
    const handleResize = () => {
      setStageDimensions({w: window.innerWidth, h : window.innerHeight});
    };

    window.addEventListener('resize', handleResize);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  

  useEffect(()=>{
    for (const [id, disc] of Object.entries(discs)) {
      const isLabel = id.includes("_")
      const x = isLabel ? disc.x - LABEL_WIDTH/2: disc.x 
      const y = isLabel ? disc.y - LABEL_HEIGHT/2: disc.y 
      if(selectedSong.id !== "" && getRenderedX(x) < maxWidth + 64 + DISC_SIZE/2*zoom && getRenderedY(y) < 160 + DISC_SIZE/2*zoom){
        fadedDisks.current.add(id)
      }else{
        fadedDisks.current.delete(id)
      }
    }
  }, [zoom, camera, maxWidth, selectedSong])



  function pointInRectangle(point : {x : number, y : number}, rectPoint : {x : number, y : number}, width : number, height : number, padding : number){
    if(rectPoint.x - padding < point.x && point.x < rectPoint.x + width + padding){
      if(rectPoint.y - padding < point.y && point.y < rectPoint.y + height + padding){
        return true
      }
    }
    return false
  }

  function collidedRect(updatedDiscs : Record<string, Disk>, combo : Array<string>){
    const discA = updatedDiscs[combo[0]]
    const discB = updatedDiscs[combo[1]]
    if(combo[0].includes("_")){
      if(combo[1].includes("_")){
        for(const x of [discA.x, discA.x + LABEL_WIDTH]){
          for(const y of [discA.y, discA.y + LABEL_HEIGHT]){
            if(pointInRectangle({x : x, y : y}, {x : discB.x, y : discB.y}, LABEL_WIDTH, LABEL_HEIGHT, 0)){
              return true
            }
          }
        }
      }else{
        const padding = 200*discB.size/2
        return pointInRectangle({x : discB.x, y : discB.y}, {x : discA.x, y : discA.y}, LABEL_WIDTH, LABEL_HEIGHT, padding)
      }
    }else{
      if(combo[1].includes("_")){
        const padding = 200*discB.size/2
        return pointInRectangle({x : discA.x, y : discA.y}, {x : discB.x, y : discB.y}, LABEL_WIDTH, LABEL_HEIGHT, padding)
      }
    }
    return false
  }
  useEffect(()=>{
    cameraLocked.current = true

    function animate(){
      //Potentially expensive, look into optimizations
      setRotation(prev => prev + 2.5)

      setCamera(prev => {
        const distanceDivisor = 10
        return {x : prev.x + (cameraTarget.current.x-prev.x)/distanceDivisor , y : prev.y + (cameraTarget.current.y-prev.y)/distanceDivisor }
      })
      setZoom(prev => {
        const zoomDivisor = 10
        return prev + (zoomTarget.current-prev)/zoomDivisor
      })
      
      
      setDiscs(prev => {
        
        if(prev[selectedSong.id] && cameraLocked.current){
          cameraTarget.current = {x : prev[selectedSong.id].x , y : prev[selectedSong.id].y}
        }

        const updatedDiscs : Record<string, Disk> = {...prev}

        
    
        //Update location and opacity
        for (const [id, disc] of Object.entries(updatedDiscs)) {
          if(!constellationMode){
            if(focusedDisks.current.has(id)){
              if(disc.size < 1.5){
                disc.size += 0.05
              }else{
                disc.size = 1.5
              }
            }else{
              if(disc.size > 1){
                disc.size -= 0.05
              }else{
                disc.size = 1
              }
            }
          }

          if(disc.movementDamp > 0){
            disc.movementDamp -= 0.0005
          }else{
            disc.movementDamp = 0
          }
          
          //if(!focusedDisks.current.has(id) || id === selectedSong.id){
          disc.x += (disc.velocity.x + disc.acceleration.x/2)*disc.movementDamp 
          disc.y += (disc.velocity.y + disc.acceleration.y/2)*disc.movementDamp 
          //}

          

          if(!fadedDisks.current.has(id)){
            if(disc.opacity < 1){
              disc.opacity += 0.05
            }else{
              disc.opacity = 1
            }
          }else{
            if(disc.opacity > 0.1){
              disc.opacity -= 0.05
            }else{
              disc.opacity = 0.1
            }
          }
        }
        
        //Update velocity
        for (const combo of getCombinations(Object.keys(updatedDiscs))){
          //Coulomb's law
          const discA = updatedDiscs[combo[0]]
          const discB = updatedDiscs[combo[1]]
          var distanceAndAngle = getDistanceAndAngle(discA.x, discA.y, discB.x, discB.y)
          
          const minDistance = !constellationMode ? (combo[0].includes("_") ? LABEL_WIDTH/1.5 : 100 + combo[1].includes("_") ? LABEL_WIDTH/1.5 : 100) : 100
          if(distanceAndAngle.distance < minDistance){
            const difference = getXYDifference(minDistance-distanceAndAngle.distance, distanceAndAngle.angle)
            discA.x -= difference.dx/2
            discA.y -= difference.dy/2
            discB.x += difference.dx/2
            discB.y += difference.dy/2
            /*if(discA.movementDamp === discB.movementDamp){
            }else if(discA.movementDamp > discB.movementDamp){
              //discA.movementDamp += 0.0005
              discA.x -= difference.dx
              discA.y -= difference.dy
            }else{
              //discB.movementDamp =
              discB.x += difference.dx
              discB.y += difference.dy
            }*/
            distanceAndAngle = getDistanceAndAngle(discA.x, discA.y, discB.x, discB.y)
          }
          



          var force = 10/(distanceAndAngle.distance*distanceAndAngle.distance)
          if(distanceAndAngle.distance === 0){ //Prevent infinite force
            force = 1
          }

          //Coulomb's law + collision detection
          const newAccelerationA = {x : 0, y : 0}
          const newAccelerationB = {x : 0, y : 0}
          var change = getXYDifference(force, distanceAndAngle.angle)
          newAccelerationA.x -= change.dx
          newAccelerationA.y -= change.dy
          newAccelerationB.x += change.dx
          newAccelerationB.y += change.dy
          
          //Hooke's law
          if(correlations.current[`${combo[0]}:${combo[1]}`]){
            change = getXYDifference((distanceAndAngle.distance-150)/100000, distanceAndAngle.angle) //correlations.current[`${combo[0]}${combo[1]}`]* don't multiply by correlation
            newAccelerationA.x += change.dx
            newAccelerationA.y += change.dy
            newAccelerationB.x -= change.dx
            newAccelerationB.y -= change.dy
          }
          //Friction
          shortenVector(newAccelerationA, discA.movementDamp)
          shortenVector(newAccelerationB, discB.movementDamp)

          discA.velocity.x += (discA.acceleration.x +  newAccelerationA.x)/2
          discA.velocity.y += (discA.acceleration.y +  newAccelerationA.y)/2
          discB.velocity.x += (discB.acceleration.x +  newAccelerationB.x)/2
          discB.velocity.y += (discB.acceleration.y +  newAccelerationB.y)/2

          discA.acceleration = newAccelerationA 
          discB.acceleration = newAccelerationB
        }
        

        return updatedDiscs
      })

      


      animationRef.current = window.requestAnimationFrame(animate)
    }
    animationRef.current = window.requestAnimationFrame(animate)

    return ()=>{cancelAnimationFrame(animationRef.current)}
  }, [selectedSong, constellationMode])
  
  function getRenderedX(x : number){
    return (x - camera.x)*zoom + stageDimensions.w/2 
  }
  function getRenderedY(y : number){
    return (y - camera.y)*zoom + stageDimensions.h/2 
  }
  
  /*const keyPressed = useRef(false)
  function handleKeyDown(e : KeyboardEvent){
    if(!keyPressed.current){

    }
    keyPressed.current = true 
  }
  useEffect(()=>{
    window.addEventListener('keydown', handleKeyDown)
    return ()=>{window.removeEventListener('keydown', handleKeyDown)}
  },[])*/
  

  const discsAvailable = Object.values(discs).length !== 0 
  return ( 
    <>
      {constellationMode && loggedIn && <button onClick={()=>{ 
        setDiscs({})
        getConstellation(true)
        
        }} 
        disabled={gettingConstellation}
        className={`z-10 bg-black border-[#887880] transition-colors duration-300 border-2 p-2 h-12 rounded-md ${gettingConstellation ? "cursor-not-allowed text-[#887880]" : "cursor-pointer text-white hover:border-white "}`}>Regenerate</button>    }
      {/*discsAvailable && <div className="absolute w-screen h-screen flex flex-col items-start justify-center top-0 left-0 p-16">
        <button style={{width: 20, height: 20}} className={`z-10 bg-white transition-colors duration-300 border-2 p-2 font-bold rounded-md ${zoom < ZOOM_MAX ? "text-gray-500 cursor-pointer  hover:border-[#887880]" : "text-gray-300 cursor-not-allowed"}  `} onClick={()=>{if(zoomTarget.current < ZOOM_MAX) zoomTarget.current+=0.2}}>
        
        </button>
        <button style={{width: 20, height: 20}} className={`z-10 bg-white transition-colors duration-300 border-2 p-2 font-bold rounded-md ${zoom > ZOOM_MIN ? "text-gray-500 cursor-pointer  hover:border-[#887880]" : "text-gray-300 cursor-not-allowed"}  `} onClick={()=>{if(zoomTarget.current > ZOOM_MIN) zoomTarget.current-=0.2}}>

        </button>
      </div>*/
        
      discsAvailable && <div className="absolute w-screen h-screen flex flex-col items-end justify-center top-0 left-0 p-16">
        <div className="z-10 flex flex-col justify-center">
          <p className="text-center">+</p>
          <Slider 
          step={0.2}
          orientation="vertical"
          sx={{
            height: 100, 
            color: '#d1d5db',
            '& .MuiSlider-thumb': {
              backgroundColor: '#d1d5db',  
              width: 16, 
              height: 16,
              
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#d3d3d3',  
            },
            '& .MuiSlider-track': {
              backgroundColor: '#d3d3d3',  
            },
            '& .MuiSlider-thumb:hover': {
              boxShadow: '0 2px 6px rgba(107, 114, 128, 0.6)',
            },
            
          }}

          min={ZOOM_MIN} max={ZOOM_MAX} value={zoom} onChange={(e : Event, val : number | number[])=>{
            if(Array.isArray(val)){
              return
            }
            zoomTarget.current = val
            setZoom(val)
          }}>

        </Slider>
        <p className="text-center">-</p>
        </div>
      </div>
      }
      <div className={`flex justify-center items-center absolute top-0 left-0 w-screen h-screen`} onMouseDown={handleMouseDown}>
        
        {discsAvailable &&
        <Stage width={stageDimensions.w} height={stageDimensions.h} >
          <Layer>
          {
            Object.keys(correlations.current).filter(id => !id.includes("_")).map((id, index) => {
              const [songA, songB] = id.split(":")
              const focused = focusedDisks.current.has(songA) || focusedDisks.current.has(songB)
              
              return <Line
                key={index}
                points={[
                  getRenderedX(discs[songA].x), 
                  getRenderedY(discs[songA].y), 
                  getRenderedX(discs[songB].x), 
                  getRenderedY(discs[songB].y)
                ]} // (x1, y1, x2, y2)
                stroke={constellationMode ? "#353535" : (focused ? "#eeeeee" : "#f5f5f5")}
                strokeWidth={focused ? 5*zoom : 4*zoom} //Style based on focus?
                lineCap="round"
                lineJoin="round"
                opacity={Math.min(discs[songA].opacity, discs[songB].opacity)}
              ></Line>
            })
          }
          {
            Object.entries(discs).map(([id, disc], index) => {
              return (!id.includes("_") ? 
                (
                constellationMode ?
                <Image
                  key={index}
                  image={starImage}

                  x={getRenderedX(disc.x)}           
                  y={getRenderedY(disc.y)}     
                  opacity={disc.opacity}
                  
                  width={DISC_SIZE*disc.size*zoom} 
                  height={DISC_SIZE*disc.size*zoom}  
                  offsetX={(DISC_SIZE/2)*disc.size*zoom} // Center x-axis
                  offsetY={(DISC_SIZE/2)*disc.size*zoom} // Center y-axis

                  
                >
                </Image>
                :
                <Image
                  key={index}
                  image={images[disc.image]}
                  x={getRenderedX(disc.x)}           
                  y={getRenderedY(disc.y)}     
                  opacity={disc.opacity}

                  width={DISC_SIZE*disc.size*zoom} 
                  height={DISC_SIZE*disc.size*zoom}  
                  offsetX={(DISC_SIZE/2)*disc.size*zoom} // Center x-axis
                  offsetY={(DISC_SIZE/2)*disc.size*zoom} // Center y-axis
                  rotation={rotation}
                  shadowColor="black"
                  shadowBlur={10}
                  shadowOpacity={0.3}
                  shadowOffsetX={5*zoom}
                  shadowOffsetY={5*zoom}

                  onMouseEnter={()=>{focusedDisks.current.add(id)}}
                  onMouseLeave={()=>{if(id!==selectedSong.id)focusedDisks.current.delete(id)}}
                  onClick={()=>{setSelectedSong(disc.song)}}
                  
                />)
                :
                <Group key={index}>
                  <Text
                    text={disc.song.name}
                    x={getRenderedX(disc.x-(LABEL_WIDTH-100)/2)}           
                    y={getRenderedY(disc.y)}  
                    fontSize={constellationMode ? LABEL_HEIGHT*disc.size*zoom : LABEL_HEIGHT*zoom}
                    fontFamily="Noto Serif, Noto Sans JP, Noto Sans KR, Noto Sans TC"
                    width={(LABEL_WIDTH-100)*zoom}
                    wrap="word"
                    opacity={disc.opacity}
                    align="center"
                    fill={constellationMode ? '#e5e5e5' : '#757575'}
                  ></Text>
                </Group>
              )
            })
          }
          {
            Object.entries(discs).filter(([id, disc]) => !id.includes("_")).map(([id, disc], index) => {
              return (
                (!constellationMode || focusedDisks.current.has(id)) && 
                <Group key={index} >
                  <Text
                    text={disc.song.name}
                    
                    x={getRenderedX(disc.x)}           
                    y={getRenderedY(disc.y) + ((DISC_SIZE/2)*disc.size + 10)*zoom}     
                    fontSize={16*zoom}
                    fontFamily="Noto Serif, Noto Sans JP, Noto Sans KR, Noto Sans TC"
                    ellipsis={true}
                    width={150*zoom}
                    wrap="none"
                    opacity={disc.opacity}
                    fill={constellationMode ? "white" : "black"}

                  ></Text>
                  <Text
                    text={disc.song.author}
                    
                    x={getRenderedX(disc.x)}           
                    y={getRenderedY(disc.y) + ((DISC_SIZE/2)*disc.size + 10 + 16 + 10)*zoom}   //Font size and padding  
                    fontSize={12*zoom}
                    fontFamily="Noto Serif, Noto Sans JP, Noto Sans KR, Noto Sans TC"
                    ellipsis={true}
                    width={150*zoom}
                    wrap="none"
                    fill={constellationMode ? "white" : "#6B7280"}
                    opacity={disc.opacity}
                  ></Text>
                </Group>
              )  
              
            })
          }
          {
            Object.entries(discs).map(([id, disc], index) => {
              return (
                !id.includes("_") && 
                constellationMode &&
                <Circle
                  key={index}
                  radius={DISC_SIZE*zoom/2}
                  x={getRenderedX(disc.x)}           
                  y={getRenderedY(disc.y)}     
                  fill='transparent'
                  onMouseEnter={()=>{focusedDisks.current.add(id)}}
                  onMouseLeave={()=>{if(id!==selectedSong.id)focusedDisks.current.delete(id)}}
                  onClick={()=>{setSelectedSong(disc.song)}}
                >
                </Circle>)
            })
          }
          </Layer>
        </Stage>}

        {Object.values(discs).length === 0 && 
        (constellationMode ? 
        ((!loggedIn && !userId) ?
        <div>
          <h1 className="text-lg text-gray-400 text-center">Sign in to see your constellation!</h1>
        </div>
        :
        <SyncLoader color="#887880" loading={true} size={5}></SyncLoader>
        )
        :
        (selectedSong.id === "" ? 
        <div>
          <h1 className="text-lg text-gray-400 text-center">Search for a song using the search bar below!</h1>
        </div>
        : 
        <div>
          <h1 className="text-2xl text-gray-400 text-center">We're in uncharted waters here...</h1>
          <h2 className="text-gray-400 text-center ">Contribute to add this song!</h2>
        </div>))}
      </div>
    </>
  )
}

function Search({darkMode} : {darkMode : boolean}){
  const setSelectedSong = useContext(SongContext).setValue


    
  return (
    <>
      {!darkMode && <SearchBar disable={false} defaultSearch={""} onChange={()=>{}} boxWidth={400} type="track" growDown={false} light={false} placeholder="Search by track" onClick={(data)=>{setSelectedSong(data)}}></SearchBar>}
    </>
  )
}

function Contribute({darkMode} : {darkMode : boolean}){
  const setSelectedSong = useContext(SongContext).setValue
  const [showSearch, setShowSearch] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)

  const [tracks, setTracks] = useState<Array<Song>>([])
  const [playlist, setPlaylist] = useState({name : "", author : "", album : "", id : ""})
  const [defaultSearch, setDefaultSearch] = useState("");
  const [loading, setLoading] = useState(false)
  const [disable, setDisable] = useState(false)
  const [showThanks, setShowThanks] = useState(false)
  
  async function contributeTracks(){
    setDisable(true)
    await axios({
      method: 'put',
      url: `/api/contribute`,
      data: {
        tracks: tracks.map(track => track.id),
        playlist: playlist
      }
    })
    //Update song so that the map updates
    setSelectedSong((prev : Song) => {return {...prev}})
    setDisable(false)
    setShowThanks(true)
    setTimeout(()=>{setShowThanks(false)}, 1000)
  }

  return (
    <>
      <div className={`z-50 duration-300 transition  ${fadeIn ? "opacity-80" : "opacity-0"}`}>
        {showSearch && 
          <div className="top-0 left-0 absolute w-screen h-screen bg-black flex justify-center items-start pt-48">

              <div className="z-10">
                <SearchBar onChange={
                  ()=>{
                    setTracks([])
                    setDefaultSearch("")
                  }} 
                  
                  boxWidth={560} type="playlist" growDown={true} light={true} placeholder="Search for a playlist" 
                  defaultSearch={defaultSearch}
                  disable={disable}
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
                    setPlaylist(data)
                    setDefaultSearch(`${data.name} - ${data.author}`)
                    
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
                            <h1 className={` text-nowrap truncate text-ellipsis ${disable ? "text-[#887880]" : "text-white"}`}>{track.name}</h1>
                            <h2 className={` text-xs text-nowrap truncate text-ellipsis ${disable ? "text-[#887880]" : "text-gray-300"}`} >{`${track.author} - ${track.album}`}</h2>
                          </div>)
                        }
                      )}
                    </div>
                    <div className="flex items-center">
                      <button disabled={disable} onClick={contributeTracks} className={`mt-2 transition-colors duration-300 border-2 p-2 rounded-md border-[#887880] cursor-pointer  ${disable ? "cursor-not-allowed text-[#887880]" : "text-white hover:border-white"}`}>Submit</button>
                      {disable && <div className="p-2"><SyncLoader color="#887880" loading={true} size={5}></SyncLoader></div>}
                      {showThanks && <p className="mt-2 p-2 text-white text-[#887880]">Submission accepted!</p>}
                    </div>
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
                          background: ${disable ? "#887880" : "white"};
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
              }} className="top-0 left-0 w-full h-full absolute"></div>
          </div>
        }
      </div>
      
      <button onClick={()=>{
        setShowSearch(true) 
        setFadeIn(true)
      }} className={`z-10 ${darkMode ? "bg-black text-white border-[#887880] hover:border-white" : "bg-white text-gray-700 hover:border-[#887880]"} border-2 ml-2 p-2 rounded-md cursor-pointer`}>Contribute</button>
    </>
  )
}

function Tutorial({darkMode} : {darkMode : boolean}){
  const [showTutorial, setShowTutorial] = useState(false)
  const [fadeIn, setFadeIn] = useState(false)
  
  return <>
  <div className={`z-50 duration-300 transition  ${fadeIn ? "opacity-80" : "opacity-0"}`}>
        {showTutorial && 
          <div className="top-0 left-0 absolute w-screen h-screen bg-black flex justify-center items-center">
            <div style={{width: 600}} className="flex flex-col gap-2 text-gray-300">
              <h1 className="text-3xl font-bold text-white">Atlas</h1>
              <p>is a visual map of Spotify. It's a visualization of Spotify genres, songs and their relationships.</p>
              <p>Songs are grouped together based on how 'correlated' they are. The way we determine this is very simple: if two songs appear in the same playlist, we say that they are correlated.</p>
              <p>If songs frequently appear together, they are considered more correlated.</p>
              <p>{"The playlists we use are sourced entirely from users like you. Feel free to submit your (public) playlists with the 'Contribute' button to help us explore any unexplored territory!"}</p>
              <p className="text-gray-400 pt-2">Click anywhere to return to the map.</p>
            </div>


            <div onClick={()=>{
              setFadeIn(false)
              setTimeout(()=>setShowTutorial(false), 300)
              }} className="top-0 left-0 w-full h-full absolute"></div>
          </div>
        }
      </div>
    <button onClick={()=>{
      setShowTutorial(true)
      setFadeIn(true)
    }} className={`z-10 ${darkMode ? "bg-black text-white border-[#887880] hover:border-white" : "bg-white text-gray-700 hover:border-[#887880]"}  border-2 p-2 w-12 h-12 rounded-md cursor-pointer`}>?</button>
  </>
}

function Intro({hideIntro} : {hideIntro : ()=>void}){
  const setSelectedSong = useContext(SongContext).setValue


  return <div className="z-50 absolute top-0 left-0 w-screen h-screen flex items-center justify-center bg-white">
    <div style={{height: 400}}>
      <SearchBar 
        disable={false} 
        defaultSearch={""} 
        onChange={()=>{}} 
        boxWidth={600} 
        type="track" 
        growDown={true} 
        light={false} 
        placeholder="Search for any track!" 
        onClick={(data)=>{
          setSelectedSong(data)
          hideIntro()
        }}
      ></SearchBar>
    </div>
  </div>
}

function Map({loggedIn, handleLogout, userId, defaultConstellationState, showIntro, hideIntro} : {loggedIn : boolean, handleLogout : ()=>void, userId : string | null, defaultConstellationState : boolean, showIntro : boolean, hideIntro : ()=>void}){
  const NULL_SONG = {name : "", author : "", album : "", id : "", play : false}
  const [selectedSong, setSelectedSong] = useState<Song>(NULL_SONG)    
  const [playerVolume, setPlayerVolume] = useState(50)
  const [savedPlayerVolume, setSavedPlayerVolume] = useState(50)

  const [constellationMode, setConstellationMode] = useState(defaultConstellationState)
  const [shareText, setShareText] = useState("Share")
  const shareTimeoutRef : any = useRef(null) //Type seems to differ by browser and node

  const player : any = useContext(PlayerContext).value 

  return (
    <SongContext.Provider value={{value : selectedSong, setValue : setSelectedSong}}>
      {showIntro && <Intro hideIntro={hideIntro}></Intro>}
      <div className={`w-screen h-screen flex flex-col justify-between p-16  ${constellationMode ? "bg-black" : "bg-white"} transition-opacity duration-500 ${showIntro ? "opacity-0" : ""}`}>
        
        <div className="flex justify-between items-start">
          <Player darkMode={constellationMode}></Player>
          {!defaultConstellationState && <button onClick={handleLogout} className={`z-10 ${constellationMode ? "bg-black text-white border-[#887880] hover:border-white" : "bg-white text-gray-700 hover:border-[#887880]"} border-2 p-2 h-12 rounded-md cursor-pointer`}>Log Out</button>}
        </div>

        <div className="flex justify-between items-end">
          <div className="flex gap-2 items-end">
            <button onClick={()=>{
              if(defaultConstellationState === true){
                window.open(window.location.origin)
              }else{
                setConstellationMode(prev => !prev)
              } 
              }} className={`z-10 ${constellationMode ? "bg-black text-white border-[#887880] hover:border-white" : "bg-white text-gray-700 hover:border-[#887880]"} border-2 p-2 w-12 h-12 rounded-md cursor-pointer`} title={constellationMode ? "See Our Map of Spotify!" : "Get your Spotify Constellation!"}>
              {constellationMode ? <img src="/noun-map-1607128.svg"></img>  : <img src="/noun-constellation-7549423.svg"></img>}
            </button>
            
            <Search darkMode={constellationMode}></Search>
            <Vinyls loggedIn={loggedIn} constellationMode={constellationMode} userId={userId}></Vinyls>

            {constellationMode && (loggedIn || defaultConstellationState) && 
            <>
              <button 
              onClick={()=>{
                navigator.clipboard.writeText(`${window.location.origin + window.location.pathname}?constellation=${userId}`)
                setShareText("Link Copied!")
                clearTimeout(shareTimeoutRef.current)
                shareTimeoutRef.current = setTimeout(()=>{setShareText('Share')}, 1000)
              }}
              className={`z-10 bg-black text-white border-[#887880] hover:border-white transition-colors duration-300 border-2 p-2 h-12 rounded-md cursor-pointer`}>{shareText}</button>
            </>
            }
          </div>
          <div className="flex gap-1 items-center"> 
            {<div className={` duration-500 transition flex items-center gap-2 ${player ? "" : "opacity-0"}`}> 
              {
                player &&
                (playerVolume > 0 ? 
                <button className="cursor-pointer z-10" onClick={()=>{
                  player.setVolume(0).then(()=>{
                    setPlayerVolume(0)
                  })
                }}>
                  <VolumeUpIcon sx={{color: constellationMode ? '#FFFFFF' : '#9CA3AF'}}></VolumeUpIcon>     
                </button>
                :
                <button className="cursor-pointer z-10" onClick={()=>{
                  player.setVolume(savedPlayerVolume/100).then(()=>{
                    setPlayerVolume(savedPlayerVolume)
                  })
                }}>
                  <VolumeOffIcon sx={{color: constellationMode ? '#FFFFFF' : '#9CA3AF'}}></VolumeOffIcon>     
                </button>)
              }        
              {
                player &&
                <Slider 
                sx={{
                  width: 100, 
                  color: '#d1d5db',
                  '& .MuiSlider-thumb': {
                    backgroundColor: constellationMode ? '#FFFFFF' : '#d1d5db',  
                    width: 16, 
                    height: 16,
                    
                  },
                  '& .MuiSlider-rail': {
                    backgroundColor: constellationMode ? '#FFFFFF' : '#d3d3d3',  
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: constellationMode ? '#FFFFFF' : '#d3d3d3',  
                  },
                  '& .MuiSlider-thumb:hover': {
                    boxShadow: '0 2px 6px rgba(107, 114, 128, 0.6)',
                  },
                  
                }}

                min={0} max={100} value={playerVolume} onChange={(e : Event, val : number | number[])=>{
                if(Array.isArray(val)){
                  return
                }
                const volumeVal = val
                player.setVolume(volumeVal/100).then(()=>{
                  setPlayerVolume(volumeVal)
                  if(volumeVal > 0){
                    setSavedPlayerVolume(volumeVal)
                  }else{
                    setSavedPlayerVolume(50)
                  }
                })

              }}></Slider>}
              </div>
              }
              
            <Contribute darkMode={constellationMode}></Contribute>
            <Tutorial darkMode={constellationMode}></Tutorial>
          </div>
        </div>
      </div>
    </SongContext.Provider>
  )
}

export default function App() {
  const isBrowser = typeof window !== "undefined"

  const currentParams = new URLSearchParams(isBrowser ? window.location.search : "")
  const viewConstellation = currentParams.has('constellation')

  const [showMap, setShowMap] = useState(viewConstellation)
  const [showHome, setShowHome] = useState(!viewConstellation)
  const [fadeIn, setFadeIn] = useState(viewConstellation)
  const [player, setPlayer] = useState<any>() //Not sure what type this is
  const [playerWidth, setPlayerWidth] = useState(0)
  const [loggedIn, setLoggedIn] = useState(false)
  const [userId, setUserId] = useState(currentParams.get('constellation'))
  const [showIntro, setShowIntro] = useState(false)

  const refreshIntervalRef = useRef<any>(null)

  

  useEffect(()=>{
    if(!viewConstellation){
      axios({
        method: 'get',
        url: '/api/login-state'
      }).then(
        response => {
          if(response.data.logged_in){
           
            signIn()
            setLoggedIn(true)
            setUserId(response.data.id)
          }
        }
      )
    }
    
  }, [])
  
  function refreshToken(){
    axios({method: 'get', url: '/api/refresh-token'})
  }

  useEffect(()=>{
    if(loggedIn){
      refreshIntervalRef.current = setInterval(refreshToken, 30*60*1000) //Every 30 minutes
    }
    return ()=>{
      clearInterval(refreshIntervalRef.current)
    }
  },[loggedIn])

  function signIn(){
    setFadeIn(true)
    setShowMap(true)
    setTimeout(()=>{setShowHome(false)}, 500)
    if(!localStorage.getItem('visited')){
      setShowIntro(true)
      localStorage.setItem('visited', 'true')
    }
  }
  return (
    <PlayerContext.Provider value={{value: player, setValue: setPlayer, maxWidth:playerWidth, setMaxWidth:setPlayerWidth}}>
      <div className="overflow-hidden w-screen h-screen">
        <div className={`duration-500 transition ${fadeIn ? "-translate-y-[10%] opacity-0" : ""} ${showHome ? "" : "display-none"}`}>
          {<Home signInHandler={signIn}></Home>}  
        </div>
        <div className={`overflow-hidden absolute top-0 duration-500 transition  ${fadeIn ? "" : "opacity-0 -translate-y-[10%]"}`}>
          {showMap && <Map 
            handleLogout={()=>{
              setFadeIn(false)
              setShowHome(true)
              //setTimeout(()=>{setShowMap(false)}, 500)
              setShowMap(false) //Instantly, otherwise looks dumb
              if(player) player.disconnect()
              setPlayer(null)
              
              //if(loggedIn){
                //window.open("https://accounts.spotify.com/en/status")
              //}
              setLoggedIn(false)
              setUserId(currentParams.get('constellation'))

              document.cookie = `spotify_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
              document.cookie = `spotify_refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`

            }}
            defaultConstellationState={viewConstellation}
            loggedIn={loggedIn}
            userId={userId}
            showIntro={showIntro}
            hideIntro={()=>{setShowIntro(false)}}
            ></Map> /**/} 
        </div>
      </div>
    </PlayerContext.Provider>
  )
}
