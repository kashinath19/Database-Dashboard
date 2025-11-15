export const formatDate = (dateString) => {
<<<<<<< HEAD
  if (!dateString) return '-';
=======
  if (!dateString) return 'Not set';
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return 'Invalid date';
  }
};

export const formatDateTime = (dateString) => {
<<<<<<< HEAD
  if (!dateString) return '-';
=======
  if (!dateString) return 'Not set';
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Invalid date';
  }
};

export const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Never';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    
    return `${Math.floor(diffInDays / 365)} years ago`;
  } catch {
    return 'Invalid date';
  }
};

export const formatPhone = (phone) => {
<<<<<<< HEAD
  if (!phone) return '-';
=======
  if (!phone) return 'Not set';
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
  
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const formatExperience = (years) => {
  if (years === null || years === undefined) return 'Not specified';
  
  if (years < 1) {
    return '< 1 year';
  } else if (years === 1) {
    return '1 year';
  } else {
    return `${years} years`;
  }
};
<<<<<<< HEAD

// Helper function to get timestamp from any record
export const getTimestamp = (record) => {
  return record.created_at || record.timestamp || record.updated_at;
};
=======
>>>>>>> 5c418b98bde4e07846168aee8a9305902ee14b8a
