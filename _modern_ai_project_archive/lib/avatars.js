// Import prompts and constants from context
import { AVATAR_PROMPTS, BASE_PROMPT, CODE_PROMPT, getCompleteSystemPrompt } from '../context/prompts.js';
import { AVATAR_CONFIG as CONTEXT_AVATAR_CONFIG } from '../context/constant.js';

// Export the avatar configuration from context
export const AVATAR_CONFIG = CONTEXT_AVATAR_CONFIG;

// Export the prompts from context
export { AVATAR_PROMPTS, BASE_PROMPT, CODE_PROMPT, getCompleteSystemPrompt };
