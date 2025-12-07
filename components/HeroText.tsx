"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

function HeroText() {
    const [titleNumber, setTitleNumber] = useState(0);
    const titles = useMemo(
        () => [
            "Decentralized", 
            "Autonomous", 
            "Permissionless", 
            "Transparent", 
            "Crypto-Backed", 
            "Anything-Pegged"
        ],
        []
    );

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (titleNumber === titles.length - 1) {
                setTitleNumber(0);
            } else {
                setTitleNumber(titleNumber + 1);
            }
        }, 2000);
        return () => clearTimeout(timeoutId);
    }, [titleNumber, titles]);

    return (
        <div className="flex justify-center items-center">
            <h1
            className="my-30 text-3xl lg:text-5xl font-semibold mb-6 tracking-[0.25em] uppercase"
            style={{ fontFamily: "'Space Mono', 'Syne', 'Orbitron', 'Courier New', monospace" }}
        >
            <div className="flex flex-col items-center gap-2">
                <div className="flex justify-center items-center text-center">
                    <span className="flex justify-center items-center relative h-[1.3em] text-center">
                        {titles.map((title, index) => (
                            <motion.span
                                key={index}
                                className="absolute inset-0 flex items-center justify-center font-bold whitespace-nowrap tracking-[0.35em]"
                                initial={{ opacity: 0, y: 50 }}
                                transition={{ type: "spring", stiffness: 60, damping: 25 }}
                                animate={
                                    titleNumber === index
                                        ? {
                                            y: 0,
                                            opacity: 1,
                                        }
                                        : {
                                            y: titleNumber > index ? -50 : 50,
                                            opacity: 0,
                                        }
                                }
                            >
                                <span className="text-primary">{title}</span>
                            </motion.span>
                        ))}
                    </span>
                </div>
               <div className="flex justify-center items-center text-center">
                 <div className="mt-2">
                    <span className="block font-semibold tracking-[0.4em]">Stablecoins</span>
                </div>
               </div>
            </div>
        </h1>
        </div>
    );
}

export { HeroText };
