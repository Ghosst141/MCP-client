// import React from 'react'

function HeaderSubDropdowns({ name, selectedLLM, handleLLMSelect, setSubmenu }:
    { name: string; selectedLLM: string | null; handleLLMSelect: (llmName: string) => void; setSubmenu: (index: number | null) => void; }) {
    return (<>
        <div className={`sub-dropdown-item ${selectedLLM === name ? 'selected' : ''}`} onClick={() => { setSubmenu(null); handleLLMSelect(name) }}>
            <div className="details">
                <div className="title">{name}</div>
            </div>
        </div>
    </>
    )
}

export default HeaderSubDropdowns