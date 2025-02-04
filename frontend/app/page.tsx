'use client'
import { useEffect, useState, useRef, memo, createContext, useContext } from "react"
import axios from "axios"
import { SyncLoader } from 'react-spinners'
import { Stage, Layer, Image, Line } from 'react-konva';
import useImage from 'use-image';

//https://coolors.co/cb3342-686963-8aa29e-3d5467-f1edee
//https://coolors.co/8a4f7d-887880-88a096-bbab8b-ef8275

const SongContext = createContext({value : {name : "", author : "", album : "", id : ""}, setValue : (val : Song | ((song: Song) => Song))=>{}})
const PlayerContext = createContext({value: false, setValue : (prev : boolean) => {}})

type Song = {name : string, author : string, album : string, id : string}

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

const SearchBar = ({boxWidth, growDown, light, placeholder, type, onClick, onChange, defaultSearch, disable} : { boxWidth : number, growDown : boolean, light : boolean, placeholder : string, type : "playlist" | "track", onClick : (data : Song) => void, onChange : () => void, defaultSearch : string, disable : boolean}) => {
  const [query, setQuery] = useState(defaultSearch)
  const [searchResults, setSearchResults] = useState<Array<Song>>([])
  const latestTimestamp = useRef(0)
  
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
      <input disabled={disable} value={query} onChange={searchQuery} style={{width: boxWidth, height: 48}} placeholder={placeholder} className={` ${light ? `transition bg-transparent duration-300 border-2 p-2 rounded-md  border-[#887880]  focus:outline-none ${disable ? "text-[#887880] cursor-not-allowed" : "hover:border-white focus:border-white text-white"}` : "transition-color duration-300 border-2 p-2 rounded-md text-gray-700 w-96 hover:border-[#887880] focus:border-[#887880] focus:outline-none"}`}></input>
      {growDown && results()}
    </div>
  )

}

function Home({signInHandler} : {signInHandler : ()=> void}){
  return (
    <div className="flex min-h-screen  items-center  w-screen overflow-hidden select-none">
      <div className="flex items-center justify-center w-1/2 min-h-screen ml-[10%] ">
        <div className="flex justify-center items-center  aspect-square w-4/5 drop-shadow-[20px_20px_35px_rgba(0,0,0,0.30)]">
          <img src="Emblem_of_the_United_Nations.svg" draggable="false" className="w-full animate-slow-spin "></img>
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

function Marquee({marqueeWidth, edgeWidth, height, endPause, selectedSong, children} : {marqueeWidth : number, height: number, edgeWidth : number, endPause : number, selectedSong : Song, children : React.ReactNode }){
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
      <div style={{width: edgeWidth, transform: `translateX(${edgeWidth}px)`}} className={` ${showSide ? "bg-gradient-to-l from-transparent via-white to-white" : ""} z-10 `}></div>
      <div className={`text-nowrap overflow-x-hidden`} style={{width: marqueeWidth, height: height}}> 
        <div ref={sliderRef} className="w-fit" style={{ transform: `translateX(${position}px)` }}>{children}</div>
      </div>
      <div style={{width: edgeWidth, transform: `translateX(${-edgeWidth}px)`}} className={`${showSide ? "bg-gradient-to-r from-transparent via-white to-white" : ""}`}></div>
    </div>
  )
}

function Player(){  //<div className="bg-black mr-5 rounded-sm" style={{width: 112, height: 112}}></div>
  const selectedSong = useContext(SongContext).value
  const setSelectedSong = useContext(SongContext).setValue

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

        player.addListener('player_state_changed', ((info : Record<string, any>) => {
          if(!info){
            return 
          }
          const current_track = info.track_window.current_track
          setSelectedSong(
            (prev : Song) => {
              if(prev.id === current_track.id){
                return prev
              }
              return {name : current_track.name, author : current_track.artists.map((artist : Record<string, any>)=>artist.name).join(", "), album : current_track.album.name, id : current_track.id}
            }
          )
        }))

        player.connect()

        setPlayer(player)
      }
  }, [])


  return (
       <div className="flex items-center">
        {selectedSong.id !== "" &&
        <div className="w-full">
            
            <Marquee marqueeWidth={600} height={62} edgeWidth={48} endPause={120} selectedSong={selectedSong}>
              <h1 className="text-5xl w-min" >{selectedSong.name}</h1>
            </Marquee>
            <Marquee marqueeWidth={600} height={25} edgeWidth={48} endPause={120} selectedSong={selectedSong}>
              <h2 >{`${selectedSong.author} - ${selectedSong.album}`}</h2>
            </Marquee>

            <h2 className="pt-2 text-gray-500">{`${coordinates.x}, ${coordinates.y}`}</h2>
          </div>
        }
      </div>
   
  )
}

type Disk = {x: number, y: number, image: number, velocity : {x : number, y : number}, song : Song, opacity : number, size : number} 
type Correlation = {songa: string, songb: string, count: number}

function Vinyls(){
  const selectedSong = useContext(SongContext).value
  const setSelectedSong = useContext(SongContext).setValue

  const [discs, setDiscs] = useState<Record<string, Disk>>({})
  const correlations = useRef<Record<string, number>>({})
  const focusedDisks = useRef<Set<string>>(new Set())
  
  const [stageDimensions, setStageDimensions] = useState({w: window.innerWidth, h : window.innerHeight})
  const animationRef = useRef(0)
  const [rotation, setRotation] = useState(0)
  const movementDamp = useRef(0)
  const [camera, setCamera] = useState({x : 0, y : 0})
  const cameraTarget = useRef({x : 0, y : 0})

  const imagePaths = ['/vinyl1.svg', '/vinyl2.svg', '/vinyl3.svg', '/vinyl4.svg', '/vinyl5.svg'];
  const images = imagePaths.map(path => {
    const [image] = useImage(path)
    return image
  });
  


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
          movementDamp.current = 1
          
          const tracks : Record<string, Song> = {}
          response.data.tracks.forEach((track : Record<string, any>)=>{
            tracks[track.id] = {name : track.name, author : track.artists.map((artist : Record<string, any>) => artist.name).join(', '), album : track.album.name, id : track.id}
          })

          setDiscs(prev => {
            var updatedDisks = {...prev}
            
            //Check if there is a link between currently displayed songs and new songs
            const neighbours : Array<Correlation> = response.data.neighbours 
            
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
            }
          
            
            if(!updatedDisks[selectedSong.id] && neighbours.length > 0){
              updatedDisks[selectedSong.id] = {
                x : 0, 
                y : 0, 
                image : Math.floor(Math.random()*images.length), 
                velocity : {x : 0, y : 0}, 
                opacity : 0,
                song : tracks[selectedSong.id],
                size : 1
              }
            }
            focusedDisks.current = new Set()
            focusedDisks.current.add(selectedSong.id)

            function getRandomDisk(spread : number, id : string){
              return {
                x : updatedDisks[selectedSong.id].x + (Math.random()-0.5) * spread, 
                y : updatedDisks[selectedSong.id].y + (Math.random()-0.5) * spread, 
                image : Math.floor(Math.random()*images.length),
                velocity : {x : 0, y : 0}, 
                opacity : 0,
                song : tracks[id],
                size : 1
              }
            }

            for(const neighbour of neighbours){
              if(!updatedDisks[neighbour.songa]){
                updatedDisks[neighbour.songa] = getRandomDisk(300, neighbour.songa)
              }
              if(!updatedDisks[neighbour.songb]){
                updatedDisks[neighbour.songb] = getRandomDisk(300, neighbour.songb)
              }
              if(!correlations.current[`${neighbour.songa}${neighbour.songb}`]){
                correlations.current[`${neighbour.songa}${neighbour.songb}`] = neighbour.count
              }
            }
            return updatedDisks
          })


        }
      )
    }
    
  }, [selectedSong])

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
    function animate(){
      //Potentially expensive, look into optimizations
      setRotation(prev => prev + 0.5)

      setCamera(prev => {
        const distanceDivisor = 30
        return {x : prev.x + (cameraTarget.current.x-prev.x)/distanceDivisor , y : prev.y + (cameraTarget.current.y-prev.y)/distanceDivisor }
      })


      
      setDiscs(prev => {
        if(prev[selectedSong.id]){
          cameraTarget.current = {x : prev[selectedSong.id].x , y : prev[selectedSong.id].y}
        }
        

        const updatedDiscs : Record<string, Disk> = {...prev}

        if(movementDamp.current > 0){
          //movementDamp.current -= 0.0005
        }else{
          movementDamp.current = 0
          //return updatedDiscs
        }
    

        //Update location and opacity
        for (const [id, disc] of Object.entries(updatedDiscs)) {
          if(focusedDisks.current.has(id)){
            if(disc.size < 1.5){
              disc.size += 0.01
            }else{
              disc.size = 1.5
            }
          }else{
            if(disc.size > 1){
              disc.size -= 0.01
            }else{
              disc.size = 1
            }
          }
          
          if(!focusedDisks.current.has(id) || id === selectedSong.id){
            disc.x += disc.velocity.x * movementDamp.current
            disc.y += disc.velocity.y * movementDamp.current
          }
          if(disc.opacity < 1){
            disc.opacity += 0.01
          }else{
            disc.opacity = 1
          }
        }

        //Update velocity
        for (const combo of getCombinations(Object.keys(updatedDiscs))){
          //Coulomb's law
          const discA = updatedDiscs[combo[0]]
          const discB = updatedDiscs[combo[1]]
          const distanceAndAngle = getDistanceAndAngle(discA.x, discA.y, discB.x, discB.y)
          var force = 10/(distanceAndAngle.distance*distanceAndAngle.distance)
          if(distanceAndAngle.distance === 0){ //Prevent infinite force
            force = 1
          }
          //Coulomb's law
          var change = getXYDifference(force, distanceAndAngle.angle)
          discA.velocity.x -= change.dx
          discA.velocity.y -= change.dy
          discB.velocity.x += change.dx
          discB.velocity.y += change.dy
          
          //Hooke's law
          if(correlations.current[`${combo[0]}${combo[1]}`]){
            change = getXYDifference(correlations.current[`${combo[0]}${combo[1]}`]*distanceAndAngle.distance/1000000, distanceAndAngle.angle)
            discA.velocity.x += change.dx
            discA.velocity.y += change.dy
            discB.velocity.x -= change.dx
            discB.velocity.y -= change.dy
          }
        }
        return updatedDiscs
      })


      animationRef.current = window.requestAnimationFrame(animate)
    }
    animationRef.current = window.requestAnimationFrame(animate)
  }, [selectedSong])

  return (
    <div className="flex justify-center items-center absolute top-0 left-0 w-screen h-screen">
      {Object.values(discs).length !== 0 &&
       <Stage width={stageDimensions.w} height={stageDimensions.h}>
        <Layer>
        {
          Object.keys(correlations.current).map((id, index) => {
            const songA = id.slice(0, 22)
            const songB = id.slice(22)


            return <Line
              key={index}
              points={[
                discs[songA].x + stageDimensions.w/2  - camera.x, 
                discs[songA].y + stageDimensions.h/2  - camera.y, 
                discs[songB].x + stageDimensions.w/2  - camera.x, 
                discs[songB].y + stageDimensions.h/2  - camera.y
              ]} // (x1, y1, x2, y2)
              stroke="#f3f4f6"
              strokeWidth={4}
              lineCap="round"
              lineJoin="round"
              opacity={Math.min(discs[songA].opacity, discs[songB].opacity)}
            ></Line>
          })
        }
        {
          Object.entries(discs).map(([id, disc], index) => {
            return  <Image
              key={index}
              image={images[disc.image]}
              x={disc.x + stageDimensions.w/2 - camera.x}           
              y={disc.y + stageDimensions.h/2 - camera.y}     
              opacity={disc.opacity}
              width={100*disc.size} 
              height={100*disc.size}  
              offsetX={50*disc.size} // Center x-axis
              offsetY={50*disc.size} // Center y-axis
              rotation={rotation}
              shadowColor="black"
              shadowBlur={10}
              shadowOpacity={0.3}
              shadowOffsetX={5}
              shadowOffsetY={5}
              onMouseEnter={()=>{focusedDisks.current.add(id)}}
              onMouseLeave={()=>{if(id!==selectedSong.id)focusedDisks.current.delete(id)}}
              onClick={()=>{setSelectedSong(disc.song)}}
            />
          })
        }
        {

        }
        </Layer>
      </Stage>}
      {selectedSong.id === "" && <div>
        <h1 className="text-lg text-gray-400 text-center">Search for a song using the search bar below!</h1>
      </div>}
      {Object.values(discs).length === 0 && selectedSong.id !== "" && <div>
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
      <SearchBar disable={false} defaultSearch={""} onChange={()=>{}} boxWidth={400} type="track" growDown={false} light={false} placeholder="Search by track or keyword" onClick={(data)=>{setSelectedSong(data)}}></SearchBar>
    </>
  )
}

function Contribute(){
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
    setDisable(false)
    //setShowThanks(true)
    //setTimeout(()=>{setShowThanks(false)}, 1000)
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
                      <button disabled={disable} onClick={contributeTracks} className={`mt-2 transition-color duration-300 border-2 p-2 rounded-md border-[#887880] cursor-pointer  ${disable ? "cursor-not-allowed text-[#887880]" : "text-white hover:border-white"}`}>Submit</button>
                      {disable && <div className="p-2"><SyncLoader color="#887880" loading={true} size={5}></SyncLoader></div>}
                      {showThanks && <p className="p-2 text-white text-[#887880]">Submission accepted!</p>}
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
      }} className="z-10 bg-white transition-color duration-300 border-2 p-2  rounded-md text-gray-700 cursor-pointer hover:border-[#887880]">Contribute</button>
    </>
  )
}

function Map({handleLogout} : {handleLogout : ()=>void}){
  const [selectedSong, setSelectedSong] = useState<Song>({name : "", author : "", album : "", id : ""})    
  
  return (
    <SongContext.Provider value={{value : selectedSong, setValue : setSelectedSong}}>
      <div className="w-screen h-screen flex flex-col justify-between p-16">
        <div className="flex justify-between items-start">
          <Player ></Player>
          <button onClick={handleLogout} className="bg-white transition-color duration-300 border-2 p-2 h-12 rounded-md text-gray-700 cursor-pointer hover:border-[#887880] z-10">Log Out</button>

        </div>
        <Vinyls></Vinyls>
        <div className="flex justify-between items-end">
          <div className="flex gap-1 items-end">
            <Search></Search>
          </div>
          <div className="flex gap-1"> 
            <Contribute></Contribute>
            <button className="z-10 bg-white transition-color duration-300 border-2 p-2 w-12 h-12 rounded-md text-gray-700 cursor-pointer hover:border-[#887880]">?</button>

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
