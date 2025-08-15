const models = [
    {
        name: "ChatGPT",
        description: "OpenAI's conversational AI",
        icon: "⊗",
        llms: [
            { name: "gpt-5" },
            { name: "gpt-5-mini" },
            { name: "gpt-5-nano" },
            { name: "gpt-5-chat" },
            { name: "gpt-4.1" },
            { name: "gpt-4.1-mini" },
            { name: "gpt-4.1-nano" },
            { name: "gpt-4o" },
            { name: "gpt-4o-mini" },
            { name: "o3" },
            { name: "o3-mini" },
            { name: "o3-mini-high" },
            { name: "o3-pro" },
            { name: "o4-mini" },
            { name: "o4-mini-high" }
        ]
    },
    {
        name: "Gemini",
        description: "Google's AI model",
        icon: "💎",
        llms: [
            { name: "gemini-2.5-pro" },
            { name: "gemini-2.5-flash" },
            { name: "gemini-2.5-flash-lite" },
            { name: "gemini-live-2.5-flash-preview" },
            { name: "gemini-2.5-flash-preview-native-audio-dialog" },
            { name: "gemini-2.5-flash-exp-native-audio-thinking-dialog" },
            { name: "gemini-2.5-flash-preview-tts" },
            { name: "gemini-2.5-pro-preview-tts" },
            { name: "gemini-2.0-flash" },
            { name: "gemini-2.0-flash-lite" }
        ]
    },
    {
        name: "Claude",
        description: "Anthropic's AI assistant",
        icon: "🤖",
        llms: [
            { name: "claude-opus-4-1-20250805" },
            { name: "claude-opus-4-20250514" },
            { name: "claude-sonnet-4-20250514" },
            { name: "claude-3-7-sonnet-20250219" },
            { name: "claude-3-5-haiku-20241022" },
            { name: "claude-3-5-sonnet-20241022" },
            { name: "claude-3-haiku-20240307" }
        ]
    },
    {
        name: "DALL-E",
        description: "AI for generating images from text",
        icon: "🖼️",
        llms: [
            { name: "dall-e-2" },
            { name: "dall-e-3" }
        ]
    },
    {
        name: "Grok",
        description: "AI for code generation",
        icon: "🦙",
        llms: [
            { name: "grok-1" },
            { name: "grok-1.5" },
            { name: "grok-2" },
            { name: "grok-2-mini" },
            { name: "grok-3" },
            { name: "grok-3-mini" },
            { name: "grok-4" },
            { name: "grok-4-heavy" }
        ]
    }
]

export { models }

//     < div className = {`dropdown-item ${selectedModel === 'ChatGPT' ? 'selected' : ''}`} onClick = {() => handleModelSelect('ChatGPT')}>
//                             <div className="icon">⊗</div>
//                             <div className="details">
//                                 <div className="title">ChatGPT</div>
//                                 <div className="subtitle">OpenAI's conversational AI</div>
//                             </div>
// { selectedModel === 'ChatGPT' && <div className="checkmark">✔</div> }
//                         </div >

//                         <div className={`dropdown-item ${selectedModel === 'Gemini' ? 'selected' : ''}`} onClick={() => handleModelSelect('Gemini')}>
//                             <div className="icon">💎</div>
//                             <div className="details">
//                                 <div className="title">Gemini</div>
//                                 <div className="subtitle">Google's AI model</div>
//                             </div>
//                             {selectedModel === 'Gemini' && <div className="checkmark">✔</div>}
//                         </div>

//                         <div className={`dropdown-item ${selectedModel === 'Claude' ? 'selected' : ''}`} onClick={() => handleModelSelect('Claude')}>
//                             <div className="icon">🤖</div>
//                             <div className="details">
//                                 <div className="title">Claude</div>
//                                 <div className="subtitle">Anthropic's AI assistant</div>
//                             </div>
//                             {selectedModel === 'Claude' && <div className="checkmark">✔</div>}
//                         </div>

//                         <div className={`dropdown-item ${selectedModel === 'GPT-4' ? 'selected' : ''}`} onClick={() => handleModelSelect('GPT-4')}>
//                             <div className="icon sparkle">✨</div>
//                             <div className="details">
//                                 <div className="title">GPT-4</div>
//                                 <div className="subtitle">OpenAI's most advanced model</div>
//                             </div>
//                             {selectedModel === 'GPT-4' && <div className="checkmark">✔</div>}
//                         </div>