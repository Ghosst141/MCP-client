import { useContext, useState, useEffect, useCallback } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import './Header.css';
import { SideContext } from '../contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';
import type { ModelName } from '../types';

const Header = () => {
    const [open, setOpen] = useState(false);
    const [showAPIInput, setShowAPIInput] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [tempApiKey, setTempApiKey] = useState("");
    const [selectedModel, setSelectedModel] = useState<ModelName>("ChatGPT");
    const [keyError, setKeyError] = useState<boolean>(false);

    const dropdownRef = useClickOutside(() => setOpen(false));
    const context = useContext(SideContext);
    if (!context) throw new Error("SidebarContext is undefined");
    const { isSideopen, toggleSidebar, setSelectedChatId } = context;

    const { theme, toggleTheme } = useTheme();

    const Navigate = useNavigate();

    // Load API key and selected model from localStorage on component mount
    useEffect(() => {
        const savedModel = localStorage.getItem('selected_model') as ModelName;
        if (savedModel && ['ChatGPT', 'Gemini', 'Claude', 'GPT-4'].includes(savedModel)) {
            setSelectedModel(savedModel);
        }
    }, []);

    // Load API key when selected model changes
    useEffect(() => {
        const savedApiKey = localStorage.getItem(`${selectedModel.toLowerCase()}_api_key`);
        if (savedApiKey) {
            setApiKey(savedApiKey);
        } else {
            setApiKey("");
        }
    }, [selectedModel]);

    const handleAPIKeySubmit = useCallback(() => {
        if (tempApiKey.trim()) {
            setApiKey(tempApiKey.trim());
            localStorage.setItem(`${selectedModel.toLowerCase()}_api_key`, tempApiKey.trim());
            setShowAPIInput(false);
            setTempApiKey("");
            setOpen(false);
        }
        else {
            setKeyError(true);
        }
    }, [tempApiKey, selectedModel]);

    const handleAPIKeyCancel = useCallback(() => {
        setShowAPIInput(false);
        setTempApiKey("");
    }, []);

    // Handle keyboard events for API key modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showAPIInput) {
                if (e.key === 'Escape') {
                    handleAPIKeyCancel();
                } else if (e.key === 'Enter') {
                    handleAPIKeySubmit();
                }
            }
        };

        if (showAPIInput) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showAPIInput, handleAPIKeyCancel, handleAPIKeySubmit]);

    const handleSetAPIKey = () => {
        setShowAPIInput(true);
        setTempApiKey(apiKey);
        setOpen(false);
    };

    const handleModelSelect = (modelName: ModelName) => {
        setSelectedModel(modelName);
        localStorage.setItem('selected_model', modelName);
        // setOpen(false);
    };

    return (
        <div className="header">
            {!isSideopen && <div className="sidebar-btns">
                {/* The onClick handler now calls the onToggle function from props */}
                <button className="sidebar-header-btn" onClick={toggleSidebar}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                        className="max-md:hidden"><path fill-rule="evenodd" clip-rule="evenodd"
                            d="M8.85719 3H15.1428C16.2266 2.99999 17.1007 2.99998 17.8086 3.05782C18.5375 3.11737 19.1777 3.24318 19.77 3.54497C20.7108 4.02433 21.4757 4.78924 21.955 5.73005C22.2568 6.32234 22.3826 6.96253 22.4422 7.69138C22.5 8.39925 22.5 9.27339 22.5 10.3572V13.6428C22.5 14.7266 22.5 15.6008 22.4422 16.3086C22.3826 17.0375 22.2568 17.6777 21.955 18.27C21.4757 19.2108 20.7108 19.9757 19.77 20.455C19.1777 20.7568 18.5375 20.8826 17.8086 20.9422C17.1008 21 16.2266 21 15.1428 21H8.85717C7.77339 21 6.89925 21 6.19138 20.9422C5.46253 20.8826 4.82234 20.7568 4.23005 20.455C3.28924 19.9757 2.52433 19.2108 2.04497 18.27C1.74318 17.6777 1.61737 17.0375 1.55782 16.3086C1.49998 15.6007 1.49999 14.7266 1.5 13.6428V10.3572C1.49999 9.27341 1.49998 8.39926 1.55782 7.69138C1.61737 6.96253 1.74318 6.32234 2.04497 5.73005C2.52433 4.78924 3.28924 4.02433 4.23005 3.54497C4.82234 3.24318 5.46253 3.11737 6.19138 3.05782C6.89926 2.99998 7.77341 2.99999 8.85719 3ZM6.35424 5.05118C5.74907 5.10062 5.40138 5.19279 5.13803 5.32698C4.57354 5.6146 4.1146 6.07354 3.82698 6.63803C3.69279 6.90138 3.60062 7.24907 3.55118 7.85424C3.50078 8.47108 3.5 9.26339 3.5 10.4V13.6C3.5 14.7366 3.50078 15.5289 3.55118 16.1458C3.60062 16.7509 3.69279 17.0986 3.82698 17.362C4.1146 17.9265 4.57354 18.3854 5.13803 18.673C5.40138 18.8072 5.74907 18.8994 6.35424 18.9488C6.97108 18.9992 7.76339 19 8.9 19H9.5V5H8.9C7.76339 5 6.97108 5.00078 6.35424 5.05118ZM11.5 5V19H15.1C16.2366 19 17.0289 18.9992 17.6458 18.9488C18.2509 18.8994 18.5986 18.8072 18.862 18.673C19.4265 18.3854 19.8854 17.9265 20.173 17.362C20.3072 17.0986 20.3994 16.7509 20.4488 16.1458C20.4992 15.5289 20.5 14.7366 20.5 13.6V10.4C20.5 9.26339 20.4992 8.47108 20.4488 7.85424C20.3994 7.24907 20.3072 6.90138 20.173 6.63803C19.8854 6.07354 19.4265 5.6146 18.862 5.32698C18.5986 5.19279 18.2509 5.10062 17.6458 5.05118C17.0289 5.00078 16.2366 5 15.1 5H11.5ZM5 8.5C5 7.94772 5.44772 7.5 6 7.5H7C7.55229 7.5 8 7.94772 8 8.5C8 9.05229 7.55229 9.5 7 9.5H6C5.44772 9.5 5 9.05229 5 8.5ZM5 12C5 11.4477 5.44772 11 6 11H7C7.55229 11 8 11.4477 8 12C8 12.5523 7.55229 13 7 13H6C5.44772 13 5 12.5523 5 12Z" fill="currentColor"></path></svg>
                </button>

                <button className="sidebar-header-btn" onClick={() => { Navigate("/"); setSelectedChatId(null) }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black dark:text-white icon-md md:h-6 md:w-6" aria-hidden="true"><path fillRule="evenodd" clipRule="evenodd" d="M16.7929 2.79289C18.0118 1.57394 19.9882 1.57394 21.2071 2.79289C22.4261 4.01184 22.4261 5.98815 21.2071 7.20711L12.7071 15.7071C12.5196 15.8946 12.2652 16 12 16H9C8.44772 16 8 15.5523 8 15V12C8 11.7348 8.10536 11.4804 8.29289 11.2929L16.7929 2.79289ZM19.7929 4.20711C19.355 3.7692 18.645 3.7692 18.2071 4.2071L10 12.4142V14H11.5858L19.7929 5.79289C20.2308 5.35499 20.2308 4.64501 19.7929 4.20711ZM6 5C5.44772 5 5 5.44771 5 6V18C5 18.5523 5.44772 19 6 19H18C18.5523 19 19 18.5523 19 18V14C19 13.4477 19.4477 13 20 13C20.5523 13 21 13.4477 21 14V18C21 19.6569 19.6569 21 18 21H6C4.34315 21 3 19.6569 3 18V6C3 4.34314 4.34315 3 6 3H10C10.5523 3 11 3.44771 11 4C11 4.55228 10.5523 5 10 5H6Z" fill="currentColor"></path></svg>
                </button>

                {/* Theme Toggle Button */}
            </div>}
            

            <div className='header-dropdown' ref={dropdownRef}>
                <button className="header-label" onClick={() => { setOpen(!open); setKeyError(false) }}>
                    <span className="label-text">{selectedModel}</span>
                    <span className="label-arrow"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="icon-sm text-token-text-tertiary"><path d="M12.1338 5.94433C12.3919 5.77382 12.7434 5.80202 12.9707 6.02929C13.1979 6.25656 13.2261 6.60807 13.0556 6.8662L12.9707 6.9707L8.47067 11.4707C8.21097 11.7304 7.78896 11.7304 7.52926 11.4707L3.02926 6.9707L2.9443 6.8662C2.77379 6.60807 2.80199 6.25656 3.02926 6.02929C3.25653 5.80202 3.60804 5.77382 3.86617 5.94433L3.97067 6.02929L7.99996 10.0586L12.0293 6.02929L12.1338 5.94433Z"></path></svg></span>
                </button>

                {open && (
                    <div className="dropdown">
                        <div className="dropdown-item" onClick={handleSetAPIKey}>
                            <div className="icon">🔑</div>
                            <div className="details">
                                <div className="title">Set API Key</div>
                                <div className="subtitle">
                                    {apiKey
                                        ? `API key configured for ${selectedModel}`
                                        : `Configure API key for ${selectedModel}`
                                    }
                                </div>
                            </div>
                            {apiKey && <div className="checkmark">✔</div>}
                        </div>

                        <div className="dropdown-separator"></div>

                        <div className={`dropdown-item ${selectedModel === 'ChatGPT' ? 'selected' : ''}`} onClick={() => handleModelSelect('ChatGPT')}>
                            <div className="icon">⊗</div>
                            <div className="details">
                                <div className="title">ChatGPT</div>
                                <div className="subtitle">OpenAI's conversational AI</div>
                            </div>
                            {selectedModel === 'ChatGPT' && <div className="checkmark">✔</div>}
                        </div>

                        <div className={`dropdown-item ${selectedModel === 'Gemini' ? 'selected' : ''}`} onClick={() => handleModelSelect('Gemini')}>
                            <div className="icon">💎</div>
                            <div className="details">
                                <div className="title">Gemini</div>
                                <div className="subtitle">Google's AI model</div>
                            </div>
                            {selectedModel === 'Gemini' && <div className="checkmark">✔</div>}
                        </div>

                        <div className={`dropdown-item ${selectedModel === 'Claude' ? 'selected' : ''}`} onClick={() => handleModelSelect('Claude')}>
                            <div className="icon">🤖</div>
                            <div className="details">
                                <div className="title">Claude</div>
                                <div className="subtitle">Anthropic's AI assistant</div>
                            </div>
                            {selectedModel === 'Claude' && <div className="checkmark">✔</div>}
                        </div>

                        <div className={`dropdown-item ${selectedModel === 'GPT-4' ? 'selected' : ''}`} onClick={() => handleModelSelect('GPT-4')}>
                            <div className="icon sparkle">✨</div>
                            <div className="details">
                                <div className="title">GPT-4</div>
                                <div className="subtitle">OpenAI's most advanced model</div>
                            </div>
                            {selectedModel === 'GPT-4' && <div className="checkmark">✔</div>}
                        </div>
                    </div>
                )}
            </div>

            <button className="sidebar-header-btn theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 3V4M12 20V21M4 12H3M6.31412 6.31412L5.5 5.5M17.6859 6.31412L18.5 5.5M6.31412 17.69L5.5 18.5M17.6859 17.69L18.5 18.5M21 12H20M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                )}
            </button>

            {/* API Key Input Modal */}
            {showAPIInput && (
                <div className="api-key-overlay">
                    <div className="api-key-modal">
                        <h3>Set {selectedModel} API Key</h3>
                        <p>Enter your API key for {selectedModel} to enable chat functionality</p>
                        {
                            keyError && (<p className='error-key'>Please Enter Api key before submit</p>)
                        }

                        <input
                            type="password"
                            value={tempApiKey}
                            onChange={(e) => { setTempApiKey(e.target.value); setKeyError(false); }}
                            placeholder={
                                selectedModel === 'ChatGPT' || selectedModel === 'GPT-4' ? 'sk-...' :
                                    selectedModel === 'Gemini' ? 'AI...' :
                                        selectedModel === 'Claude' ? 'sk-ant-...' :
                                            'Enter API key...'
                            }
                            className="api-key-input"
                            autoFocus
                        />
                        <div className="api-key-buttons">
                            <button onClick={handleAPIKeyCancel} className="cancel-btn">
                                Cancel
                            </button>
                            <button onClick={handleAPIKeySubmit} className="save-btn">
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Header;
