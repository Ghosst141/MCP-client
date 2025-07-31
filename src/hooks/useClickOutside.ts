import { useEffect, useRef } from "react";

const useClickOutside = (handler:() => void) => {
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                handler();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        // Cleanup function must be returned from useEffect itself
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return dropdownRef
};

export {useClickOutside}