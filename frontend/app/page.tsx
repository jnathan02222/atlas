
export default function Home() {
  return (
    <div className="flex min-h-screen justify-center items-center">
       <div className="flex items-center justify-center w-screen min-h-screen overflow-hidden">
        <div className="flex justify-center items-center animate-slow-spin aspect-square w-2/5">
          <img src="/Emblem_of_the_United_Nations.svg" className="w-full"></img>
        </div>
        <div className="rounded-full bg-gray-800 w-[10%] aspect-square absolute"></div>
        <div className="rounded-full bg-black w-[2.5%] aspect-square absolute"></div>
      </div>
      <div className="flex flex-col items-center absolute">
        <img src="Full_Logo_White_RGB.svg" className="h-6"></img>
        <h1 className="text-8xl text-white">Atlas</h1>
        <button className=" rounded-md text-white">Sign In</button>
      </div>
      
    </div>
   
  );
}
    
