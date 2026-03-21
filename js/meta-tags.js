// Meta Tags Utility
// Provides shared functionality to dynamically update OpenGraph and Twitter meta tags
// for rich social media previews when sharing tool results

(function () {
  'use strict';

  /**
   * Updates or creates a meta tag with the specified property/name and content
   * @param {string} selector - Meta tag selector (property or name)
   * @param {string} content - The content value for the meta tag
   * @param {boolean} isProperty - Whether to use property attribute (true) or name attribute (false)
   */
  function updateMetaTag(selector, content, isProperty = true) {
    const attribute = isProperty ? 'property' : 'name';
    let metaTag = document.querySelector(`meta[${attribute}="${selector}"]`);

    if (metaTag) {
      metaTag.setAttribute('content', content);
    } else {
      // Create the meta tag if it doesn't exist
      metaTag = document.createElement('meta');
      metaTag.setAttribute(attribute, selector);
      metaTag.setAttribute('content', content);
      document.head.appendChild(metaTag);
    }
  }

  /**
   * Updates OpenGraph and Twitter meta tags for a shared page
   * @param {Object} config - Configuration object for meta tags
   * @param {string} config.title - Page title for social sharing
   * @param {string} config.description - Page description for social sharing
   * @param {string} [config.url] - Canonical URL (defaults to current URL)
   * @param {string} [config.image] - Image URL for social preview (optional)
   * @param {string} [config.imageAlt] - Alt text for the image (optional)
   */
  function updateShareMetaTags(config) {
    if (!config || !config.title || !config.description) {
      console.warn('MetaTags: title and description are required');
      return;
    }

    const {
      title,
      description,
      url = window.location.href,
      image,
      imageAlt,
    } = config;

    // Update document title
    document.title = title;

    // Update standard meta description
    updateMetaTag('description', description, false);

    // Update OpenGraph tags
    updateMetaTag('og:title', title);
    updateMetaTag('og:description', description);
    updateMetaTag('og:url', url);

    if (image) {
      updateMetaTag('og:image', image);
      if (imageAlt) {
        updateMetaTag('og:image:alt', imageAlt);
      }
    }

    // Update Twitter Card tags
    updateMetaTag('twitter:title', title, false);
    updateMetaTag('twitter:description', description, false);

    if (image) {
      updateMetaTag('twitter:image', image, false);
      if (imageAlt) {
        updateMetaTag('twitter:image:alt', imageAlt, false);
      }
    }
  }

  /**
   * Resets meta tags to their default values
   * @param {Object} defaults - Default meta tag values
   * @param {string} defaults.title - Default page title
   * @param {string} defaults.description - Default page description
   * @param {string} defaults.url - Default canonical URL
   * @param {string} [defaults.image] - Default image URL
   * @param {string} [defaults.imageAlt] - Default image alt text
   */
  function resetMetaTags(defaults) {
    if (defaults) {
      updateShareMetaTags(defaults);
    }
  }

  /**
   * Generates a shareable meta tag configuration for optimizer results
   * @param {Object} buildData - Build optimization data
   * @param {number} buildData.totalCost - Total skill cost
   * @param {number} buildData.skillCount - Number of skills selected
   * @param {string} [buildData.mode] - Optimization mode (e.g., 'speed', 'stamina')
   * @returns {Object} - Meta tag configuration object
   */
  function generateOptimizerMeta(buildData) {
    const skillCount = buildData.skillCount || 0;
    const totalCost = buildData.totalCost || 0;
    const mode = buildData.mode || 'custom';

    const title = `UmaTools - Skill Build (${skillCount} skills, ${totalCost} pts)`;
    const description = `Optimized Uma Musume skill build: ${skillCount} skills with ${totalCost} skill points. Mode: ${mode}. View and customize this build on UmaTools.`;

    return {
      title,
      description,
      url: window.location.href,
    };
  }

  /**
   * Generates a shareable meta tag configuration for calculator results
   * @param {Object} ratingData - Rating calculation data
   * @param {number} [ratingData.totalRating] - Total calculated rating
   * @param {number} [ratingData.skillCount] - Number of skills included
   * @returns {Object} - Meta tag configuration object
   */
  function generateCalculatorMeta(ratingData) {
    const totalRating = ratingData.totalRating || 0;
    const skillCount = ratingData.skillCount || 0;

    const title = `UmaTools - Rating Calculation (${totalRating.toLocaleString()} rating)`;
    const description = `Uma Musume rating calculation: ${totalRating.toLocaleString()} total rating with ${skillCount} skills. View detailed breakdown on UmaTools.`;

    return {
      title,
      description,
      url: window.location.href,
    };
  }

  /**
   * Generates a shareable meta tag configuration for stamina check results
   * @param {Object} staminaData - Stamina check configuration data
   * @param {string} [staminaData.courseType] - Course type (e.g., 'turf', 'dirt')
   * @param {number} [staminaData.distance] - Race distance
   * @returns {Object} - Meta tag configuration object
   */
  function generateStaminaMeta(staminaData) {
    const courseType = staminaData.courseType || 'custom';
    const distance = staminaData.distance || 0;

    const title = `UmaTools - Stamina Check (${distance}m ${courseType})`;
    const description = `Uma Musume stamina calculation for ${distance}m ${courseType} race. View stamina requirements and skill recommendations on UmaTools.`;

    return {
      title,
      description,
      url: window.location.href,
    };
  }

  /**
   * Generates a shareable meta tag configuration for accel checker results
   * @param {Object} accelData - Accel check configuration data
   * @param {string} [accelData.racetrack] - Racetrack name
   * @param {number} [accelData.distance] - Race distance
   * @returns {Object} - Meta tag configuration object
   */
  function generateAccelMeta(accelData) {
    const racetrack = accelData.racetrack || 'custom course';
    const distance = accelData.distance || 0;

    const title = `UmaTools - Accel Check (${racetrack})`;
    const description = `Uma Musume acceleration zone analysis for ${racetrack} (${distance}m). View slope sections and skill recommendations on UmaTools.`;

    return {
      title,
      description,
      url: window.location.href,
    };
  }

  // Expose functions globally
  window.MetaTags = {
    updateMetaTag,
    updateShareMetaTags,
    resetMetaTags,
    generateOptimizerMeta,
    generateCalculatorMeta,
    generateStaminaMeta,
    generateAccelMeta,
  };
})();
