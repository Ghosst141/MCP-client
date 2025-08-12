import { useEffect, useState } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';

const useChatModel = () => {
  const [model, setModel] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const genAI = new GoogleGenerativeAI("AIzaSyCnYkxiH4f9po-G9EQ7F6DxZH2CjT_ADHE");
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
