import React, { createContext, useState, type ReactNode} from 'react';

// 1. Define the context value type
type SideContextType = {
  isSideopen: boolean;
  setSideOpen: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebar: () => void;
  selectedChatId: number | null;
  setSelectedChatId: React.Dispatch<React.SetStateAction<number | null>>;
};

// 2. Create the context with initial value as undefined
const SideContext = createContext<SideContextType | undefined>(undefined);

// 3. Define props type
type SidebarProviderProps = {
  children: ReactNode;
};

// 4. Provider component
function SidebarContext({ children }: SidebarProviderProps) {
  const [isSideopen, setSideOpen] = useState(true);
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);


  const toggleSidebar=():void=>{
    setSideOpen(!isSideopen)
  }

  return (
    <SideContext.Provider value={{ isSideopen, setSideOpen ,toggleSidebar,selectedChatId,setSelectedChatId}}>
      {children}
    </SideContext.Provider>
  );
}


export default SidebarContext;
export {SideContext}
