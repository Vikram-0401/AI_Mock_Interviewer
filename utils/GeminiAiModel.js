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
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

// Helper function to generate context-aware prompts
const generateInterviewPrompt = (jobRole, techStack, yearsOfExperience) => {
  return `As an interviewer, generate relevant technical and behavioral questions for a ${jobRole} position.
  
  Candidate Profile:
  - Role: ${jobRole}
  - Tech Stack: ${techStack}
  - Years of Experience: ${yearsOfExperience}
  
  Please provide:
  1. 3 technical questions specific to their tech stack and role
  2. 2 system design questions appropriate for their experience level
  3. 2 behavioral questions
  4. Expected answers and evaluation criteria
  
  Format the response in a clear, structured way.`;
};

// Helper function to generate feedback prompts
const generateFeedbackPrompt = (jobRole, techStack, answer, question) => {
  return `As a technical interviewer for a ${jobRole} position, evaluate the following answer:
  
  Question: ${question}
  Candidate's Answer: ${answer}
  
  Consider:
  - Technical accuracy
  - Problem-solving approach
  - Communication clarity
  - Relevance to ${techStack}
  
  Provide:
  1. Score (1-10)
  2. Detailed feedback
  3. Areas of improvement
  4. What was done well`;
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

// Function to get interview questions
export async function getInterviewQuestions(jobRole, techStack, yearsOfExperience) {
  try {
    const prompt = generateInterviewPrompt(jobRole, techStack, yearsOfExperience);
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw new Error("Failed to generate interview questions");
  }
}

// Function to get feedback on answers
export async function getAnswerFeedback(jobRole, techStack, answer, question) {
  try {
    const prompt = generateFeedbackPrompt(jobRole, techStack, answer, question);
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating feedback:", error);
    throw new Error("Failed to generate feedback");
  }
}