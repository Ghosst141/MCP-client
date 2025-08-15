import { useEffect, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const useChatModel = () => {
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        console.log(import.meta.env.VITE_GEMINI_KEY);
        
        const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_KEY);
        const chatModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        setModel(chatModel);
      } catch (err) {
        console.error("Model init failed:", err);
      }
    };

    init();
  }, []);

  return model;
};

export default useChatModel;
