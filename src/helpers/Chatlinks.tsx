// import React from 'react'
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import type { ChatlinksProps } from '../types';
import './Chatlinks.css'

function Chatlinks({ id, title, selected, onSelect, onDelete }: ChatlinksProps) {

    const Navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLDivElement>(null);

    const handleTitleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        Navigate(`/chat/${id}`);
        onSelect();
    }

    const handleDropdownToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDropdownOpen(prev => !prev);
    }

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${title}" chat?`)) {
            onDelete(id);
            if(selected){
                Navigate("/")
            }
        }
        setIsDropdownOpen(false);
    }

    useEffect(() => {
        if (isDropdownOpen && buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const dropdownHeight = 80; // approximate height of dropdown
            
            // Check if there's enough space below
            const spaceBelow = windowHeight - buttonRect.bottom;
            
            if (spaceBelow < dropdownHeight) {
                setDropdownPosition('top');
            } else {
                setDropdownPosition('bottom');
            }
        }
    }, [isDropdownOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current && 
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <div className={`chat-links ${selected ? 'selected' : ''}`}>
            <div className='chat-title' onClick={handleTitleClick}><span>{title}</span></div>
            <div className='chat-link-btn' ref={buttonRef} onClick={handleDropdownToggle}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="icon" aria-hidden="true">
                    <path d="M15.498 8.50159C16.3254 8.50159 16.9959 9.17228 16.9961 9.99963C16.9961 10.8271 16.3256 11.4987 15.498 11.4987C14.6705 11.4987 14 10.8271 14 9.99963C14.0002 9.17228 14.6706 8.50159 15.498 8.50159Z"></path>
                    <path d="M4.49805 8.50159C5.32544 8.50159 5.99689 9.17228 5.99707 9.99963C5.99707 10.8271 5.32555 11.4987 4.49805 11.4987C3.67069 11.4985 3 10.827 3 9.99963C3.00018 9.17239 3.6708 8.50176 4.49805 8.50159Z"></path>
                    <path d="M10.0003 8.50159C10.8276 8.50176 11.4982 9.17239 11.4984 9.99963C11.4984 10.827 10.8277 11.4985 10.0003 11.4987C9.17283 11.4987 8.50131 10.8271 8.50131 9.99963C8.50149 9.17228 9.17294 8.50159 10.0003 8.50159Z"></path>
                </svg>
                
                {isDropdownOpen && (
                    <div ref={dropdownRef} className={`chat-dropdown ${dropdownPosition}`}>
                        <div className="dropdown-item-btn" onClick={handleDelete}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            Delete chat
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}


export default Chatlinks;