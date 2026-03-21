// Image Export Utility
// Provides shared functionality to export page sections as PNG images using html2canvas

(function () {
  'use strict';

  /**
   * Exports a DOM element as a PNG image
   * @param {HTMLElement} element - The DOM element to capture
   * @param {string} filename - The filename for the downloaded PNG (without extension)
   * @param {Object} options - Optional configuration for html2canvas and export
   * @param {function} onStart - Optional callback when export starts
   * @param {function} onSuccess - Optional callback when export succeeds
   * @param {function} onError - Optional callback when export fails
   * @returns {Promise<void>}
   */
  async function exportAsImage(element, filename, options = {}, onStart, onSuccess, onError) {
    if (!element) {
      const error = new Error('No element provided for export');
      if (onError) onError(error);
      return Promise.reject(error);
    }

    if (typeof html2canvas === 'undefined') {
      const error = new Error('html2canvas library not loaded');
      if (onError) onError(error);
      return Promise.reject(error);
    }

    // Notify start
    if (onStart) onStart();

    try {
      // Default html2canvas options
      const canvasOptions = {
        backgroundColor: null,
        scale: 2, // Higher quality export
        useCORS: true,
        allowTaint: false,
        logging: false,
        ...options.canvasOptions,
      };

      // Capture the element as canvas
      const canvas = await html2canvas(element, canvasOptions);

      // Convert canvas to blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create image blob'));
            }
          },
          'image/png',
          1.0
        );
      });

      // Create download link and trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename || 'export'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the object URL after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 100);

      // Notify success
      if (onSuccess) onSuccess();
    } catch (error) {
      if (onError) onError(error);
      throw error;
    }
  }

  /**
   * Helper function to generate a timestamp-based filename
   * @param {string} prefix - Prefix for the filename (e.g., 'optimizer', 'calculator')
   * @returns {string} - Filename with timestamp
   */
  function generateFilename(prefix) {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[:.]/g, '-')
      .split('T')
      .join('_')
      .split('.')[0];
    return `${prefix}_${timestamp}`;
  }

  /**
   * Convenience function for exporting with common UI feedback patterns
   * @param {HTMLElement} element - The DOM element to capture
   * @param {string} prefix - Filename prefix (e.g., 'optimizer', 'calculator')
   * @param {HTMLElement} button - Optional button element to show loading state
   * @param {Object} options - Optional configuration
   * @returns {Promise<void>}
   */
  async function exportWithFeedback(element, prefix, button, options = {}) {
    const originalText = button ? button.textContent : '';
    const originalDisabled = button ? button.disabled : false;

    return exportAsImage(
      element,
      generateFilename(prefix),
      options,
      // onStart
      () => {
        if (button) {
          button.textContent = options.loadingText || 'Exporting...';
          button.disabled = true;
        }
      },
      // onSuccess
      () => {
        if (button) {
          button.textContent = options.successText || 'Downloaded!';
          setTimeout(() => {
            button.textContent = originalText;
            button.disabled = originalDisabled;
          }, 2000);
        }
      },
      // onError
      (error) => {
        if (button) {
          button.textContent = options.errorText || 'Export failed';
          button.disabled = originalDisabled;
          setTimeout(() => {
            button.textContent = originalText;
          }, 3000);
        }
      }
    );
  }

  // Expose functions globally
  window.ExportImage = {
    exportAsImage,
    generateFilename,
    exportWithFeedback,
  };
})();
