import { useEffect, useRef, useState, useCallback } from 'react';

export const useIntersectionObserver = (options = {}) => {
    const [visibleElements, setVisibleElements] = useState(new Set());
    const observerRef = useRef();
    const elementsRef = useRef(new Map());

    useEffect(() => {
        observerRef.current = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                const elementId = entry.target.getAttribute('data-message-id');
                if (entry.isIntersecting) {
                    setVisibleElements(prev => new Set([...prev, elementId]))
                } else {
                    setVisibleElements(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(elementId)
                        return newSet
                    })
                }
            });
        }, {
            threshold: 0.5,
            rootMargin: '0px',
            ...options
        })

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [])

    const observe = useCallback((element, messageId) => {
        if (observerRef.current && element) {
            element.setAttribute('data-message-id', messageId);
            observerRef.current.observe(element);
            elementsRef.current.set(messageId, element);
        }
    }, []);

    const unobserve = useCallback((messageId) => {
        const element = elementsRef.current.get(messageId);
        if (observerRef.current && element) {
            observerRef.current.unobserve(element);
            elementsRef.current.delete(messageId);
        }
    }, []);

    return { visibleElements, observe, unobserve };


}