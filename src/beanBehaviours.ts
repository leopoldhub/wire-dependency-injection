/**
 * NO_INSTANCE behaviour indicates that the bean should not be instanced.
 */
export const NO_INSTANCE = 'NO_INSTANCE';
/**
 * CAUTIOUS behaviour indicates that the bean should wait for all of its dependencies to be present before instancing.
 */
export const CAUTIOUS = 'CAUTIOUS';
/**
 * EAGER behaviour indicates that the bean should instance as soon as declared.
 * Will fail if not all the dependencies are present.
 */
export const EAGER = 'EAGER';
/**
 * EAGER behaviour indicates that the bean should instance only when requested.
 * Will fail if not all the dependencies are present.
 */
export const LAZY = 'LAZY';
