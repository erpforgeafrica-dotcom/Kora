import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useKeyboardShortcut } from "@/hooks/useKeyboardShortcut";

interface Command {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  category?: string;
}

const defaultCommands: Command[] = [
  { id: "clients", label: "Go to Clients", icon: "👥", action: () => "/app/business-admin/clients", category: "Navigation" },
  { id: "bookings", label: "Go to Bookings", icon: "📅", action: () => "/app/business-admin/bookings", category: "Navigation" },
  { id: "services", label: "Go to Services", icon: "💼", action: () => "/app/business-admin/services", category: "Navigation" },
  { id: "staff", label: "Go to Staff", icon: "👔", action: () => "/app/business-admin/staff", category: "Navigation" },
  { id: "new-client", label: "New Client", icon: "➕", action: () => "/app/business-admin/clients/create", category: "Actions" },
  { id: "new-booking", label: "New Booking", icon: "➕", action: () => "/app/business-admin/bookings/create", category: "Actions" },
];

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useKeyboardShortcut([
    {
      key: "k",
      meta: true,
      callback: () => {
        setIsOpen(true);
        setSearch("");
        setSelectedIndex(0);
      },
    },
    {
      key: "Escape",
      callback: () => {
        if (isOpen) setIsOpen(false);
      },
    },
  ]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const openPalette = () => {
      setIsOpen(true);
      setSearch("");
      setSelectedIndex(0);
    };

    window.addEventListener("kora:open-command-palette", openPalette);
    return () => window.removeEventListener("kora:open-command-palette", openPalette);
  }, []);

  const filteredCommands = defaultCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (command: Command) => {
    const result = command.action();
    if (typeof result === "string") {
      navigate(result);
    }
    setIsOpen(false);
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === "Enter" && filteredCommands[selectedIndex]) {
      e.preventDefault();
      handleSelect(filteredCommands[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setIsOpen(false)} />
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50">
        <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <input
              ref={inputRef}
              type="text"
              placeholder="Type a command or search..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-white text-lg outline-none placeholder-gray-500"
            />
          </div>
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No commands found</div>
            ) : (
              filteredCommands.map((cmd, index) => (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  className={`w-full px-4 py-3 flex items-center gap-3 text-left transition-colors ${
                    index === selectedIndex
                      ? "bg-teal-500/20 text-teal-400"
                      : "text-gray-300 hover:bg-slate-700"
                  }`}
                >
                  {cmd.icon && <span className="text-xl">{cmd.icon}</span>}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{cmd.label}</div>
                    {cmd.category && (
                      <div className="text-xs text-gray-500">{cmd.category}</div>
                    )}
                  </div>
                  {index === selectedIndex && (
                    <span className="text-xs text-gray-500">↵</span>
                  )}
                </button>
              ))
            )}
          </div>
          <div className="p-3 border-t border-slate-700 flex items-center justify-between text-xs text-gray-500">
            <div className="flex gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
            <span>⌘K to open</span>
          </div>
        </div>
      </div>
    </>
  );
}
