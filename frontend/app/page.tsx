
export default function Home() {
  return (
    <div className="flex min-h-screen justify-center items-center">
       <div className="flex items-center justify-center w-screen min-h-screen overflow-hidden">
        <div className="flex justify-center items-center animate-slow-spin aspect-square w-2/5">
          <img src="/Emblem_of_the_United_Nations.svg" className="w-full"></img>
        </div>
        <div className="rounded-full bg-white w-[10%] aspect-square absolute"></div>
        <div className="rounded-full bg-black w-[2.5%] aspect-square absolute"></div>
      </div>
      <div>
        <h1 className="text-8xl">Atlas</h1>
        <button className="border-2 p-2 rounded-md">Sign In</button>
      </div>
      
    </div>
   
  );
}
    
