import { useState, useRef, useEffect, type KeyboardEvent } from 'react';
import axios from 'axios';
import './ChatArea.css'
import Header from './Header';
import { useClickOutside } from '../hooks/useClickOutside';

interface Message {
  sender: 'user' | 'ai';
  text: string | string[];
}

export default function ChatArea() {
  const [selected, setSelected] = useState<string>('select');
  const [open, setOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);
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

  const handleSend = async (): Promise<void> => {
    if (!input.trim()) return;

    const userMessage: Message = { sender: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMessage]);

    const currentInput = input.trim();
    setInput('');
    setLoading(true);
    if (textareaRef.current) {
      textareaRef.current.innerHTML = '';
      textareaRef.current.innerText = '';
    }

    const apiUrl = 'http://localhost:3001/query';

    try {
      const response = await axios.post(apiUrl, {
        query: currentInput,
        mode: selected,
      });

      const responseText: string = (response.data as { content: string }).content;
      const points: string[] = responseText
        .split('\n')
        .filter(point => point.trim() !== '');

      const aiResponse: Message = { sender: 'ai', text: points };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error contacting backend:', error);
      const errorResponse: Message = {
        sender: 'ai',
        text: `Error: Failed to get response for ${selected} mode. Please check the console and try again.`,
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle paste events to strip formatting
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();

    // Get plain text from clipboard
    const text = e.clipboardData.getData('text/plain');

    // Insert plain text at cursor position
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));

      // Move cursor to end of inserted text
      range.setStartAfter(range.endContainer);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    // Update state
    if (textareaRef.current) {
      setInput(textareaRef.current.innerText);
    }
  };

  const handleFileChange = async () => { }

  return (
    <div className="chat-area">
      <div className='header-area'>
        <Header />
      </div>
      <div className='messages-body'>
        <div className="messages-container">
          {messages.length === 0 && (
            <div className="welcome-center">
              <h2>Welcome, User</h2>
              <p>Select a mode and ask me anything!</p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.sender === 'ai' && Array.isArray(msg.text) ? (
                <ul>
                  {msg.text.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              ) : (
                <span style={{whiteSpace:"pre-wrap"}}>{msg.text}</span>
              )}
            </div>
          ))}

          {loading && (
            <div className="message ai">
              <i>Typing...</i>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-wrapper">
        <div className="chat-input">
          <div className='chat-textarea-wrapper'>
            {(!input || input.trim() === '') && (
              <p className='placeholder'>
                Type your message here...
              </p>
            )}
            <div
              ref={textareaRef}
              className="chat-input-div"
              contentEditable
              onInput={e => {
                const element = e.target as HTMLDivElement;
                const text = element.innerText;
                
                // Check if the element is truly empty (no text content)
                if (text === '' || text === '\n') {
                  element.innerHTML = '';
                  setInput('');
                } else {
                  setInput(text);
                }
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              suppressContentEditableWarning={true}
              // data-placeholder={input ? '' : 'Type your message here...'}
            />
          </div>

          <div className='file-upload'>
            <div className='upload-handlers'>
              <label className="file-upload-button">
                <input type="file" onChange={handleFileChange} />
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="">
                  <path fill-rule="evenodd" clip-rule="evenodd" d="M9 7C9 4.23858 11.2386 2 14 2C16.7614 2 19 4.23858 19 7V15C19 18.866 15.866 22 12 22C8.13401 22 5 18.866 5 15V9C5 8.44772 5.44772 8 6 8C6.55228 8 7 8.44772 7 9V15C7 17.7614 9.23858 20 12 20C14.7614 20 17 17.7614 17 15V7C17 5.34315 15.6569 4 14 4C12.3431 4 11 5.34315 11 7V15C11 15.5523 11.4477 16 12 16C12.5523 16 13 15.5523 13 15V9C13 8.44772 13.4477 8 14 8C14.5523 8 15 8.44772 15 9V15C15 16.6569 13.6569 18 12 18C10.3431 18 9 16.6569 9 15V7Z" fill="currentColor"></path>
                </svg>
              </label>


              <div className="settings-dropdown-wrapper" ref={dropdownRef}>
                <button className="settings-btn" onClick={() => setOpen(!open)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-settings2 icon-md">
                    <path d="M20 7h-9"></path>
                    <path d="M14 17H5"></path>
                    <circle cx="17" cy="17" r="3"></circle><circle cx="7" cy="7" r="3"></circle>
                  </svg>
                </button>

                {open && (
                  <div className="dropdown-popup">
                    {options.map(opt => (
                      <div
                        key={opt}
                        className="dropdown-item"
                        onClick={() => {
                          setSelected(opt);
                          setOpen(false);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="chat-send">
              <div className='audio-input-icon'>
                <button className='audio-btn' onClick={() => alert('Audio input not implemented yet')}>
                  <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                    aria-label="" className="icon" font-size="inherit"><path d="M15.7806 10.1963C16.1326 10.3011 16.3336 10.6714 16.2288 11.0234L16.1487 11.2725C15.3429 13.6262 13.2236 15.3697 10.6644 15.6299L10.6653 16.835H12.0833L12.2171 16.8486C12.5202 16.9106 12.7484 17.1786 12.7484 17.5C12.7484 17.8214 12.5202 18.0894 12.2171 18.1514L12.0833 18.165H7.91632C7.5492 18.1649 7.25128 17.8672 7.25128 17.5C7.25128 17.1328 7.5492 16.8351 7.91632 16.835H9.33527L9.33429 15.6299C6.775 15.3697 4.6558 13.6262 3.84992 11.2725L3.76984 11.0234L3.74445 10.8906C3.71751 10.5825 3.91011 10.2879 4.21808 10.1963C4.52615 10.1047 4.84769 10.2466 4.99347 10.5195L5.04523 10.6436L5.10871 10.8418C5.8047 12.8745 7.73211 14.335 9.99933 14.335C12.3396 14.3349 14.3179 12.7789 14.9534 10.6436L15.0052 10.5195C15.151 10.2466 15.4725 10.1046 15.7806 10.1963ZM12.2513 5.41699C12.2513 4.17354 11.2437 3.16521 10.0003 3.16504C8.75675 3.16504 7.74835 4.17343 7.74835 5.41699V9.16699C7.74853 10.4104 8.75685 11.418 10.0003 11.418C11.2436 11.4178 12.2511 10.4103 12.2513 9.16699V5.41699ZM13.5814 9.16699C13.5812 11.1448 11.9781 12.7479 10.0003 12.748C8.02232 12.748 6.41845 11.1449 6.41828 9.16699V5.41699C6.41828 3.43889 8.02221 1.83496 10.0003 1.83496C11.9783 1.83514 13.5814 3.439 13.5814 5.41699V9.16699Z"></path></svg>
                </button>
              </div>
              <div className="chat-send-icon">
                <button
                  className="send-btn"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                >
                  <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg"
                    className="icon"><path d="M8.99992 16V6.41407L5.70696 9.70704C5.31643 10.0976 4.68342 10.0976 4.29289 9.70704C3.90237 9.31652 3.90237 8.6835 4.29289 8.29298L9.29289 3.29298L9.36907 3.22462C9.76184 2.90427 10.3408 2.92686 10.707 3.29298L15.707 8.29298L15.7753 8.36915C16.0957 8.76192 16.0731 9.34092 15.707 9.70704C15.3408 10.0732 14.7618 10.0958 14.3691 9.7754L14.2929 9.70704L10.9999 6.41407V16C10.9999 16.5523 10.5522 17 9.99992 17C9.44764 17 8.99992 16.5523 8.99992 16Z"></path></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
