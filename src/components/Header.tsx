import { useState } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import './Header.css';

const Header = () => {
    const [open, setOpen] = useState(false);
    const dropdownRef = useClickOutside(() => setOpen(false));


    return (
        <div className="header">
            <div className='header-dropdown' ref={dropdownRef}>
                <button className="header-label" onClick={() => setOpen(!open)}>
                    <span className="label-text">ChatGPT</span>
                    <span className="label-arrow">▼</span>
                </button>

                {open && (
                    <div className="dropdown">
                        <div className="dropdown-item" onClick={() => { setOpen(false) }}>
                            <div className="icon sparkle">✨</div>
                            <div className="details">
                                <div className="title">ChatGPT Plus</div>
                                <div className="subtitle">Our smartest model & more</div>
                            </div>
                            <button className="upgrade-btn">Upgrade</button>
                        </div>

                        <div className="dropdown-item selected" onClick={() => { setOpen(false) }}>
                            <div className="icon">⊗</div>
                            <div className="details">
                                <div className="title">ChatGPT</div>
                                <div className="subtitle">Great for everyday tasks</div>
                            </div>
                            <div className="checkmark">✔</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;
