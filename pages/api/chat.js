import { AVATAR_CONFIG } from '../../lib/avatars'
import { getCompleteSystemPrompt } from '../../context/prompts.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Google Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// In-memory conversation storage with enhanced session management
const conversationHistory = new Map()
const sessionContexts = new Map()

// Performance optimization: Cache system prompts
const systemPromptCache = new Map()

// Comprehensive offline knowledge base for all avatars
const OFFLINE_KNOWLEDGE_BASE = {
  'biology-teacher': {
    'brain': {
      title: "The Human Brain",
      content: `The brain is the command center of the human body, controlling all our thoughts, movements, and bodily functions. It's made up of billions of nerve cells called neurons that communicate through electrical and chemical signals.

**Key Facts:**
• Weight: About 3 pounds (1.4 kg)
• Neurons: Approximately 86 billion
• Energy Usage: 20% of body's total energy
• Functions: Memory, learning, emotions, behavior control

**Main Parts:**
1. **Cerebrum** - Thinking, voluntary actions, memory
2. **Cerebellum** - Balance, coordination, fine motor skills
3. **Brainstem** - Basic life functions (breathing, heart rate)

**Interesting Facts:**
• The brain can process information at 268 mph
• It generates enough electricity to power a light bulb
• New neural connections form when you learn something new`,
      keywords: ['brain', 'nervous system', 'neurons', 'cerebrum', 'cerebellum', 'brainstem']
    },
    'cell': {
      title: "Cells: Building Blocks of Life",
      content: `Cells are the basic building blocks of all living things. They are microscopic structures that carry out all the functions necessary for life.

**What are Cells?**
• The smallest unit of life
• All living organisms are made of cells
• Human body contains trillions of cells
• Each cell has a specific function

**Cell Structure:**
1. **Cell Membrane** - Protects and controls what enters/exits
2. **Nucleus** - Contains genetic material (DNA)
3. **Cytoplasm** - Gel-like substance where reactions occur
4. **Organelles** - Specialized structures for specific tasks

**Types of Cells:**
• **Nerve cells** - Transmit electrical signals
• **Muscle cells** - Enable movement
• **Blood cells** - Transport oxygen and nutrients
• **Skin cells** - Provide protection`,
      keywords: ['cell', 'cells', 'nucleus', 'membrane', 'cytoplasm', 'organelles']
    },
    'heart': {
      title: "The Human Heart",
      content: `The heart is a muscular organ that pumps blood throughout the body, delivering oxygen and nutrients to all cells.

**Heart Facts:**
• Size: About the size of your fist
• Weight: 8-10 ounces (250-300 grams)
• Beats: 60-100 times per minute at rest
• Daily beats: Over 100,000 times

**Heart Structure:**
1. **Four Chambers:**
   - Right atrium and ventricle
   - Left atrium and ventricle
2. **Valves** - Prevent blood from flowing backward
3. **Muscle tissue** - Contracts to pump blood

**Blood Flow:**
• Deoxygenated blood → Right side → Lungs
• Oxygenated blood → Left side → Body`,
      keywords: ['heart', 'blood', 'circulation', 'pump', 'chambers', 'valves']
    },
    'default': {
      title: "Biology Fundamentals",
      content: `Biology is the study of living organisms and their interactions with each other and their environment. It covers everything from tiny cells to complex ecosystems.

**Key Areas in Biology:**
1. **Cell Biology** - Studying the basic units of life
2. **Genetics** - Understanding how traits are inherited
3. **Ecology** - Examining how organisms interact with their environment
4. **Evolution** - Studying how species change over time
5. **Human Anatomy** - Understanding the human body structure

**Why Study Biology?**
• Understand how your body works
• Learn about diseases and treatments
• Appreciate the diversity of life
• Make informed health decisions
• Contribute to scientific discoveries`,
      keywords: ['biology', 'life', 'organisms', 'cells', 'genetics', 'ecology']
    }
  },
  'physics-teacher': {
    'motion': {
      title: "Motion and Forces",
      content: `Motion is the change in position of an object over time. It's one of the fundamental concepts in physics that helps us understand how things move.

**Types of Motion:**
1. **Linear Motion** - Moving in a straight line
2. **Circular Motion** - Moving in a circle
3. **Oscillatory Motion** - Back and forth movement
4. **Random Motion** - Unpredictable movement

**Key Concepts:**
• **Speed** - How fast something moves (distance/time)
• **Velocity** - Speed with direction
• **Acceleration** - How quickly velocity changes
• **Force** - What causes motion to change

**Newton's Laws of Motion:**
1. **First Law** - Objects stay at rest or in motion unless acted upon by a force
2. **Second Law** - Force = mass × acceleration
3. **Third Law** - For every action, there's an equal and opposite reaction`,
      keywords: ['motion', 'movement', 'speed', 'velocity', 'acceleration', 'force', 'newton']
    },
    'energy': {
      title: "Forms of Energy",
      content: `Energy is the ability to do work or cause change. It's a fundamental concept in physics that comes in many forms.

**Types of Energy:**
1. **Kinetic Energy** - Energy of motion
   • Moving car, falling ball, flowing water
2. **Potential Energy** - Stored energy
   • Stretched rubber band, raised object, compressed spring
3. **Thermal Energy** - Heat energy
   • Hot coffee, warm air, steam
4. **Electrical Energy** - Energy from electric charges
   • Lightning, batteries, power lines
5. **Chemical Energy** - Energy stored in chemical bonds
   • Food, gasoline, explosives

**Energy Conservation:**
• Energy cannot be created or destroyed
• It only changes from one form to another
• Total energy in a system remains constant`,
      keywords: ['energy', 'kinetic', 'potential', 'thermal', 'electrical', 'chemical']
    },
    'light': {
      title: "Light and Optics",
      content: `Light is a form of electromagnetic radiation that we can see. It travels in straight lines and can be reflected, refracted, and absorbed.

**Properties of Light:**
• **Speed** - 186,000 miles per second (300,000 km/s)
• **Wavelength** - Determines color
• **Intensity** - Determines brightness

**Light Behavior:**
1. **Reflection** - Light bounces off surfaces
2. **Refraction** - Light bends when passing through different materials
3. **Absorption** - Light is absorbed by materials
4. **Diffraction** - Light bends around obstacles

**Colors of Light:**
• White light contains all colors
• Primary colors: Red, Blue, Green
• Mixing colors creates new colors`,
      keywords: ['light', 'optics', 'reflection', 'refraction', 'color', 'wavelength']
    },
    'default': {
      title: "Physics Fundamentals",
      content: `Physics is the study of matter, energy, and their interactions. It helps us understand how the universe works at both the smallest and largest scales.

**Main Branches of Physics:**
1. **Mechanics** - Motion, forces, and energy
2. **Thermodynamics** - Heat and energy transfer
3. **Electromagnetism** - Electricity and magnetism
4. **Optics** - Light and vision
5. **Quantum Physics** - Behavior of very small particles

**Why Study Physics?**
• Understand how the world works
• Develop problem-solving skills
• Apply to engineering and technology
• Explore the mysteries of the universe
• Make scientific discoveries`,
      keywords: ['physics', 'matter', 'energy', 'forces', 'motion', 'universe']
    }
  },
  'chemistry-teacher': {
    'acid': {
      title: "Acids and Bases",
      content: `Acids and bases are important chemical compounds that have opposite properties and are found everywhere in our daily lives.

**What are Acids?**
• Substances that release hydrogen ions (H+) in water
• Taste sour (like lemon juice)
• Turn blue litmus paper red
• Conduct electricity when dissolved in water

**What are Bases?**
• Substances that release hydroxide ions (OH-) in water
• Taste bitter and feel slippery
• Turn red litmus paper blue
• Also conduct electricity when dissolved

**Common Examples:**
• **Acids:** Lemon juice, vinegar, stomach acid, battery acid
• **Bases:** Soap, baking soda, ammonia, drain cleaner

**pH Scale:**
• 0-6: Acidic
• 7: Neutral (water)
• 8-14: Basic`,
      keywords: ['acid', 'acids', 'base', 'bases', 'ph', 'hydrogen', 'hydroxide']
    },
    'reaction': {
      title: "Chemical Reactions",
      content: `A chemical reaction is a process where substances (reactants) transform into new substances (products). It involves breaking and forming chemical bonds.

**Types of Chemical Reactions:**
1. **Synthesis** - Two or more substances combine
2. **Decomposition** - One substance breaks down into simpler substances
3. **Single Replacement** - One element replaces another
4. **Double Replacement** - Two elements switch places
5. **Combustion** - Substance reacts with oxygen, producing heat and light

**Signs of a Chemical Reaction:**
• Color change
• Gas production (bubbles)
• Temperature change
• Formation of a solid (precipitate)
• Odor change

**Examples:**
• Rusting of iron
• Burning of wood
• Baking a cake
• Photosynthesis`,
      keywords: ['reaction', 'chemical', 'reactants', 'products', 'bonds', 'synthesis']
    },
    'element': {
      title: "Chemical Elements",
      content: `Elements are pure substances made of only one type of atom. They are the building blocks of all matter in the universe.

**Element Facts:**
• There are 118 known elements
• Elements are organized in the periodic table
• Each element has unique properties
• Elements can combine to form compounds
• Some elements are naturally occurring, others are synthetic

**Types of Elements:**
1. **Metals** - Good conductors of heat and electricity
2. **Nonmetals** - Poor conductors, often gases
3. **Metalloids** - Properties between metals and nonmetals

**Common Elements:**
• **Hydrogen (H)** - Most abundant element in universe
• **Carbon (C)** - Basis of all life
• **Oxygen (O)** - Essential for breathing
• **Iron (Fe)** - Important for blood and tools`,
      keywords: ['element', 'elements', 'atom', 'atoms', 'periodic table', 'metal']
    },
    'default': {
      title: "Chemistry Basics",
      content: `Chemistry is the study of matter, its properties, and the changes it undergoes. It's often called the "central science" because it connects physics and biology.

**Key Areas in Chemistry:**
1. **Atomic Structure** - Understanding atoms and molecules
2. **Chemical Bonding** - How atoms connect to form compounds
3. **Reactions** - How substances change into new substances
4. **Solutions** - Mixtures and concentrations
5. **Organic Chemistry** - Carbon-based compounds

**Why Study Chemistry?**
• Understand the composition of materials
• Learn about medicines and drugs
• Develop new materials and technologies
• Solve environmental problems
• Make informed decisions about products`,
      keywords: ['chemistry', 'matter', 'atoms', 'molecules', 'compounds', 'reactions']
    }
  }
}

// Helper function to parse related content from AI response
const parseRelatedContent = (contentText, type) => {
  if (!contentText || typeof contentText !== 'string') return []
  
  const lines = contentText.split('\n').filter(line => line.trim())
  const items = []
  
  for (const line of lines) {
    if (line.includes(':')) {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const title = parts[0].trim()
        const rest = parts.slice(1).join(':').trim()
        
        if (type === 'article') {
          // Parse "Title: Description - ThumbnailURL - URL" format
          const urlMatch = rest.match(/\s*-\s*(https?:\/\/[^\s]+)/)
          if (urlMatch) {
            const beforeUrl = rest.replace(/\s*-\s*https?:\/\/[^\s]+/, '').trim()
            const thumbnailMatch = beforeUrl.match(/\s*-\s*(https?:\/\/[^\s]+)/)
            if (thumbnailMatch) {
              const description = beforeUrl.replace(/\s*-\s*https?:\/\/[^\s]+/, '').trim()
              items.push({
                title: title,
                description: description || 'Learn more about this topic',
                thumbnailUrl: thumbnailMatch[1],
                url: urlMatch[1]
              })
            } else {
              // Fallback: no thumbnail provided
              const description = beforeUrl.trim()
              items.push({
                title: title,
                description: description || 'Learn more about this topic',
                thumbnailUrl: null,
                url: urlMatch[1]
              })
            }
          }
        } else if (type === 'video') {
          // Parse "Title: Description - Duration - ThumbnailURL - URL" format
          const urlMatch = rest.match(/\s*-\s*(https?:\/\/[^\s]+)/)
          if (urlMatch) {
            const beforeUrl = rest.replace(/\s*-\s*https?:\/\/[^\s]+/, '').trim()
            const thumbnailMatch = beforeUrl.match(/\s*-\s*(https?:\/\/[^\s]+)/)
            if (thumbnailMatch) {
              const beforeThumbnail = beforeUrl.replace(/\s*-\s*https?:\/\/[^\s]+/, '').trim()
              const durationMatch = beforeThumbnail.match(/\s*-\s*(\d{1,2}:\d{2})/)
              if (durationMatch) {
                const description = beforeThumbnail.replace(/\s*-\s*\d{1,2}:\d{2}/, '').trim()
                items.push({
                  title: title,
                  description: description || 'Watch this educational video',
                  duration: durationMatch[1],
                  thumbnailUrl: thumbnailMatch[1],
                  url: urlMatch[1]
                })
              }
            } else {
              // Fallback: no thumbnail provided
              const beforeThumbnail = beforeUrl.trim()
              const durationMatch = beforeThumbnail.match(/\s*-\s*(\d{1,2}:\d{2})/)
              if (durationMatch) {
                const description = beforeThumbnail.replace(/\s*-\s*\d{1,2}:\d{2}/, '').trim()
                items.push({
                  title: title,
                  description: description || 'Watch this educational video',
                  duration: durationMatch[1],
                  thumbnailUrl: null,
                  url: urlMatch[1]
                })
              }
            }
          }
        }
      }
    }
  }
  
  return items.slice(0, type === 'article' ? 4 : 3) // Limit articles to 4, videos to 3
}

// Helper function to generate fallback articles
const generateFallbackArticles = (avatarType) => {
  const fallbackArticles = {
    'computer-teacher': [
              { title: "Programming Fundamentals", description: "Essential concepts for beginners", url: "https://www.w3schools.com/programming/" },
              { title: "Web Development Guide", description: "Learn HTML, CSS, and JavaScript", url: "https://developer.mozilla.org/en-US/docs/Web" },
              { title: "Computer Science Basics", description: "Core concepts and principles", url: "https://www.khanacademy.org/computing" }
    ],
    'mathematics-teacher': [
              { title: "Math Fundamentals", description: "Basic mathematical concepts", url: "https://www.khanacademy.org/math" },
              { title: "Algebra Basics", description: "Introduction to algebraic concepts", url: "https://www.mathsisfun.com/algebra/" },
              { title: "Geometry Concepts", description: "Understanding shapes and space", url: "https://www.mathsisfun.com/geometry/" }
    ],
    'english-teacher': [
              { title: "English Grammar", description: "Essential grammar rules", url: "https://www.grammarly.com/blog/" },
              { title: "Writing Skills", description: "Improve your writing", url: "https://owl.purdue.edu/owl/" },
              { title: "Literature Guide", description: "Understanding literary works", url: "https://www.sparknotes.com/" }
    ],
    'biology-teacher': [
              { title: "Biology Fundamentals", description: "Essential life science concepts", url: "https://www.khanacademy.org/science/biology" },
              { title: "Human Anatomy", description: "Learn about the human body", url: "https://www.innerbody.com/" },
              { title: "Cell Biology", description: "Understanding cellular processes", url: "https://www.khanacademy.org/science/biology/cellular-molecular-biology" }
    ],
    'physics-teacher': [
              { title: "Physics Fundamentals", description: "Basic physics concepts", url: "https://www.khanacademy.org/science/physics" },
              { title: "Mechanics", description: "Motion, forces, and energy", url: "https://www.physicsclassroom.com/" },
              { title: "Electricity & Magnetism", description: "Electromagnetic concepts", url: "https://www.khanacademy.org/science/physics/magnetic-forces-and-magnetic-fields" }
    ],
    'chemistry-teacher': [
              { title: "Chemistry Basics", description: "Fundamental chemical concepts", url: "https://www.khanacademy.org/science/chemistry" },
              { title: "Periodic Table", description: "Understanding elements", url: "https://www.rsc.org/periodic-table" },
              { title: "Chemical Reactions", description: "Types of chemical changes", url: "https://www.khanacademy.org/science/chemistry/chemical-reactions-stoichiometry" }
    ],
    'history-teacher': [
              { title: "World History", description: "Major historical events", url: "https://www.khanacademy.org/humanities/world-history" },
              { title: "Ancient Civilizations", description: "Early human societies", url: "https://www.khanacademy.org/humanities/ancient-art-civilizations" },
              { title: "Modern History", description: "Recent historical developments", url: "https://www.khanacademy.org/humanities/us-history" }
    ],
    'geography-teacher': [
              { title: "Physical Geography", description: "Earth's natural features", url: "https://www.khanacademy.org/humanities/geography" },
              { title: "World Maps", description: "Understanding global geography", url: "https://www.nationalgeographic.org/maps/" },
              { title: "Climate & Weather", description: "Atmospheric conditions", url: "https://www.khanacademy.org/science/weather-and-climate" }
    ],
    'hindi-teacher': [
              { title: "Hindi Grammar", description: "हिंदी व्याकरण के नियम", url: "https://www.hindigranth.com/" },
              { title: "Hindi Literature", description: "हिंदी साहित्य का अध्ययन", url: "https://www.hindisahitya.com/" },
              { title: "Hindi Writing", description: "हिंदी लेखन कौशल", url: "https://www.hindigranth.com/" }
    ],
    'doctor': [
              { title: "Health Basics", description: "Fundamental health concepts", url: "https://www.mayoclinic.org/healthy-lifestyle" },
              { title: "Nutrition Guide", description: "Healthy eating principles", url: "https://www.nutrition.gov/" },
              { title: "Exercise & Fitness", description: "Physical activity guidelines", url: "https://www.cdc.gov/physicalactivity/index.html" }
    ],
    'engineer': [
              { title: "Engineering Basics", description: "Fundamental engineering concepts", url: "https://www.khanacademy.org/science/engineering" },
              { title: "Mechanical Engineering", description: "Machines and mechanisms", url: "https://www.khanacademy.org/science/mechanical-engineering" },
              { title: "Electrical Engineering", description: "Circuits and electronics", url: "https://www.khanacademy.org/science/electrical-engineering" }
    ],
    'lawyer': [
              { title: "Legal Basics", description: "Fundamental legal concepts", url: "https://www.law.cornell.edu/" },
              { title: "Constitutional Law", description: "Understanding the constitution", url: "https://constitutioncenter.org/" },
              { title: "Civil Rights", description: "Individual rights and freedoms", url: "https://www.aclu.org/" }
    ]
  }
  
  return fallbackArticles[avatarType] || fallbackArticles['computer-teacher']
}

// Helper function to generate fallback videos
const generateFallbackVideos = (avatarType) => {
  const fallbackVideos = {
    'computer-teacher': [
      { title: "Programming for Beginners", description: "Learn to code from scratch", duration: "15:30", url: "https://www.youtube.com/watch?v=zOjov2YO4Es" },
      { title: "Web Development Tutorial", description: "Build your first website", duration: "22:15", url: "https://www.youtube.com/watch?v=916GWv2Qs08" }
    ],
    'mathematics-teacher': [
      { title: "Math Fundamentals", description: "Essential mathematical concepts", duration: "12:20", url: "https://www.youtube.com/watch?v=Kp2bYWRQylk" },
      { title: "Algebra Basics", description: "Understanding algebra", duration: "16:40", url: "https://www.youtube.com/watch?v=NybHckSEQBI" }
    ],
    'english-teacher': [
      { title: "English Grammar Basics", description: "Essential grammar rules", duration: "13:25", url: "https://www.youtube.com/watch?v=8WJYtGj1g5Q" },
      { title: "Writing Skills", description: "Improve your writing", duration: "19:10", url: "https://www.youtube.com/watch?v=1ajte3bMroe" }
    ],
    'biology-teacher': [
      { title: "Biology Introduction", description: "Basic life science concepts", duration: "14:30", url: "https://www.youtube.com/watch?v=izRvPaAWgyw" },
      { title: "Human Body Systems", description: "Understanding anatomy", duration: "18:45", url: "https://www.youtube.com/watch?v=0jbniqJ4nQc" }
    ],
    'physics-teacher': [
      { title: "Physics Fundamentals", description: "Basic physics concepts", duration: "16:20", url: "https://www.youtube.com/watch?v=CQYELiTtUs8" },
      { title: "Mechanics Explained", description: "Motion and forces", duration: "21:15", url: "https://www.youtube.com/watch?v=7DjsD7Hcd9U" }
    ],
    'chemistry-teacher': [
      { title: "Chemistry Basics", description: "Fundamental chemical concepts", duration: "15:40", url: "https://www.youtube.com/watch?v=7DjsD7Hcd9U" },
      { title: "Periodic Table", description: "Understanding elements", duration: "19:30", url: "https://www.youtube.com/watch?v=0RRVV4Diomg" }
    ],
    'history-teacher': [
      { title: "World History Overview", description: "Major historical events", duration: "17:25", url: "https://www.youtube.com/watch?v=Yocja_N5s1I" },
      { title: "Ancient Civilizations", description: "Early human societies", duration: "20:10", url: "https://www.youtube.com/watch?v=8ZtInClXe1Q" }
    ],
    'geography-teacher': [
      { title: "Physical Geography", description: "Earth's natural features", duration: "16:45", url: "https://www.youtube.com/watch?v=7DjsD7Hcd9U" },
      { title: "World Geography", description: "Global geographical features", duration: "18:20", url: "https://www.youtube.com/watch?v=0RRVV4Diomg" }
    ],
    'hindi-teacher': [
      { title: "हिंदी व्याकरण", description: "Basic Hindi grammar rules", duration: "14:15", url: "https://www.youtube.com/watch?v=7DjsD7Hcd9U" },
      { title: "हिंदी लेखन", description: "Hindi writing skills", duration: "16:50", url: "https://www.youtube.com/watch?v=0RRVV4Diomg" }
    ],
    'doctor': [
      { title: "Health Basics", description: "Fundamental health concepts", duration: "15:30", url: "https://www.youtube.com/watch?v=7DjsD7Hcd9U" },
      { title: "Nutrition Guide", description: "Healthy eating principles", duration: "18:45", url: "https://www.youtube.com/watch?v=0RRVV4Diomg" }
    ],
    'engineer': [
      { title: "Engineering Fundamentals", description: "Basic engineering concepts", duration: "16:20", url: "https://www.youtube.com/watch?v=7DjsD7Hcd9U" },
      { title: "Mechanical Engineering", description: "Machines and mechanisms", duration: "19:15", url: "https://www.youtube.com/watch?v=0RRVV4Diomg" }
    ],
    'lawyer': [
      { title: "Legal Basics", description: "Fundamental legal concepts", duration: "17:40", url: "https://www.youtube.com/watch?v=7DjsD7Hcd9U" },
      { title: "Constitutional Law", description: "Understanding the constitution", duration: "20:25", url: "https://www.youtube.com/watch?v=0RRVV4Diomg" }
    ]
  }
  
  return fallbackVideos[avatarType] || fallbackVideos['computer-teacher']
}

// Helper function to get quota status information
const getQuotaStatus = () => {
  return {
    message: "Free tier limit reached",
    details: "You've used all 50 free API calls for today",
    resetTime: "Resets at midnight (UTC)",
    alternatives: [
      "Explore the suggested educational resources below",
      "Try again tomorrow when the quota resets",
      "Consider upgrading to a paid plan for unlimited access"
    ]
  }
}

// Enhanced intelligent fallback that searches the offline knowledge base
const generateIntelligentFallback = (avatarType, prompt) => {
  // First, try to find a specific match in the offline knowledge base
  const avatarKnowledge = OFFLINE_KNOWLEDGE_BASE[avatarType]
  if (avatarKnowledge) {
    const promptLower = prompt.toLowerCase()
    
    // Search for specific topic matches
    for (const [topic, knowledge] of Object.entries(avatarKnowledge)) {
      if (topic !== 'default') {
        // Check if any keywords match the prompt
        const hasKeywordMatch = knowledge.keywords.some(keyword => 
          promptLower.includes(keyword)
        )
        
        if (hasKeywordMatch) {
          return knowledge.content
        }
      }
    }
    
    // Return default knowledge for the avatar
    return avatarKnowledge.default.content
  }
  
  // Fallback to the original intelligent responses if no offline knowledge
  const fallbackResponses = {
    'biology-teacher': {
      'brain': `The brain is the command center of the human body, controlling all our thoughts, movements, and bodily functions. It's made up of billions of nerve cells called neurons that communicate through electrical and chemical signals.

Key facts about the brain:
• It weighs about 3 pounds (1.4 kg)
• Contains approximately 86 billion neurons
• Uses 20% of the body's total energy
• Controls memory, learning, emotions, and behavior
• Protected by the skull and cerebrospinal fluid

The brain has three main parts: the cerebrum (thinking and voluntary actions), cerebellum (balance and coordination), and brainstem (basic life functions like breathing and heart rate).`,
      'cell': `Cells are the basic building blocks of all living things. They are microscopic structures that carry out all the functions necessary for life.

Key facts about cells:
• All living organisms are made of cells
• Human body contains trillions of cells
• Cells have different shapes and sizes for different functions
• Each cell contains organelles that perform specific tasks
• Cells can reproduce and repair themselves`,
      'default': `Biology is the study of living organisms and their interactions with each other and their environment. It covers everything from tiny cells to complex ecosystems.

Key areas in biology include:
• Cell biology - studying the basic units of life
• Genetics - understanding how traits are inherited
• Ecology - examining how organisms interact with their environment
• Evolution - studying how species change over time
• Human anatomy - understanding the human body structure`
    },
    'physics-teacher': {
      'motion': `Motion is the change in position of an object over time. It's one of the fundamental concepts in physics that helps us understand how things move.

Key concepts in motion:
• Speed - how fast something moves
• Velocity - speed with direction
• Acceleration - how quickly velocity changes
• Force - what causes motion to change
• Newton's Laws - the rules that govern motion`,
      'energy': `Energy is the ability to do work or cause change. It's a fundamental concept in physics that comes in many forms.

Types of energy include:
• Kinetic energy - energy of motion
• Potential energy - stored energy
• Thermal energy - heat energy
• Electrical energy - energy from electric charges
• Chemical energy - energy stored in chemical bonds`,
      'default': `Physics is the study of matter, energy, and their interactions. It helps us understand how the universe works at both the smallest and largest scales.

Key areas in physics include:
• Mechanics - motion and forces
• Thermodynamics - heat and energy
• Electromagnetism - electricity and magnetism
• Optics - light and vision
• Quantum physics - behavior of very small particles`
    },
    'chemistry-teacher': {
      'reaction': `A chemical reaction is a process where substances (reactants) transform into new substances (products). It involves breaking and forming chemical bonds.

Key concepts in chemical reactions:
• Reactants - starting materials
• Products - ending materials
• Chemical equations - balanced formulas
• Energy changes - exothermic vs endothermic
• Catalysts - substances that speed up reactions`,
      'element': `Elements are pure substances made of only one type of atom. They are the building blocks of all matter in the universe.

Key facts about elements:
• There are 118 known elements
• Elements are organized in the periodic table
• Each element has unique properties
• Elements can combine to form compounds
• Some elements are naturally occurring, others are synthetic`,
      'default': `Chemistry is the study of matter, its properties, and the changes it undergoes. It's often called the "central science" because it connects physics and biology.

Key areas in chemistry include:
• Atomic structure - understanding atoms and molecules
• Chemical bonding - how atoms connect
• Reactions - how substances change
• Solutions - mixtures and concentrations
• Organic chemistry - carbon-based compounds`
    },
    'mathematics-teacher': {
      'algebra': `Algebra is a branch of mathematics that uses letters and symbols to represent numbers and quantities in formulas and equations.

Key concepts in algebra:
• Variables - letters that represent unknown values
• Equations - mathematical statements with equals signs
• Solving - finding the value of variables
• Functions - relationships between variables
• Polynomials - expressions with multiple terms`,
      'geometry': `Geometry is the study of shapes, sizes, positions, and dimensions of objects. It helps us understand the world around us.

Key concepts in geometry:
• Points, lines, and planes
• Angles and measurements
• Triangles, circles, and polygons
• Area and perimeter
• Volume and surface area`,
      'default': `Mathematics is the study of numbers, quantities, shapes, and patterns. It's a fundamental tool used in science, engineering, and everyday life.

Key areas in mathematics include:
• Arithmetic - basic operations with numbers
• Algebra - using letters and symbols
• Geometry - studying shapes and space
• Calculus - rates of change and accumulation
• Statistics - collecting and analyzing data`
    },
    'english-teacher': {
      'grammar': `Grammar is the set of rules that govern how words are used to form sentences. It helps us communicate clearly and effectively.

Key grammar concepts include:
• Parts of speech (nouns, verbs, adjectives)
• Sentence structure and punctuation
• Subject-verb agreement
• Tenses and verb forms
• Proper word usage`,
      'writing': `Writing is the process of creating text to communicate ideas, stories, or information. Good writing is clear, organized, and engaging.

Key writing skills include:
• Planning and organization
• Clear and concise language
• Proper grammar and punctuation
• Engaging introductions and conclusions
• Revising and editing`,
      'default': `English is a rich and complex language used for communication, literature, and learning. It has evolved over centuries and is now one of the most widely spoken languages.

Key areas in English include:
• Grammar - rules for using words correctly
• Vocabulary - building word knowledge
• Reading comprehension - understanding written text
• Writing - expressing ideas clearly
• Literature - appreciating written works`
    }
  }
  
  // Get the specific avatar responses
  const avatarResponses = fallbackResponses[avatarType] || fallbackResponses['biology-teacher']
  
  // Check if we have a specific response for the prompt
  const promptLower = prompt.toLowerCase()
  for (const [key, response] of Object.entries(avatarResponses)) {
    if (key !== 'default' && promptLower.includes(key)) {
      return response
    }
  }
  
  // Return default response for the avatar
  return avatarResponses.default || avatarResponses['biology-teacher'].default
}

// Helper function to parse JSON body with multiple fallbacks
const parseBody = (req) => {
  // Case 1: Body is already an object (parsed by Next.js)
  if (req.body && typeof req.body === 'object' && !Array.isArray(req.body)) {
    console.log('✅ Body is already an object')
    return req.body
  }
  
  // Case 2: Body is a string that needs parsing
  if (typeof req.body === 'string') {
    try {
      console.log('✅ Parsing body string as JSON')
      return JSON.parse(req.body)
    } catch (e) {
      console.log('❌ Failed to parse body string as JSON:', req.body)
      return null
    }
  }
  
  // Case 3: Body is an array (unusual but possible)
  if (Array.isArray(req.body)) {
    console.log('⚠️ Body is an array, trying to parse first element')
    try {
      return typeof req.body[0] === 'string' ? JSON.parse(req.body[0]) : req.body[0]
    } catch (e) {
      console.log('❌ Failed to parse array body')
      return null
    }
  }
  
  // Case 4: Body is undefined or null
  if (req.body === undefined || req.body === null) {
    console.log('❌ Body is undefined or null')
    return null
  }
  
  // Case 5: Unknown body type
  console.log('❌ Unknown body type:', typeof req.body, req.body)
  return null
}

// Get conversation history for a specific avatar session
const getConversationHistory = (avatarType, sessionId) => {
  const key = `${avatarType}-${sessionId}`
  return conversationHistory.get(key) || []
}

// Add message to conversation history
const addToConversationHistory = (avatarType, sessionId, role, content) => {
  const key = `${avatarType}-${sessionId}`
  const history = getConversationHistory(avatarType, sessionId)
  history.push({ role, content, timestamp: Date.now() })
  
  // Keep only last 10 messages to prevent memory issues (reduced from 20)
  if (history.length > 10) {
    history.splice(0, history.length - 10)
  }
  conversationHistory.set(key, history)
}

// Get or create session context for Gemini with performance optimization
const getSessionContext = (avatarType, sessionId) => {
  const key = `${avatarType}-${sessionId}`
  if (!sessionContexts.has(key)) {
    sessionContexts.set(key, genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 2048, // Reduced from 4096 for faster responses
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
      },
    }))
  }
  return sessionContexts.get(key)
}

// Clean up old sessions (older than 1 hour instead of 24 hours)
const cleanupOldSessions = () => {
  const now = Date.now()
  const oneHour = 60 * 60 * 1000 // 1 hour
  
  for (const [key, history] of conversationHistory.entries()) {
    if (history.length > 0) {
      const lastMessage = history[history.length - 1]
      if (now - lastMessage.timestamp > oneHour) {
        conversationHistory.delete(key)
        sessionContexts.delete(key)
      }
    }
  }
}

// Get cached system prompt for better performance
const getCachedSystemPrompt = (avatarType) => {
  if (!systemPromptCache.has(avatarType)) {
    const prompt = getCompleteSystemPrompt(avatarType)
    systemPromptCache.set(avatarType, prompt)
  }
  return systemPromptCache.get(avatarType)
}

export default async function handler(req, res) {
  // Enhanced logging for debugging
  console.log('=== API REQUEST DEBUG ===')
  console.log('Method:', req.method)
  console.log('URL:', req.url)
  console.log('Content-Type:', req.headers['content-type'])
  console.log('Environment check - GEMINI_API_KEY exists:', !!process.env.GEMINI_API_KEY)
  console.log('========================')

  // Only allow POST requests
  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method)
    return res.status(405).json({ 
      error: 'Method not allowed. Only POST requests are accepted.',
      method: req.method 
    })
  }

  try {
    // Clean up old sessions
    cleanupOldSessions()
    
    // Parse the request body
    const parsedBody = parseBody(req)
    console.log('Parsed Body:', parsedBody)
    
    const { prompt, avatarType, sessionId = 'default' } = parsedBody || {}

    // Enhanced validation with detailed error messages
    if (!parsedBody) {
      console.log('❌ Request body is missing or invalid')
      return res.status(400).json({ 
        error: 'Request body is missing or invalid. Please provide a valid JSON payload.',
        received: null,
        rawBody: req.body,
        bodyType: typeof req.body
      })
    }

    if (!prompt) {
      console.log('❌ Missing prompt field')
      return res.status(400).json({ 
        error: 'Missing prompt field. Please provide a prompt in the request body.',
        received: { prompt, avatarType, sessionId },
        rawBody: req.body,
        parsedBody: parsedBody
      })
    }

    if (typeof prompt !== 'string') {
      console.log('❌ Invalid prompt type:', typeof prompt)
      return res.status(400).json({ 
        error: 'Invalid prompt type. Prompt must be a string.',
        received: { prompt: typeof prompt, avatarType, sessionId },
        rawBody: req.body,
        parsedBody: parsedBody
      })
    }

    if (prompt.trim().length === 0) {
      console.log('❌ Empty prompt')
      return res.status(400).json({ 
        error: 'Prompt cannot be empty. Please provide a valid question or message.',
        received: { prompt, avatarType, sessionId },
        rawBody: req.body,
        parsedBody: parsedBody
      })
    }

    if (!avatarType) {
      console.log('❌ Missing avatarType field')
      return res.status(400).json({ 
        error: 'Missing avatarType field. Please provide an avatar type in the request body.',
        received: { prompt, avatarType, sessionId },
        rawBody: req.body,
        parsedBody: parsedBody
      })
    }

    if (typeof avatarType !== 'string') {
      console.log('❌ Invalid avatarType:', typeof avatarType)
      return res.status(400).json({ 
        error: 'Invalid avatarType. Avatar type must be a string.',
        received: { avatarType: typeof avatarType, sessionId },
        rawBody: req.body,
        parsedBody: parsedBody
      })
    }

    // Get avatar configuration
    const avatarConfig = AVATAR_CONFIG[avatarType]
    if (!avatarConfig) {
      console.log('❌ Invalid avatar type:', avatarType)
      return res.status(400).json({ 
        error: `Invalid avatar type: "${avatarType}". Please select a valid avatar.`,
        availableAvatars: Object.keys(AVATAR_CONFIG),
        received: { avatarType, sessionId }
      })
    }

    // Check for Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ No Gemini API key found. Please set GEMINI_API_KEY environment variable')
      return res.status(500).json({ 
        error: 'AI service configuration error. Please set up Gemini API key.',
        fallback: true
      })
    }

    console.log('🔑 Using Google Gemini API')

    // Log successful validation
    console.log('API Request validated successfully:', {
      prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
      avatarType,
      avatarName: avatarConfig.name,
      sessionId
    })

    // Get conversation history for context (limited to last 5 messages for performance)
    const history = getConversationHistory(avatarType, sessionId).slice(-5)
    
    // Add user message to history
    addToConversationHistory(avatarType, sessionId, 'user', prompt)

    // Get cached system prompt for better performance
    const systemPrompt = getCachedSystemPrompt(avatarType)
    
    // Get or create Gemini chat session
    const chat = getSessionContext(avatarType, sessionId)
    
    // Simplified prompt construction for better performance
    const fullPrompt = `${systemPrompt}

User Question: ${prompt}

Please provide a comprehensive, educational response with examples and step-by-step explanations when appropriate.`

    console.log(`🔗 Calling Gemini API with optimized context...`)

    // Call Gemini API with timeout
    const result = await Promise.race([
      chat.sendMessage(fullPrompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('API timeout')), 25000) // 25 second timeout
      )
    ])
    
    const aiResponse = result.response.text().trim()

    if (!aiResponse) {
      console.error('❌ No response received from Gemini')
      throw new Error('No response received from AI service')
    }

    // Add AI response to history
    addToConversationHistory(avatarType, sessionId, 'assistant', aiResponse)

    // Parse the response into part1, part2, and related content
    let part1 = aiResponse
    let part2 = ''
    let relatedArticles = []
    let relatedVideos = []

    // Try to extract PART1 and PART2 from the response
    const part1Match = aiResponse.match(/PART1:\s*(.*?)(?=\s*PART2:|RELATED_ARTICLES:|RELATED_VIDEOS:|$)/is)
    const part2Match = aiResponse.match(/PART2:\s*(.*?)(?=\s*RELATED_ARTICLES:|RELATED_VIDEOS:|$)/is)
    const articlesMatch = aiResponse.match(/RELATED_ARTICLES:\s*(.*?)(?=\s*RELATED_VIDEOS:|$)/is)
    const videosMatch = aiResponse.match(/RELATED_VIDEOS:\s*(.*?)$/is)

    if (part1Match) {
      part1 = part1Match[1].trim()
    }

    if (part2Match) {
      part2 = part2Match[1].trim()
    }

    // Extract related articles
    if (articlesMatch) {
      const articlesText = articlesMatch[1].trim()
      relatedArticles = parseRelatedContent(articlesText, 'article')
    }

    // Extract related videos
    if (videosMatch) {
      const videosText = videosMatch[1].trim()
      relatedVideos = parseRelatedContent(videosText, 'video')
    }

    // If no explicit parts found, try to extract code blocks for part2
    if (!part2) {
      const codeBlockMatch = aiResponse.match(/```(\w+)?\n([\s\S]*?)```/g)
      if (codeBlockMatch) {
        part2 = codeBlockMatch.join('\n\n')
        // Remove code blocks from part1
        part1 = aiResponse.replace(/```(\w+)?\n([\s\S]*?)```/g, '').trim()
      }
    }

    // Clean up part1 (remove any remaining markers)
    part1 = part1.replace(/^(PART1:\s*)/i, '').trim()
    part2 = part2.replace(/^(PART2:\s*)/i, '').trim()

    // If part1 is empty, use the full response
    if (!part1) {
      part1 = aiResponse
    }

    // If no related content was extracted, generate fallback suggestions
    if (relatedArticles.length === 0) {
      relatedArticles = generateFallbackArticles(avatarType)
    }
    if (relatedVideos.length === 0) {
      relatedVideos = generateFallbackVideos(avatarType)
    }

    console.log('API Response generated successfully:', {
      part1Length: part1.length,
      part2Length: part2.length,
      avatarType,
      sessionId,
      historyLength: history.length + 2, // +2 for current user and AI messages
      articlesCount: relatedArticles.length,
      videosCount: relatedVideos.length
    })

    return res.status(200).json({
      part1,
      part2,
      avatarType,
      sessionId,
      relatedArticles,
      relatedVideos,
      success: true
    })

  } catch (error) {
    console.error('❌ API Error:', error)
    
    // Return fallback response for errors
    const { avatarType, sessionId } = req.body || {}
    const avatarConfig = avatarType ? AVATAR_CONFIG[avatarType] : null
    
    let fallbackResponse = ''
    let errorType = 'Service temporarily unavailable'
    
    // Check for specific error types and provide better responses
    if (error.message && error.message.includes('429')) {
      // Quota exceeded - provide helpful information
      errorType = 'API quota exceeded'
      const quotaInfo = getQuotaStatus()
      fallbackResponse = `I apologize, but I've reached my daily limit for AI responses. ${quotaInfo.message}

${quotaInfo.details}
${quotaInfo.resetTime}

However, I can still help you with educational resources! Here are some relevant articles and videos to learn about your topic.

${quotaInfo.alternatives[0]}
${quotaInfo.alternatives[1]}
${quotaInfo.alternatives[2]}`
    } else if (error.message && error.message.includes('timeout')) {
      // API timeout
      errorType = 'Request timeout'
      fallbackResponse = `I apologize, but the request took too long to process. This might be due to high demand or network issues.

Please try asking your question again in a moment, or explore the suggested resources below for immediate learning.`
    } else if (error.message && error.message.includes('network') || error.message.includes('fetch')) {
      // Network error
      errorType = 'Network error'
      fallbackResponse = `I apologize, but there seems to be a network connection issue. Please check your internet connection and try again.

In the meantime, you can explore the suggested resources below to continue learning.`
    } else {
      // Generic error - use intelligent fallback
      errorType = 'Service temporarily unavailable'
      fallbackResponse = generateIntelligentFallback(avatarType, prompt)
    }
    
    // Generate fallback content for the specific avatar type
    const relatedArticles = generateFallbackArticles(avatarType)
    const relatedVideos = generateFallbackVideos(avatarType)
    
    return res.status(200).json({
      part1: fallbackResponse,
      part2: '',
      avatarType,
      sessionId,
      relatedArticles,
      relatedVideos,
      success: false,
      error: errorType
    })
  }
} 