'use client'


export default function Home() {
  return (
    <div className="flex min-h-screen justify-center items-center">
       <div className="flex items-center justify-center w-screen min-h-screen overflow-hidden">
        <div className="flex justify-center items-center animate-slow-spin aspect-square w-1/2">
          <img src="/Emblem_of_the_United_Nations.svg" className="w-full drop-shadow-2xl"></img>
        </div>
        <div className="rounded-full bg-red-800	 w-[16%] aspect-square absolute"></div>
        <img src="noun-wood-texture-586023.svg" className="w-[16%] opacity-10 absolute animate-slow-spin"></img>
        <div className="rounded-full bg-black w-[1%] aspect-square absolute"></div>
      </div>
      <div className="flex flex-col items-center absolute">
        <img src="Full_Logo_White_RGB.svg" className="h-6 w-[50%]"></img>
        <h1 className="text-white" style={{fontSize: "7vw", lineHeight: 1}}>Atlas</h1>
        <a className=" rounded-md text-gray-400 cursor-pointer" style={{fontSize: "1.2vw", lineHeight: 1}}>Sign In</a>
      </div>
      
      
    </div>
   
  );
}
    
