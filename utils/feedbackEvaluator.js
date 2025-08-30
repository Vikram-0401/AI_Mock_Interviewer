import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export class FeedbackEvaluator {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async evaluateAnswer(questionData, userAnswer) {
    try {
      const prompt = this.createEvaluationPrompt(questionData, userAnswer);
      
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse the AI response
      const evaluation = this.parseAIResponse(text);
      
      return {
        success: true,
        evaluation: evaluation
      };
    } catch (error) {
      console.error("Error evaluating answer:", error);
      return {
        success: false,
        error: error.message,
        evaluation: this.getDefaultEvaluation()
      };
    }
  }

  createEvaluationPrompt(questionData, userAnswer) {
    return `You are an expert technical interviewer evaluating a candidate's response. Please provide a comprehensive evaluation in the following JSON format:

Question: ${questionData.question}
Expected Answer: ${questionData.expectedAnswer}
Candidate's Answer: ${userAnswer}
Question Category: ${questionData.category || 'technical'}
Difficulty Level: ${questionData.difficulty || 'mid'}

Please evaluate this response and provide feedback in the following JSON format (ensure it's valid JSON without markdown):

{
  "rating": [number between 1-10],
  "aiFeedback": "Detailed, constructive feedback explaining the score and areas for improvement",
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
  }

  parseAIResponse(text) {
    try {
      // Clean the response text
      const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // Try to parse the JSON
      const evaluation = JSON.parse(cleanedText);
      
      // Validate the evaluation structure
      return this.validateEvaluation(evaluation);
    } catch (error) {
      console.error("Error parsing AI response:", error);
      return this.getDefaultEvaluation();
    }
  }

  validateEvaluation(evaluation) {
    const defaultEval = this.getDefaultEvaluation();
    
    // Ensure all required fields exist
    return {
      rating: evaluation.rating || defaultEval.rating,
      aiFeedback: evaluation.aiFeedback || defaultEval.aiFeedback,
      strengths: Array.isArray(evaluation.strengths) ? evaluation.strengths : defaultEval.strengths,
      areasForImprovement: Array.isArray(evaluation.areasForImprovement) ? evaluation.areasForImprovement : defaultEval.areasForImprovement,
      specificSuggestions: Array.isArray(evaluation.specificSuggestions) ? evaluation.specificSuggestions : defaultEval.specificSuggestions,
      technicalAccuracy: evaluation.technicalAccuracy || defaultEval.technicalAccuracy,
      communication: evaluation.communication || defaultEval.communication,
      problemSolving: evaluation.problemSolving || defaultEval.problemSolving,
      overallAssessment: evaluation.overallAssessment || defaultEval.overallAssessment
    };
  }

  getDefaultEvaluation() {
    return {
      rating: 5,
      aiFeedback: "Unable to generate AI feedback. Please review your answer against the expected response.",
      strengths: ["Attempted to answer the question"],
      areasForImprovement: ["Could improve clarity and depth"],
      specificSuggestions: ["Practice explaining technical concepts clearly"],
      technicalAccuracy: 5,
      communication: 5,
      problemSolving: 5,
      overallAssessment: "Basic response provided. Consider adding more specific examples and technical details."
    };
  }

  async evaluateAllAnswers(answers) {
    const evaluations = [];
    
    for (const answer of answers) {
      const evaluation = await this.evaluateAnswer(answer, answer.userAnswer);
      evaluations.push({
        ...answer,
        evaluation: evaluation.evaluation
      });
    }
    
    return evaluations;
  }
}

// Export a singleton instance
export const feedbackEvaluator = new FeedbackEvaluator();
