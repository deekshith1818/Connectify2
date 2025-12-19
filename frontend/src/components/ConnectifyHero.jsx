import { OrbitingCircles } from "./ui/orbiting-circles";
import { BorderBeam } from "./ui/border-beam";
import { 
  VideoCamera, 
  WifiHigh, 
  ChatCircleDots, 
  Monitor, 
  ShieldCheck, 
  GlobeHemisphereWest 
} from "@phosphor-icons/react";

export function ConnectifyHero() {
  return (
    <div className="relative flex h-[400px] md:h-[500px] w-full flex-col items-center justify-center overflow-hidden rounded-2xl bg-white/50 border border-slate-100 shadow-[0_25px_50px_rgba(15,23,42,0.08)]">
      {/* Animated border beam */}
      <BorderBeam size={250} duration={12} delay={9} />
      
      {/* Center brand text */}
      <span className="pointer-events-none whitespace-pre-wrap bg-gradient-to-b from-blue-500 to-purple-600 bg-clip-text text-center text-5xl md:text-7xl font-bold leading-none text-transparent">
        Connectify
      </span>

      {/* Inner Circles - Core Tech (Video & Connection) */}
      <OrbitingCircles
        className="size-[50px] border-none bg-transparent"
        duration={20}
        delay={20}
        radius={80}
      >
        <div className="flex items-center justify-center size-12 rounded-full bg-blue-100 shadow-md">
          <VideoCamera size={24} weight="duotone" className="text-blue-600" />
        </div>
      </OrbitingCircles>
      <OrbitingCircles
        className="size-[50px] border-none bg-transparent"
        duration={20}
        delay={10}
        radius={80}
      >
        <div className="flex items-center justify-center size-12 rounded-full bg-indigo-100 shadow-md">
          <WifiHigh size={24} weight="duotone" className="text-indigo-600" />
        </div>
      </OrbitingCircles>

      {/* Outer Circles - Features */}
      <OrbitingCircles
        className="size-[60px] border-none bg-transparent"
        radius={160}
        duration={40}
        reverse
      >
        <div className="flex items-center justify-center size-14 rounded-full bg-purple-100 shadow-md">
          <ChatCircleDots size={28} weight="duotone" className="text-purple-600" />
        </div>
      </OrbitingCircles>
      <OrbitingCircles
        className="size-[60px] border-none bg-transparent"
        radius={160}
        duration={40}
        delay={10}
        reverse
      >
        <div className="flex items-center justify-center size-14 rounded-full bg-violet-100 shadow-md">
          <Monitor size={28} weight="duotone" className="text-violet-600" />
        </div>
      </OrbitingCircles>
      <OrbitingCircles
        className="size-[60px] border-none bg-transparent"
        radius={160}
        duration={40}
        delay={20}
        reverse
      >
        <div className="flex items-center justify-center size-14 rounded-full bg-emerald-100 shadow-md">
          <ShieldCheck size={28} weight="duotone" className="text-emerald-600" />
        </div>
      </OrbitingCircles>
      <OrbitingCircles
        className="size-[60px] border-none bg-transparent"
        radius={160}
        duration={40}
        delay={30}
        reverse
      >
        <div className="flex items-center justify-center size-14 rounded-full bg-blue-100 shadow-md">
          <GlobeHemisphereWest size={28} weight="duotone" className="text-blue-600" />
        </div>
      </OrbitingCircles>
    </div>
  );
}

export default ConnectifyHero;
