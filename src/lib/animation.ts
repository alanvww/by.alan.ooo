import { animate, stagger, scroll } from 'motion/react';

// Fade in animation
export const fadeIn = (element: Element | null) => {
	if (!element) return;

	animate(
		element as any,
		{ opacity: [0, 1], y: [20, 0] } as any,
		{ duration: 0.6, easing: [0.22, 1, 0.36, 1] } as any
	);
};

// Staggered fade in for multiple elements
export const staggerFadeIn = (
	elements: Element[] | null
) => {
	if (!elements) return;

	animate(
		elements as any,
		{ opacity: [0, 1], y: [20, 0] } as any,
		{
			delay: stagger(0.1),
			duration: 0.6,
			easing: [0.22, 1, 0.36, 1],
		} as any
	);
};

// Fade in when element is in view
export const fadeInOnScroll = (element: Element | null) => {
	if (!element) return;
	
	// Create an IntersectionObserver to detect when the element is in view
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					animate(
						entry.target as any,
						{ opacity: [0, 1], y: [20, 0] } as any,
						{ duration: 0.6, easing: [0.22, 1, 0.36, 1] } as any
					);
					
					// Disconnect the observer after animation starts
					observer.disconnect();
				}
			});
		},
		{ threshold: 0.1 }
	);
	
	// Start observing the element
	observer.observe(element);
};

// Staggered fade in when element is in view
export const staggerFadeInOnScroll = (
	container: Element | null,
	childrenSelector: string
) => {
	if (!container) return;
	
	// Create an IntersectionObserver to detect when the container is in view
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach(entry => {
				if (entry.isIntersecting) {
					const elements = Array.from(container.querySelectorAll(childrenSelector));
					
					animate(
						elements as any,
						{ opacity: [0, 1], y: [20, 0] } as any,
						{
							delay: stagger(0.1),
							duration: 0.6,
							easing: [0.22, 1, 0.36, 1],
						} as any
					);
					
					// Disconnect the observer after animation starts
					observer.disconnect();
				}
			});
		},
		{ threshold: 0.1 }
	);
	
	// Start observing the container
	observer.observe(container);
};

// Parallax scroll effect
export const parallaxScroll = (element: Element | null, strength = 0.1) => {
	if (!element) return;

	scroll(
		animate(element as any, {
			y: [0, `${strength * 100}vh`],
		} as any)
	);
};

// Horizontal scroll animation
export const horizontalScroll = (element: Element | null) => {
	if (!element) return;

	scroll(
		animate(element as any, {
			x: [0, '-100%'],
		} as any)
	);
};

// Timeline animation for sequential animations
export const createSequentialAnimations = (elements: Record<string, Element | null>, delay = 0.1) => {
	// Filter out null elements
	const validElements: Element[] = [];
	
	Object.values(elements).forEach(element => {
		if (element) {
			validElements.push(element);
		}
	});
	
	// Animate elements sequentially
	validElements.forEach((element, index) => {
		animate(
			element as any,
			{ opacity: [0, 1], y: [20, 0] } as any,
			{ 
				delay: index * delay,
				duration: 0.5,
				easing: [0.22, 1, 0.36, 1]
			} as any
		);
	});
};
