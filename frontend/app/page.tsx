'use client'


export default function Home() {
  return (
    <div className="overflow-hidden">
      <div className="flex min-h-screen justify-center items-center w-screen">
        <div className="flex items-center justify-center w-[100%] min-h-screen">
          <div className="flex justify-center items-center animate-slow-spin aspect-square w-2/5">
            <img src="/Emblem_of_the_United_Nations.svg" className="w-full drop-shadow-2xl"></img>
          </div>
          <img src="noun-vinyl-6402867.svg" className="w-2/5 opacity-[0.1] absolute"></img>
          <div className="rounded-full bg-red-800 border-4	border-red-900 w-[13%] aspect-square absolute"></div>
          <img src="noun-wood-texture-586023.svg" className="w-[14%] opacity-[0.04] absolute animate-slow-spin"></img>
        </div>
        <div className="flex flex-col items-center absolute">
          <img src="Full_Logo_White_RGB.svg" className="h-6 w-[50%]"></img>
          <h1 className="text-white" style={{fontSize: "6vw", lineHeight: 1}}>Atlas</h1>
          <a className=" rounded-md text-gray-200 cursor-pointer" href="http://localhost:8888/api/login" style={{fontSize: "1vw", lineHeight: 1}}>Sign In</a>
        </div>
      </div>
    </div>
   
  );
}
    
