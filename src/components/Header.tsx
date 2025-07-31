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
                    <span className="label-arrow"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="icon-sm text-token-text-tertiary"><path d="M12.1338 5.94433C12.3919 5.77382 12.7434 5.80202 12.9707 6.02929C13.1979 6.25656 13.2261 6.60807 13.0556 6.8662L12.9707 6.9707L8.47067 11.4707C8.21097 11.7304 7.78896 11.7304 7.52926 11.4707L3.02926 6.9707L2.9443 6.8662C2.77379 6.60807 2.80199 6.25656 3.02926 6.02929C3.25653 5.80202 3.60804 5.77382 3.86617 5.94433L3.97067 6.02929L7.99996 10.0586L12.0293 6.02929L12.1338 5.94433Z"></path></svg></span>
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
