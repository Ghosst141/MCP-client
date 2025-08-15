// import React from 'react'
import { useEffect, useRef } from 'react';
import type { ModelName } from '../types';
import HeaderSubDropdowns from './HeaderSubDropdowns';
import "./submenu.css"

function HeaderDropdowns({ model,
    selectedModel,
    handleModelSelect,
    isSubmenuOpen,
    onSubmenuToggle,
    selectedLLM,
    setSelectedLLM,
    setSubmenu }:
    {
        model: any;
        selectedModel: string;
        handleModelSelect: (model: ModelName) => void;
        isSubmenuOpen: boolean;
        onSubmenuToggle: () => void;
        selectedLLM: string | null;
        setSelectedLLM: (llmName: string | null) => void;
        setSubmenu: (index: number | null) => void;
    }) {

    const submenuRef = useRef<HTMLDivElement>(null);

    const handleCategoryClick = (name: any) => {
        onSubmenuToggle();
        handleModelSelect(name);
    };

    const handleLLMSelect = (llmName: string) => {
        setSelectedLLM(llmName);
        localStorage.setItem('selected_llm', llmName);
    };

    useEffect(() => {
        if (isSubmenuOpen && submenuRef.current) {
            // Find the dropdown container
            const dropdownContainer = submenuRef.current.closest('.dropdown');
            if (dropdownContainer) {
                // Scroll to show the submenu from the top
                const submenuRect = submenuRef.current.getBoundingClientRect();
                const containerRect = dropdownContainer.getBoundingClientRect();
                const containerScrollTop = dropdownContainer.scrollTop;

                // Calculate the position of submenu relative to container
                const submenuTopInContainer = submenuRect.top - containerRect.top + containerScrollTop;
                const submenuBottomInContainer = submenuTopInContainer + submenuRect.height;

                // If submenu is below visible area, scroll to show it from the top
                if (submenuBottomInContainer > dropdownContainer.clientHeight + containerScrollTop) {
                    // Scroll to show the submenu starting from its top, with some padding
                    dropdownContainer.scrollTo({
                        top: submenuTopInContainer - 10,
                        behavior: 'smooth'
                    });
                }
            }
        }
    }, [isSubmenuOpen]);

    return (
        <>
            <div className={`dropdown-item ${selectedModel === model.name ? 'selected' : ''}`} onClick={() => handleCategoryClick(model.name)}>
                <div className="icon">{model.icon}</div>
                <div className="details">
                    <div className="title">{model.name}</div>
                    <div className="subtitle">{model.description}</div>
                </div>
                {model.llms.length > 0 && <div className="submenu-indicator">
                    <svg className="w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24">
                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 9-7 7-7-7" />
                    </svg>
                </div>}
            </div>
            {
                isSubmenuOpen && (
                    <div className="dropdown-submenu" ref={submenuRef}>
                        {
                            model.llms.length > 0 && model.llms.map((llm: any, index: number) => (
                                <HeaderSubDropdowns
                                    key={index}
                                    name={llm.name}
                                    selectedLLM={selectedLLM}
                                    handleLLMSelect={handleLLMSelect}
                                    setSubmenu={setSubmenu}
                                />
                            ))
                        }

                    </div>
                )
            }
        </>
    )
}

export default HeaderDropdowns