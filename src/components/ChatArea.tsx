import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import './ChatArea.css'
import Header from './Header';
import { useClickOutside } from '../hooks/useClickOutside';
import { useChat } from '../hooks/useChat';
import MessageList from '../helpers/MessageList';
import InputArea from '../helpers/InputArea';


export default function ChatArea() {

  const { input, setInput, messages, loading, mcpOption, setMcpOption, handleSend, handlePaste,
    attachedFiles, removeAttachedFile,handleFileUpload } = useChat();
  const [open, setOpen] = useState<boolean>(false);
  const textareaRef = useRef<HTMLDivElement | null>(null);

  const options: string[] = ['Job Portal', 'Normal'];
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const dropdownRef = useClickOutside(() => setOpen(false));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto'; // reset first
      textarea.style.height = `${textarea.scrollHeight}px`; // then set to scrollHeight
    }
  }, [input]);


  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(textareaRef);
    }
  };

  // Handle paste events to strip formatting
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;

    if (files && files.length > 0) {
      await handleFileUpload(files);
    }
    // Reset the input so the same file can be selected again
    event.target.value = '';
  };


  return (
    <div className="chat-area">
      <div className='header-area'>
        <Header />
      </div>
      <div className='messages-body'>
        <MessageList messages={messages} loading={loading} messagesEndRef={messagesEndRef} />
      </div>

      <div className="input-wrapper">
        <InputArea
          input={input}
          setInput={setInput}
          textareaRef={textareaRef}
          handleKeyDown={handleKeyDown}
          handlePaste={(e) => handlePaste(e, textareaRef)}
          loading={loading}
          handleSend={handleSend}
          mcpOption={mcpOption}
          setMcpOption={setMcpOption}
          options={options}
          open={open}
          setOpen={setOpen}
          dropdownRef={dropdownRef}
          attachedFiles={attachedFiles}
          removeAttachedFile={removeAttachedFile}
          handleFileChange={handleFileChange}
        />
      </div>
    </div>

  );
}
