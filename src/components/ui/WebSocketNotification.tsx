import React, { useState, useEffect } from 'react';
import { useAIWebSocket } from '../../context/AIWebSocketContext';

interface NotificationProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'processing';
  title: string;
  message: string;
  onClose: (id: string) => void;
}

const NotificationItem: React.FC<NotificationProps> = ({ id, type, title, message, onClose }) => {
  useEffect(() => {
    // Auto-close timer - longer for success messages, shorter for processing
    const duration = type === 'success' ? 7000 : type === 'processing' ? 10000 : 5000;
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, onClose, type]);

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800 shadow-green-100';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800 shadow-red-100';
      case 'processing':
        return 'bg-blue-50 border-blue-200 text-blue-800 shadow-blue-100';
      case 'info':
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800 shadow-gray-100';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className={`w-80 max-w-sm border rounded-lg p-4 shadow-xl backdrop-blur-sm transform transition-all duration-300 ease-in-out animate-slide-in-right ${getTypeStyles()}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{title}</p>
          <p className="mt-1 text-xs opacity-90 leading-relaxed">{message}</p>
          {type === 'processing' && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-blue-500 h-1.5 rounded-full animate-pulse transition-all duration-1000" style={{width: '60%'}}></div>
              </div>
            </div>
          )}
        </div>
        <div className="ml-3 flex-shrink-0">
          <button
            className="inline-flex rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 p-1 transition-all duration-200"
            onClick={() => onClose(id)}
            aria-label="Close notification"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'processing';
  title: string;
  message: string;
}

const WebSocketNotifications: React.FC = () => {
  const { searchResponse } = useAIWebSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastStatus, setLastStatus] = useState<string>('idle');
  const [lastResponseTime, setLastResponseTime] = useState<number>(0);

  useEffect(() => {
    // Only show notifications for actual query responses, not initial state
    const currentTime = Date.now();
    
    // Skip if this is the initial state or if we've already processed this response
    if (searchResponse.status === 'idle' || 
        (searchResponse.status === lastStatus && currentTime - lastResponseTime < 1000)) {
      return;
    }

    // Handle search response status changes
    switch (searchResponse.status) {
      case 'processing':
        addNotification({
          type: 'processing',
          title: 'Processing Query',
          message: 'AI Assistant is processing your search request...'
        });
        break;
      
      case 'completed':
        const resultCount = searchResponse.stockResults.length;
        const hasError = searchResponse.errorMessage && searchResponse.errorMessage.trim() !== "";
        
        if (resultCount > 0) {
          addNotification({
            type: 'success',
            title: 'Search Completed ✨',
            message: `Found ${resultCount} result${resultCount !== 1 ? 's' : ''} matching your query`
          });
        } else if (hasError) {
          // If there's an error message but status is completed, show it as info
          addNotification({
            type: 'info',
            title: 'Search Completed',
            message: searchResponse.errorMessage
          });
        } else {
          addNotification({
            type: 'info',
            title: 'Search Completed',
            message: 'No specific stock results found for your query'
          });
        }
        break;
      
      case 'error':
        addNotification({
          type: 'error',
          title: 'Search Failed',
          message: searchResponse.errorMessage || 'Failed to process your search request'
        });
        break;
    }
    
    setLastStatus(searchResponse.status);
    setLastResponseTime(currentTime);
  }, [searchResponse.status, searchResponse.stockResults.length, searchResponse.errorMessage, lastStatus, lastResponseTime]);

  const addNotification = (notification: Omit<Notification, 'id'>) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Don't render if no notifications
  if (notifications.length === 0) {
    return null;
  }

  return (
    <>
      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
      
      {/* Notification Portal */}
      <div 
        className="fixed inset-0 pointer-events-none z-[9999]"
        style={{ zIndex: 9999 }}
      >
        <div className="absolute top-4 right-4 space-y-3 pointer-events-none max-h-screen overflow-hidden">
          {notifications.map((notification, index) => (
            <div 
              key={notification.id} 
              className="pointer-events-auto"
              style={{
                transform: `translateY(${index * 4}px)`,
                zIndex: 9999 - index
              }}
            >
              <NotificationItem
                {...notification}
                onClose={removeNotification}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default WebSocketNotifications;