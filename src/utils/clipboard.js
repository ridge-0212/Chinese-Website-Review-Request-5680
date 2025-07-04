import toast from 'react-hot-toast';

export const copyToClipboard = async (text, successMessage = '已复制到剪贴板！') => {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      // 旧浏览器的备用方案
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    toast.success(successMessage);
    return true;
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    toast.error('复制到剪贴板失败');
    return false;
  }
};

export const copyPrompt = (prompt) => {
  const text = typeof prompt === 'string' ? prompt : prompt.text;
  return copyToClipboard(text, '提示词已复制到剪贴板！');
};

export const copyDescription = (description) => {
  return copyToClipboard(description, '描述已复制到剪贴板！');
};