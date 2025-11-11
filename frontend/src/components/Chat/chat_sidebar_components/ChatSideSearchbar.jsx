import { useState, useEffect, useCallback, useMemo } from "react";
import React from "react";

const ChatSideSearchbar = React.memo(function ChatSideSearchbar({ value, onChange }) {
    const [localValue, setLocalValue] = useState(value);

    // Keep local value in sync when parent resets the search
    useEffect(() => {
        setLocalValue(value)
    }, [value])

    // Debounce the onChange calls
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localValue);
        }, 300)

        return () => clearTimeout(timer)
    }, [localValue, onChange])

    const handleClear = useCallback(() => {
        setLocalValue('')
        onChange('')
    }, [onChange])

    const searchIconClass = useMemo(() => {
        return `fa-solid fa-${localValue ? 'xmark' : 'magnifying-glass'}`
    }, [localValue])

    return (
        <section id="search-message">
            <div className="message-search-bar">
                <input 
                    type="text" 
                    placeholder="Search"
                    value={localValue}
                    onChange={(e) => setLocalValue(e.target.value)}
                />
                <button 
                    type="button"
                    onClick={localValue ? handleClear : undefined}
                    aria-label={localValue ? 'Clear Search' : 'Search Conversation'}
                >
                    <i className={searchIconClass}></i>
                </button>
            </div>
        </section>
    )
}) 

export default ChatSideSearchbar