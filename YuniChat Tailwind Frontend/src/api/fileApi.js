import axiosClient from './axiosClient';

const fileApi = {
  // Upload file
  uploadFile: (file, category = 'CHAT_ATTACHMENT', onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    // Chat attachments should be public so anyone in the chat can view them
    formData.append('isPublic', 'true');

    return axiosClient.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  // Upload multiple files
  uploadFiles: (files, onUploadProgress) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    return axiosClient.post('/files/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  // Download file
  downloadFile: (fileId) => {
    return axiosClient.get(`/files/download/${fileId}`, {
      responseType: 'blob',
    });
  },

  // Get file metadata
  getFileMetadata: (fileId) => {
    return axiosClient.get(`/files/${fileId}`);
  },

  // Get file URL
  getFileUrl: (fileId) => {
    return axiosClient.get(`/files/${fileId}/url`);
  },

  // Delete file
  deleteFile: (fileId) => {
    return axiosClient.delete(`/files/${fileId}`);
  },

  // Get user's files
  getUserFiles: (userId, page = 0, size = 20) => {
    return axiosClient.get(`/files/user/${userId}`, {
      params: { page, size },
    });
  },

  // Search files
  searchFiles: (query) => {
    return axiosClient.get('/files/search', {
      params: { query },
    });
  },

  // Get file preview (for images)
  getFilePreview: (fileId) => {
    return axiosClient.get(`/files/${fileId}/preview`, {
      responseType: 'blob',
    });
  },
};

export default fileApi;
