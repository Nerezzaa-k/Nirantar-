import React, { createContext, useContext, useState } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      type: 'warning',
      title: 'High Risk Alert: Ramesh Kumar',
      message: 'Refill overdue by 18 days with rising blood pressure reading (158/98 mmHg).',
      time: '10 mins ago',
      read: false,
      priority: 'high'
    },
    {
      id: 'notif-2',
      type: 'info',
      title: 'New Check-In Received',
      message: 'Ramesh Kumar reported travel difficulty ("Road flooded"). Rescue intervention created.',
      time: '25 mins ago',
      read: false,
      priority: 'high'
    },
    {
      id: 'notif-3',
      type: 'success',
      title: 'Doorstep Refill Delivered',
      message: 'Kamla Devi received monthly Metformin supply during village VHND round.',
      time: '2 hours ago',
      read: true,
      priority: 'medium'
    },
    {
      id: 'notif-4',
      type: 'alert',
      title: 'Medicine Stock Alert: Rampur CHC',
      message: 'Telmisartan 40mg stock depleted. Alternate stock available at Kalyanpur PHC.',
      time: '1 day ago',
      read: true,
      priority: 'high'
    }
  ]);

  const showToast = (message, type = 'info', title = '') => {
    const id = Date.now().toString();
    const newToast = { id, message, type, title };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        showToast,
        markAllAsRead
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
