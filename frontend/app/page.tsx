'use client'


export default function Home() {
  return (
    <div className="flex min-h-screen  items-center  w-screen overflow-hidden">
       <div className="flex items-center justify-center w-1/2 min-h-screen ml-[10%]">
        <div className="flex justify-center items-center animate-slow-spin aspect-square w-4/5">
          <img src="/Emblem_of_the_United_Nations.svg" className="w-full drop-shadow-2xl"></img>
        </div>
        <img src="noun-vinyl-6402867.svg" className="w-2/5 opacity-[0.1] absolute"></img>
        <div className="rounded-full bg-red-800 border-4	border-red-900 w-[13%] aspect-square absolute"></div>
        <div className="rounded-full bg-white border-4	border-red-900 w-[2%] aspect-square absolute"></div>

      </div>
      <div className="flex flex-col items-start absolute ml-[60%]">
        <img src="Full_Logo_black_RGB.svg" className="h-6"></img>
        <h1 className="text-black" style={{fontSize: "6vw", lineHeight: 1}}>Atlas</h1>
        <a className="border-2 p-2 rounded-md text-black cursor-pointer" style={{fontSize: "1vw", lineHeight: 1}}>Sign In</a>
      </div>
      
      
    </div>
   
  );
}
    
