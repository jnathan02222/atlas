'use client'
import { useEffect, useState, useRef, memo, createContext, useContext } from "react";
import axios from "axios";
//https://coolors.co/cb3342-686963-8aa29e-3d5467-f1edee
//https://coolors.co/8a4f7d-887880-88a096-bbab8b-ef8275

const PlayerContext = createContext({value : {name : "", author : "", album : "", id : ""}, setValue : (val : {name : string, author :string, album : string, id : string})=>{}})


const SearchBar = ({boxWidth, growDown, light, placeholder, type, onClick} : { boxWidth : number, growDown : boolean, light : boolean, placeholder : string, type : "playlist" | "track", onClick : (data : {name : string, author : string, album : string, id : string}) => void}) => {
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Array<{name : string, author : string, album : string, id : string}>>([]);
  const latestTimestamp = useRef(0);
  
  //Use latest timestamp to ensure latest result is used
  function setCurrentSearchResults(results : Array<{name : string, author : string, album : string, id : string}>, timestamp : number){
    if(timestamp > latestTimestamp.current){
      latestTimestamp.current = timestamp;
      setSearchResults(results);
    }
  }
  <input placeholder="Search by keyword or song..." ></input>

  
  async function searchQuery(e : React.FormEvent<HTMLInputElement>){
    setQuery(e.currentTarget.value);
    
    const timestamp = Date.now();

    if( e.currentTarget.value.trim() == ""){
      setCurrentSearchResults([], timestamp);
      return;
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



function Player(){  //<div className="bg-black mr-5 rounded-sm" style={{width: 112, height: 112}}></div>
  const selectedSong = useContext(PlayerContext).value
  const scriptsLoaded = useRef(false);

  function getCookie(name : string) {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      const [key, value] = cookie.split('=');
      if (key === name) {
        return decodeURIComponent(value);
      }
    }
    return null; // Return null if the cookie isn't found
  }

  useEffect(() => {
    if(scriptsLoaded.current){
      return
    }

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
    scriptsLoaded.current = true

    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
            name: 'Web Playback SDK',
            getOAuthToken: (cb : any) => { cb(getCookie("spotify_token")) },
            volume: 0.5
        });
        
        player.addListener('ready', ({ device_id } : {device_id : string}) => {
            console.log('Ready with Device ID', device_id);
        });

        player.addListener('not_ready', ({ device_id } : {device_id : string}) => {
            console.log('Device ID has gone offline', device_id);
        });

        player.connect();
      };
  }, []);

  const [position, setPosition] = useState(0)
  const animationId = useRef<number>(0)
  const sliderRef = useRef<HTMLHeadingElement>(null)

  useEffect(()=>{
    if(!sliderRef.current){
      return
    }
    
    setPosition(48)
    const width = sliderRef.current.scrollWidth 
    
    console.log(width)
    if(width <= 600){
      return
    }

    const animate = (x : number, direction : number, pause : number) => {
      setPosition(x)
      if(pause > 0){
        pause -= 1
      }
      if(x < (600-width) || x > 48){
        direction *= -1
        if(x < (600-width)){
          x = (600-width)
        }else{
          x = 48
        }
        pause = 60
      }

      animationId.current = window.requestAnimationFrame(()=>{animate(x+(pause === 0 ? direction : 0), direction, pause)})
    }
    animationId.current = window.requestAnimationFrame(()=>{animate(48, -1, 60)})

    return ()=>{cancelAnimationFrame(animationId.current)}
  },[selectedSong])

  return (
       <div className="flex items-center">
        {selectedSong.id !== "" &&
          <div className="w-full">
            
            <div className="flex -translate-x-36" >
              <div className="w-24 bg-gradient-to-l from-transparent to-white z-10 translate-x-24"></div>
              <div className="w-[600px] text-nowrap overflow-x-hidden h-[64px]"> 
                <h1 ref={sliderRef} className="text-5xl" style={{ transform: `translateX(${position}px)` }}>{selectedSong.name}</h1>
              </div>
              <div className="w-24 bg-gradient-to-r from-transparent to-white -translate-x-24"></div>
            </div>

            <h2 className=" ">{`${selectedSong.author} - ${selectedSong.album}`}</h2>
            <h2 className="pt-2 text-gray-500">38.8951, -77.0364</h2>
          </div>
        }
      </div>
   
  )
}
function Vinyls(){
  
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
  const setSelectedSong = useContext(PlayerContext).setValue

  return (
    <>
      <SearchBar boxWidth={400} type="track" growDown={false} light={false} placeholder="Search by track or keyword" onClick={(data)=>{setSelectedSong(data)}}></SearchBar>
    </>
  )
}

function Contribute(){
  const [showSearch, setShowSearch] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  
  return (
    <>
      <div className={`duration-300 transition  ${fadeIn ? "opacity-80" : "opacity-0"}`}>
        {showSearch && 
          <div className="top-0 left-0 absolute w-screen h-screen bg-black flex justify-center items-start pt-48">

              <div className="z-10">
                <SearchBar boxWidth={560} type="playlist" growDown={true} light={true} placeholder="Search for a playlist" onClick={(data)=>{}}></SearchBar>
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
      }} className="transition-color duration-300 border-2 p-2  rounded-md text-gray-700 cursor-pointer hover:border-[#887880]">Contribute</button>
    </>
  )
}

function Map(){
  const [selectedSong, setSelectedSong] = useState<{name : string, author : string, album : string, id : string}>({name : "", author : "", album : "", id : ""})    

  return (
    <PlayerContext.Provider value={{value : selectedSong, setValue : setSelectedSong}}>
      <div className="w-screen h-screen flex flex-col justify-between p-16">
        <Player ></Player>
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
    </PlayerContext.Provider>
  )
}

export default function App() {
  const [showMap, setShowMap] = useState<boolean>(false)
  const [fadeIn, setFadeIn] = useState(false)
  
  useEffect(()=>{
  }, [])

  return (
    <div className="overflow-hidden">
      <div className={`duration-500 transition  ${fadeIn ? "translate-y-[10%] opacity-0" : ""}`}>
        {!showMap && <Home signInHandler={
          ()=>{
            setFadeIn(true)
            setTimeout(()=>{setShowMap(true)}, 500)
          }
          }></Home>}  
      </div>
      <div className={`overflow-hidden absolute top-0 duration-500 transition  ${fadeIn ? "" : "opacity-0 -translate-y-[10%]"}`}>
        {fadeIn && <Map></Map> /**/} 
      </div>
      
    </div>
  );
}
