import { useEffect } from 'react';

/**
 * Custom hook to prevent body scroll when modal/popup is open
 * This will work globally across all pages
 *
 * @param {boolean} isOpen - Whether the modal is open or not
 *
 * @example
 * const [showModal, setShowModal] = useState(false);
 * usePreventBodyScroll(showModal);
 */
export const usePreventBodyScroll = (isOpen) => {
    useEffect(() => {
        if (isOpen) {
            // Save current scroll position
            const scrollY = window.scrollY;

            // Prevent scrolling
            document.body.style.overflow = 'hidden';
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';
        } else {
            // Restore scroll position
            const scrollY = document.body.style.top;
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';

            if (scrollY) {
                window.scrollTo(0, parseInt(scrollY || '0') * -1);
            }
        }

        // Cleanup on unmount
        return () => {
            document.body.style.overflow = '';
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
        };
    }, [isOpen]);
};

/**
 * Custom hook to prevent body scroll when any of multiple modals is open
 *
 * @param {...boolean} conditions - Multiple boolean conditions to check
 *
 * @example
 * usePreventBodyScrollMultiple(showModal1, showModal2, showModal3);
 */
export const usePreventBodyScrollMultiple = (...conditions) => {
    const isAnyOpen = conditions.some(condition => condition === true);
    usePreventBodyScroll(isAnyOpen);
};
