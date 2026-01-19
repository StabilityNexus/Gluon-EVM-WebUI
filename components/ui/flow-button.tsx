'use client';

export function FlowButton({ text = "Modern Button" }: { text?: string }) {
  return (
    <button 
      className="flow-button-nav group relative flex items-center gap-1 overflow-hidden rounded-[100px] border-[1px] border-transparent bg-transparent font-semibold text-black dark:text-white cursor-pointer transition-all duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-black dark:hover:border-white hover:text-white dark:hover:text-black hover:rounded-[12px] hover:scale-[1.02] active:scale-[0.95] !text-[16px] !px-[20px] !py-[10px]"
      style={{ padding: '10px 20px', fontSize: '16px' }}
    >
      <span className="relative z-[1] -translate-x-3 group-hover:translate-x-0 transition-all duration-[1000ms] ease-out !text-[16px]" style={{ fontSize: '16px' }}>
        {text}
      </span>

      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black dark:bg-white rounded-full opacity-0 group-hover:w-[120px] group-hover:h-[120px] group-hover:opacity-100 transition-all duration-[1200ms] ease-[cubic-bezier(0.19,1,0.22,1)]" style={{ backdropFilter: 'blur(10px)' }}></span>
    </button>
  );
}
