import axios from 'axios';

export const sendMessage = (baseUrl, data) => 
    axios.post(`${baseUrl}/messages`, data)

export const editMessage = (baseUrl, messageId, data) =>
    axios.patch(`${baseUrl}/messages/${messageId}`, data)

export const deleteMessage = (baseUrl, messageId) => 
    axios.delete(`${baseUrl}/messages/${messageId}`);