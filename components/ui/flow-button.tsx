'use client';

export function FlowButton({ text = "Modern Button" }: { text?: string }) {
  return (
    <button className="group relative flex items-center gap-1 overflow-hidden rounded-[100px] border-[2px] border-transparent bg-transparent px-8 py-3 text-sm font-semibold text-white cursor-pointer transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-white hover:text-black hover:rounded-[12px] hover:scale-110 active:scale-[0.95]">
      <span className="relative z-[1] -translate-x-3 group-hover:translate-x-0 transition-all duration-[1000ms] ease-out">
        {text}
      </span>

      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-[50%] opacity-0 group-hover:w-[220px] group-hover:h-[220px] group-hover:opacity-100 transition-all duration-[1200ms] ease-[cubic-bezier(0.19,1,0.22,1)] backdrop-blur-md group-hover:backdrop-blur-lg" style={{ backdropFilter: 'blur(10px)' }}></span>
    </button>
  );
}
