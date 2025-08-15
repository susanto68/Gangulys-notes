// Mock data generator for articles and videos based on topic and avatar type
export const generateContentSuggestions = (question, avatarType) => {
  const lowerQuestion = question.toLowerCase()
  
  // Generate articles based on avatar type and question
  const articles = generateArticles(lowerQuestion, avatarType)
  
  // Generate videos based on avatar type and question
  const videos = generateVideos(lowerQuestion, avatarType)
  
  return { articles, videos }
}

const generateArticles = (question, avatarType) => {
  const articleTemplates = {
    'computer-teacher': [
      {
        title: "Complete Guide to Programming Fundamentals",
        description: "Learn the basics of programming with practical examples and best practices for beginners.",
        thumbnailUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=200&fit=crop",
        url: "https://example.com/programming-fundamentals"
      },
      {
        title: "Modern Web Development Techniques",
        description: "Explore the latest trends in web development including React, Node.js, and modern frameworks.",
        thumbnailUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop",
        url: "https://example.com/web-development-guide"
      },
      {
        title: "Data Structures and Algorithms Explained",
        description: "Master essential data structures and algorithms with real-world applications and examples.",
        thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop",
        url: "https://example.com/data-structures-algorithms"
      },
      {
        title: "Software Engineering Best Practices",
        description: "Learn industry-standard practices for writing clean, maintainable, and scalable code.",
        thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=200&fit=crop",
        url: "https://example.com/software-engineering-practices"
      }
    ],
    'mathematics-teacher': [
      {
        title: "Understanding Mathematical Concepts",
        description: "Break down complex mathematical concepts into simple, understandable explanations.",
        thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=200&fit=crop",
        url: "https://example.com/math-concepts"
      },
      {
        title: "Problem-Solving Strategies in Mathematics",
        description: "Learn effective strategies for approaching and solving mathematical problems.",
        thumbnailUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400&h=200&fit=crop",
        url: "https://example.com/math-problem-solving"
      },
      {
        title: "Real-World Applications of Mathematics",
        description: "Discover how mathematics is applied in everyday life and various industries.",
        thumbnailUrl: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400&h=200&fit=crop",
        url: "https://example.com/math-applications"
      }
    ],
    'english-teacher': [
      {
        title: "Mastering English Grammar",
        description: "Comprehensive guide to English grammar rules and their practical applications.",
        thumbnailUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=200&fit=crop",
        url: "https://example.com/english-grammar"
      },
      {
        title: "Effective Writing Techniques",
        description: "Learn to write clearly, concisely, and persuasively for any audience.",
        thumbnailUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=200&fit=crop",
        url: "https://example.com/writing-techniques"
      },
      {
        title: "Literature Analysis and Interpretation",
        description: "Develop critical thinking skills for analyzing and interpreting literary works.",
        thumbnailUrl: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=200&fit=crop",
        url: "https://example.com/literature-analysis"
      }
    ],
    'physics-teacher': [
      {
        title: "Understanding Physics Principles",
        description: "Explore fundamental physics concepts and their applications in the real world.",
        url: "https://example.com/physics-principles"
      },
      {
        title: "Experimental Physics Methods",
        description: "Learn about scientific methods and experimental techniques in physics.",
        url: "https://example.com/experimental-physics"
      },
      {
        title: "Modern Physics and Quantum Mechanics",
        description: "Introduction to modern physics concepts including quantum mechanics and relativity.",
        url: "https://example.com/modern-physics"
      }
    ],
    'chemistry-teacher': [
      {
        title: "Chemical Reactions and Equations",
        description: "Understanding chemical reactions, balancing equations, and reaction mechanisms.",
        url: "https://example.com/chemical-reactions"
      },
      {
        title: "Organic Chemistry Fundamentals",
        description: "Introduction to organic chemistry, molecular structures, and functional groups.",
        url: "https://example.com/organic-chemistry"
      },
      {
        title: "Laboratory Safety and Techniques",
        description: "Essential safety protocols and laboratory techniques for chemistry experiments.",
        url: "https://example.com/lab-safety"
      }
    ],
    'biology-teacher': [
      {
        title: "Cell Biology and Structure",
        description: "Comprehensive overview of cell structure, function, and cellular processes.",
        url: "https://example.com/cell-biology"
      },
      {
        title: "Genetics and DNA",
        description: "Understanding genetics, DNA structure, and inheritance patterns.",
        url: "https://example.com/genetics-dna"
      },
      {
        title: "Ecosystems and Biodiversity",
        description: "Explore different ecosystems and the importance of biodiversity conservation.",
        url: "https://example.com/ecosystems-biodiversity"
      }
    ]
  }
  
  // Get articles for the specific avatar type, or default to computer-teacher
  const avatarArticles = articleTemplates[avatarType] || articleTemplates['computer-teacher']
  
  // Return 3-4 random articles
  return avatarArticles.slice(0, 3 + Math.floor(Math.random() * 2))
}

const generateVideos = (question, avatarType) => {
  const videoTemplates = {
    'computer-teacher': [
      {
        title: "Programming for Beginners",
        description: "A comprehensive introduction to programming concepts and basic coding skills.",
        duration: "15:30",
        thumbnailUrl: "https://images.unsplash.com/photo-1517077304055-6e89abbf09b0?w=400&h=200&fit=crop",
        url: "https://www.youtube.com/watch?v=example1"
      },
      {
        title: "Web Development Tutorial",
        description: "Learn HTML, CSS, and JavaScript to build modern websites from scratch.",
        duration: "22:15",
        thumbnailUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=200&fit=crop",
        url: "https://www.youtube.com/watch?v=example2"
      },
      {
        title: "Data Structures Explained",
        description: "Visual explanation of common data structures and their implementations.",
        duration: "18:45",
        thumbnailUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop",
        url: "https://www.youtube.com/watch?v=example3"
      }
    ],
    'mathematics-teacher': [
      {
        title: "Math Fundamentals",
        description: "Clear explanations of basic mathematical concepts and problem-solving techniques.",
        duration: "12:20",
        url: "https://www.youtube.com/watch?v=example4"
      },
      {
        title: "Algebra Made Easy",
        description: "Step-by-step guide to understanding and solving algebraic equations.",
        duration: "16:40",
        url: "https://www.youtube.com/watch?v=example5"
      },
      {
        title: "Geometry Concepts",
        description: "Visual learning of geometric shapes, theorems, and their applications.",
        duration: "14:30",
        url: "https://www.youtube.com/watch?v=example6"
      }
    ],
    'english-teacher': [
      {
        title: "English Grammar Basics",
        description: "Essential grammar rules and their practical applications in writing and speaking.",
        duration: "13:25",
        url: "https://www.youtube.com/watch?v=example7"
      },
      {
        title: "Writing Skills Workshop",
        description: "Improve your writing skills with practical exercises and techniques.",
        duration: "19:10",
        url: "https://www.youtube.com/watch?v=example8"
      },
      {
        title: "Literature Analysis",
        description: "How to analyze and interpret literary works effectively.",
        duration: "17:35",
        url: "https://www.youtube.com/watch?v=example9"
      }
    ],
    'physics-teacher': [
      {
        title: "Physics Fundamentals",
        description: "Introduction to basic physics concepts and principles.",
        duration: "20:15",
        url: "https://www.youtube.com/watch?v=example10"
      },
      {
        title: "Mechanics Explained",
        description: "Understanding motion, forces, and energy in mechanical systems.",
        duration: "18:50",
        url: "https://www.youtube.com/watch?v=example11"
      },
      {
        title: "Wave Physics",
        description: "Exploring wave phenomena, sound, and light waves.",
        duration: "16:20",
        url: "https://www.youtube.com/watch?v=example12"
      }
    ],
    'chemistry-teacher': [
      {
        title: "Chemistry Basics",
        description: "Introduction to chemical elements, compounds, and reactions.",
        duration: "14:45",
        url: "https://www.youtube.com/watch?v=example13"
      },
      {
        title: "Chemical Bonding",
        description: "Understanding different types of chemical bonds and molecular structures.",
        duration: "21:30",
        url: "https://www.youtube.com/watch?v=example14"
      },
      {
        title: "Laboratory Techniques",
        description: "Essential laboratory skills and safety procedures for chemistry experiments.",
        duration: "12:55",
        url: "https://www.youtube.com/watch?v=example15"
      }
    ],
    'biology-teacher': [
      {
        title: "Cell Biology",
        description: "Understanding cell structure, function, and cellular processes.",
        duration: "19:20",
        url: "https://www.youtube.com/watch?v=example16"
      },
      {
        title: "Genetics and DNA",
        description: "Introduction to genetics, DNA structure, and inheritance patterns.",
        duration: "17:40",
        url: "https://www.youtube.com/watch?v=example17"
      },
      {
        title: "Ecosystems",
        description: "Exploring different ecosystems and their interactions.",
        duration: "15:15",
        url: "https://www.youtube.com/watch?v=example18"
      }
    ]
  }
  
  // Get videos for the specific avatar type, or default to computer-teacher
  const avatarVideos = videoTemplates[avatarType] || videoTemplates['computer-teacher']
  
  // Return 2-3 random videos
  return avatarVideos.slice(0, 2 + Math.floor(Math.random() * 2))
}
