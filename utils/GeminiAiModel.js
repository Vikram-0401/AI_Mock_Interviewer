const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 0.7, // Reduced for more consistent output
  topP: 0.9,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Enhanced prompt for generating interview questions
const generateInterviewPrompt = (jobRole, techStack, yearsOfExperience) => {
  return `You are an expert technical interviewer with deep knowledge of software engineering, system design, and behavioral assessment.

Generate a comprehensive set of interview questions for a ${jobRole} position with ${yearsOfExperience} years of experience.

Tech Stack: ${techStack}

Please provide exactly 5 questions in the following JSON format:

[
  {
    "question": "Detailed question text here",
    "answer": "Comprehensive expected answer with key points, examples, and best practices",
    "category": "technical|system_design|behavioral|problem_solving",
    "difficulty": "junior|mid|senior",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
    "scoringCriteria": {
      "excellent": "9-10 points: Demonstrates deep understanding, provides specific examples, shows best practices",
      "good": "7-8 points: Shows solid understanding, provides some examples, mostly correct approach",
      "average": "5-6 points: Basic understanding, limited examples, some gaps in knowledge",
      "poor": "1-4 points: Limited understanding, no examples, significant knowledge gaps"
    }
  }
]

Guidelines:
- Questions should be appropriate for ${yearsOfExperience} years of experience
- Include a mix of technical depth, practical application, and problem-solving
- For technical questions, focus on ${techStack} and relevant technologies
- Behavioral questions should assess soft skills relevant to the role
- System design questions should match the experience level
- Each question should have clear, detailed expected answers
- Scoring criteria should be specific and actionable

Ensure the response is valid JSON without any markdown formatting.`;
};

// Enhanced prompt for generating detailed feedback
const generateFeedbackPrompt = (jobRole, techStack, answer, question, expectedAnswer, category, difficulty) => {
  return `You are an expert technical interviewer evaluating a candidate's response for a ${jobRole} position.

Question: ${question}
Expected Answer: ${expectedAnswer}
Candidate's Answer: ${answer}
Question Category: ${category}
Difficulty Level: ${difficulty}
Tech Stack: ${techStack}

Provide a comprehensive evaluation in the following JSON format:

{
  "rating": [number between 1-10],
  "feedback": "Detailed, constructive feedback explaining the score and areas for improvement",
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "areasForImprovement": ["Area 1", "Area 2", "Area 3"],
  "specificSuggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "technicalAccuracy": [number between 1-10],
  "communication": [number between 1-10],
  "problemSolving": [number between 1-10],
  "overallAssessment": "Summary of performance and recommendations"
}

Scoring Guidelines:
- 9-10: Exceptional understanding, excellent examples, demonstrates best practices
- 7-8: Strong understanding, good examples, shows good practices
- 5-6: Adequate understanding, some examples, basic practices
- 3-4: Limited understanding, few examples, gaps in knowledge
- 1-2: Poor understanding, no examples, significant knowledge gaps

Focus on:
- Technical accuracy and depth
- Practical examples and real-world application
- Problem-solving approach and methodology
- Communication clarity and structure
- Alignment with industry best practices

Provide specific, actionable feedback that helps the candidate improve.`;
};

export const chatSession = model.startChat({
  generationConfig,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ],
});

// Enhanced function to get interview questions
export async function getInterviewQuestions(jobRole, techStack, yearsOfExperience) {
  try {
    const prompt = generateInterviewPrompt(jobRole, techStack, yearsOfExperience);
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;

    // Get the text content from the response
    const responseText = response.text();

    // Clean and parse the response
    let cleanResponse = responseText
      .replace(/```json\s*|\s*```/g, "") // Remove code blocks
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
      .trim();

    // Try to find JSON in the response
    const jsonMatch = cleanResponse.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
    }

    const parsedQuestions = JSON.parse(cleanResponse);

    // Validate the structure
    if (!Array.isArray(parsedQuestions)) {
      throw new Error("Response is not an array");
    }

    // Ensure each question has required fields
    const validatedQuestions = parsedQuestions.map((q, index) => ({
      question: q.question || `Question ${index + 1}`,
      answer: q.answer || "Expected answer not provided",
      category: q.category || "technical",
      difficulty: q.difficulty || "mid",
      keyPoints: q.keyPoints || ["Key points not provided"],
      scoringCriteria: q.scoringCriteria || {
        excellent: "9-10 points: Excellent understanding",
        good: "7-8 points: Good understanding",
        average: "5-6 points: Average understanding",
        poor: "1-4 points: Needs improvement"
      }
    }));

    return validatedQuestions;
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw new Error("Failed to generate interview questions. Please try again.");
  }
}

// Enhanced function to get feedback on answers
export async function getAnswerFeedback(jobRole, techStack, answer, question, expectedAnswer, category, difficulty) {
  try {
    const prompt = generateFeedbackPrompt(jobRole, techStack, answer, question, expectedAnswer, category, difficulty);
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;

    // Get the text content from the response
    const responseText = response.text();

    // Clean and parse the response
    let cleanResponse = responseText
      .replace(/```json\s*|\s*```/g, "") // Remove code blocks
      .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
      .trim();

    // Try to find JSON in the response
    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
    }

    const parsedFeedback = JSON.parse(cleanResponse);

    // Validate and provide defaults for missing fields
    const validatedFeedback = {
      rating: Math.min(Math.max(parsedFeedback.rating || 5, 1), 10),
      feedback: parsedFeedback.feedback || "Feedback not provided",
      strengths: parsedFeedback.strengths || ["Strengths not specified"],
      areasForImprovement: parsedFeedback.areasForImprovement || ["Areas for improvement not specified"],
      specificSuggestions: parsedFeedback.specificSuggestions || ["Suggestions not provided"],
      technicalAccuracy: Math.min(Math.max(parsedFeedback.technicalAccuracy || 5, 1), 10),
      communication: Math.min(Math.max(parsedFeedback.communication || 5, 1), 10),
      problemSolving: Math.min(Math.max(parsedFeedback.problemSolving || 5, 1), 10),
      overallAssessment: parsedFeedback.overallAssessment || "Overall assessment not provided"
    };

    return validatedFeedback;
  } catch (error) {
    console.error("Error generating feedback:", error);
    throw new Error("Failed to generate feedback. Please try again.");
  }
}

// Function to get a single question with enhanced details
export async function getSingleQuestion(jobRole, techStack, yearsOfExperience, category = "technical") {
  try {
    const prompt = `Generate a single ${category} interview question for a ${jobRole} position with ${yearsOfExperience} years of experience.

Tech Stack: ${techStack}

Provide the response in this JSON format:

{
  "question": "Detailed question text",
  "answer": "Comprehensive expected answer",
  "category": "${category}",
  "difficulty": "junior|mid|senior",
  "keyPoints": ["Key point 1", "Key point 2", "Key point 3"],
  "scoringCriteria": {
    "excellent": "9-10 points: Exceptional understanding",
    "good": "7-8 points: Strong understanding", 
    "average": "5-6 points: Adequate understanding",
    "poor": "1-4 points: Limited understanding"
  }
}`;

    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;

    // Get the text content from the response
    const responseText = response.text();

    let cleanResponse = responseText
      .replace(/```json\s*|\s*```/g, "")
      .replace(/[\u201C\u201D]/g, '"')
      .trim();

    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanResponse = jsonMatch[0];
    }

    return JSON.parse(cleanResponse);
  } catch (error) {
    console.error("Error generating single question:", error);
    throw new Error("Failed to generate question. Please try again.");
  }
}