import React, { useEffect, useRef } from 'react';
import '../../styles/components.css';

const Terminal = ({ logs = [] }) => {
    const bottomRef = useRef(null);

    // Auto-scroll to bottom when logs change
    useEffect(() => {
        if (bottomRef.current) {
            bottomRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <div className="terminal-window">
            <div className="terminal-header">
                System Logs
            </div>

            <div className="terminal-body">
                {logs.map((log, index) => {
                    // Handle both string logs and object logs { message, timestamp }
                    const message = typeof log === 'string' ? log : log.message;
                    // If it's a string, we don't show a timestamp unless the string contains it.
                    // Ideally, parents should pass objects.
                    // For backward compatibility with existing string logs, we just show the message.
                    const timestamp = typeof log === 'object' && log.timestamp ? log.timestamp : null;

                    return (
                        <div key={index} className="terminal-log">
                            {timestamp && (
                                <span className="terminal-log-time">[{timestamp}]</span>
                            )}
                            <span>{message}</span>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
                
                <div className="terminal-prompt">
                    <span className="terminal-user">root@bio-van:~$</span> 
                    <span className="cursor-blink">_</span>
                </div>
            </div>
        </div>
    );
};

export default Terminal;
