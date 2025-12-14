"use client";

import { useEffect } from "react";

export default function HideNotifications() {
  useEffect(() => {
    // Function to hide notification elements - aggressive approach
    const hideNotifications = () => {
      // Method 1: Find by position (bottom-left corner)
      const allElements = document.querySelectorAll('*');
      allElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (!htmlEl || htmlEl === document.body || htmlEl === document.documentElement) return;
        
        const rect = htmlEl.getBoundingClientRect();
        const style = window.getComputedStyle(htmlEl);
        const position = style.position;
        
        // Check if element is fixed/absolute at bottom-left (likely notification button)
        if (position === 'fixed' || position === 'absolute') {
          const isBottomLeft = 
            (rect.bottom > window.innerHeight - 150 && rect.left < 150) ||
            (rect.bottom > window.innerHeight - 100 && rect.left < 100);
          
          // Check if it looks like a notification button (small circular icon)
          const isSmallIcon = rect.width < 100 && rect.height < 100;
          const hasTextN = htmlEl.textContent?.trim() === 'N' || htmlEl.textContent?.trim() === '';
          
          if (isBottomLeft && isSmallIcon) {
            // Hide it aggressively
            htmlEl.style.setProperty('display', 'none', 'important');
            htmlEl.style.setProperty('visibility', 'hidden', 'important');
            htmlEl.style.setProperty('opacity', '0', 'important');
            htmlEl.style.setProperty('pointer-events', 'none', 'important');
            htmlEl.style.setProperty('z-index', '-9999', 'important');
            htmlEl.setAttribute('hidden', 'true');
          }
        }
      });

      // Method 2: Find by common notification selectors
      const selectors = [
        '[class*="notification"]',
        '[id*="notification"]',
        '[class*="Notification"]',
        '[id*="Notification"]',
        '[data-testid*="notification"]',
        '[aria-label*="notification"]',
        '[aria-label*="Notification"]',
        // Browser extension patterns
        'div[style*="position: fixed"][style*="bottom"]',
        'div[style*="position:fixed"][style*="bottom"]',
        'button[style*="position: fixed"]',
        'a[style*="position: fixed"]',
        // Common extension IDs
        '#grammarly-extension',
        '#languagetool',
        '[id^="extension-"]',
        '[class^="extension-"]',
      ];

      selectors.forEach((selector) => {
        try {
          const elements = document.querySelectorAll(selector);
          elements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            const rect = htmlEl.getBoundingClientRect();
            const isBottomLeft = rect.bottom > window.innerHeight - 200 && rect.left < 200;
            
            if (isBottomLeft || selector.includes('notification')) {
              htmlEl.style.setProperty('display', 'none', 'important');
              htmlEl.style.setProperty('visibility', 'hidden', 'important');
              htmlEl.style.setProperty('opacity', '0', 'important');
              htmlEl.style.setProperty('pointer-events', 'none', 'important');
              htmlEl.style.setProperty('z-index', '-9999', 'important');
              htmlEl.setAttribute('hidden', 'true');
            }
          });
        } catch (e) {
          // Ignore errors
        }
      });
    };

    // Run immediately and repeatedly
    hideNotifications();
    
    // Run multiple times with intervals
    const intervals: NodeJS.Timeout[] = [];
    [100, 300, 500, 1000, 2000, 3000].forEach((delay) => {
      intervals.push(setTimeout(hideNotifications, delay));
    });
    
    // Run every 500ms to catch dynamically added elements
    const intervalId = setInterval(hideNotifications, 500);

    // Use MutationObserver to watch for new elements
    const observer = new MutationObserver(() => {
      hideNotifications();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'id'],
    });

    // Also observe document
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => {
      intervals.forEach(clearTimeout);
      clearInterval(intervalId);
      observer.disconnect();
    };
  }, []);

  return null;
}

