'use client'
import { useEffect, useState } from "react";
import axios from "axios";
//https://coolors.co/cb3342-686963-8aa29e-3d5467-f1edee
//https://coolors.co/8a4f7d-887880-88a096-bbab8b-ef8275



export default function App() {
  const [showMap, setShowMap] = useState<boolean>(false)
  const [fadeIn, setFadeIn] = useState(false)

  useEffect(()=>{
    
  }, [])
  
  
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

  function Map(){
    function Player(){
      return (
        <div className="">
          <h1 className="text-5xl">My Love Mine All Mine</h1>
          <h2 className="pt-2">{"Mitski - The Land is Inhospitable and So Are We"}</h2>
          <h2 className="pt-2 text-gray-500">38.8951, -77.0364</h2>
        </div>
      )
    }
    function Vinyls(){
      return (
        <div className="flex justify-center">
          <div>
            <h1 className="text-2xl text-gray-600 text-center">We're in uncharted waters here...</h1>
            <h2 className="text-gray-600 text-center ">Contribute to add this song!</h2>
          </div>
        </div>
      )
    }
    function Search(){
      return (
        <>
          <input placeholder="Search by keyword or song..." className="transition-color duration-300 border-2 p-2 rounded-md text-gray-700 w-96 hover:border-[#887880] focus:border-[#887880] focus:outline-none"></input>
        </>
      )
    }
    function Contribute(){
      const [showSearch, setShowSearch] = useState(false);
      const [fadeIn, setFadeIn] = useState(false);
      async function searchQuery(e : React.FormEvent<HTMLInputElement>){
        var result = await axios({
          method: 'get',
          url : 'http://localhost:8888/api/search/playlist',
          params: {
            q: e.currentTarget.value.trim()
          },
        })
        console.log(result)
      }
      return (
        <>
          <div className={`duration-500 transition  ${fadeIn ? "opacity-80" : "opacity-0"}`}>
            {showSearch && 
              <div className="top-0 left-0 absolute w-screen h-screen bg-black flex justify-center items-start pt-48">
                <div onClick={()=>{
                  setFadeIn(false)
                  setTimeout(()=>setShowSearch(false), 500)

                  }} className="top-0 left-0 w-full h-full absolute"></div>
                <input onChange={searchQuery} placeholder="Search for a playlist" className={`z-10 transition bg-transparent duration-300 border-2 p-2 rounded-md text-white w-96 border-[#887880] hover:border-white focus:border-white focus:outline-none`}></input>

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
    return (
      <div className="w-screen h-screen flex flex-col justify-between p-16">
        <Player></Player>
        <Vinyls></Vinyls>
        <div className="flex justify-between">
          <div className="flex gap-1">
            <Search></Search>
            <Contribute></Contribute>

          </div>
          <button className="transition-color duration-300 border-2 p-2 w-12 h-12 rounded-full text-gray-700 cursor-pointer hover:border-[#887880]">?</button>
        </div>
      </div>
    )
  }

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
      <div className={`absolute top-0 duration-500 transition  ${fadeIn ? "" : "opacity-0 -translate-y-[10%]"}`}>
        {fadeIn && <Map></Map> /**/} 
      </div>
      
    </div>
  );
}
