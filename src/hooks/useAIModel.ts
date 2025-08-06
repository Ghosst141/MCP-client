import { useState, useEffect } from 'react';
import type { ModelName } from '../types';

export const useAIModel = () => {
    const [selectedModel, setSelectedModel] = useState<ModelName>('ChatGPT');
    const [apiKey, setApiKey] = useState<string>('');

    useEffect(() => {
        // Load selected model
        const savedModel = localStorage.getItem('selected_model') as ModelName;
        if (savedModel && ['ChatGPT', 'Gemini', 'Claude', 'GPT-4'].includes(savedModel)) {
            setSelectedModel(savedModel);
        }
    }, []);

    useEffect(() => {
        // Load API key for selected model
        const savedApiKey = localStorage.getItem(`${selectedModel.toLowerCase()}_api_key`);
        if (savedApiKey) {
            setApiKey(savedApiKey);
        } else {
            setApiKey('');
        }
    }, [selectedModel]);

    const getApiEndpoint = () => {
        switch (selectedModel) {
            case 'ChatGPT':
            case 'GPT-4':
                return 'https://api.openai.com/v1/chat/completions';
            case 'Gemini':
                return 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
            case 'Claude':
                return 'https://api.anthropic.com/v1/messages';
            default:
                return 'https://api.openai.com/v1/chat/completions';
        }
    };

    const getModelDisplayName = () => {
        return selectedModel;
    };

    const hasValidApiKey = () => {
        return apiKey.trim().length > 0;
    };

    return {
        selectedModel,
        apiKey,
        getApiEndpoint,
        getModelDisplayName,
        hasValidApiKey
    };
};
