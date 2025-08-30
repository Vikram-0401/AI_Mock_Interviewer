"use client";
import { db } from "@/utils/db";
import { MockInterview, UserAnswer } from "@/utils/schema";
import { eq } from "drizzle-orm";
import React, { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trophy,
  Star,
  CheckCircle,
  AlertCircle,
  Home,
  TrendingUp,
  Award,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Play,
  Mic,
  Clock,
  Brain,
  MessageSquare,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { feedbackEvaluator } from "@/utils/feedbackEvaluator";
import { toast } from "sonner";

function Feedback({ params }) {
  // Unwrap params for Next.js 15 compatibility
  const { interviewId } = use(params);

  const [feedbackList, setFeedbackList] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [overallRating, setOverallRating] = useState(0);
  const [interviewData, setInterviewData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    GetFeedback();
  }, []);

  const GetFeedback = async () => {
    try {
      setIsLoading(true);
      
      // Get interview details
      const interviewResult = await db
        .select()
        .from(MockInterview)
        .where(eq(MockInterview.mockId, interviewId));

      if (interviewResult.length > 0) {
        setInterviewData(interviewResult[0]);
      }

      // Get user answers
      const answersResult = await db
      .select()
      .from(UserAnswer)
      .where(eq(UserAnswer.mockIdRef, interviewId))
      .orderBy(UserAnswer.id);

      console.log("User answers:", answersResult);
      setFeedbackList(answersResult);

      // Calculate overall rating from evaluated answers
      const evaluatedAnswers = answersResult.filter(answer => answer.rating);
      if (evaluatedAnswers.length > 0) {
        const totalRating = evaluatedAnswers.reduce(
          (sum, item) => sum + (parseInt(item.rating) || 0),
          0
        );
        const averageRating = totalRating / evaluatedAnswers.length;
        setOverallRating(Math.round(averageRating * 10) / 10);
      }
    } catch (error) {
      console.error("Error fetching feedback:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const evaluateAllAnswers = async () => {
    try {
      setIsEvaluating(true);
      setEvaluationProgress(0);
      
      const totalAnswers = feedbackList.length;
      let evaluatedCount = 0;
      
      for (const answer of feedbackList) {
        // Skip if already evaluated
        if (answer.rating) {
          evaluatedCount++;
          setEvaluationProgress((evaluatedCount / totalAnswers) * 100);
          continue;
        }

        try {
          // Prepare question data for evaluation
          const questionData = {
            question: answer.question,
            expectedAnswer: answer.expectedAnswer,
            category: answer.category || 'technical',
            difficulty: answer.difficulty || 'mid'
          };

          // Get AI evaluation
          const evaluation = await feedbackEvaluator.evaluateAnswer(questionData, answer.userAnswer);
          
          if (evaluation.success) {
            // Update the answer in the database
            await db
              .update(UserAnswer)
              .set({
                rating: evaluation.evaluation.rating,
                aiFeedback: evaluation.evaluation.aiFeedback,
                strengths: JSON.stringify(evaluation.evaluation.strengths),
                areasForImprovement: JSON.stringify(evaluation.evaluation.areasForImprovement),
                specificSuggestions: JSON.stringify(evaluation.evaluation.specificSuggestions),
                technicalAccuracy: evaluation.evaluation.technicalAccuracy,
                communication: evaluation.evaluation.communication,
                problemSolving: evaluation.evaluation.problemSolving,
                overallAssessment: evaluation.evaluation.overallAssessment,
                evaluatedAt: new Date().toISOString()
              })
              .where(eq(UserAnswer.id, answer.id));

            // Update local state
            setFeedbackList(prev => prev.map(item => 
              item.id === answer.id 
                ? { ...item, ...evaluation.evaluation, evaluatedAt: new Date().toISOString() }
                : item
            ));
          }
        } catch (error) {
          console.error(`Error evaluating answer ${answer.id}:`, error);
        }

        evaluatedCount++;
        setEvaluationProgress((evaluatedCount / totalAnswers) * 100);
        
        // Small delay to prevent overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Recalculate overall rating
      const updatedAnswers = feedbackList.map(answer => ({
        ...answer,
        rating: answer.rating || 5 // Default rating for failed evaluations
      }));

      if (updatedAnswers.length > 0) {
        const totalRating = updatedAnswers.reduce(
          (sum, item) => sum + (parseInt(item.rating) || 0),
          0
        );
        const averageRating = totalRating / updatedAnswers.length;
      setOverallRating(Math.round(averageRating * 10) / 10);
      }

      toast.success("All answers have been evaluated!");
    } catch (error) {
      console.error("Error evaluating answers:", error);
      toast.error("Failed to evaluate some answers. Please try again.");
    } finally {
      setIsEvaluating(false);
      setEvaluationProgress(0);
    }
  };

  const toggleExpanded = (index) => {
    setExpandedItems((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getRatingColor = (rating) => {
    if (rating >= 8) return "text-green-600 dark:text-green-400";
    if (rating >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getRatingBgColor = (rating) => {
    if (rating >= 8) return "bg-green-100 dark:bg-green-900";
    if (rating >= 6) return "bg-yellow-100 dark:bg-yellow-900";
    return "bg-red-100 dark:bg-red-900";
  };

  const getRatingText = (rating) => {
    if (rating >= 8) return "Excellent!";
    if (rating >= 6) return "Good Job!";
    return "Keep Practicing!";
  };

  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'technical': return <Zap className="w-4 h-4" />;
      case 'behavioral': return <Brain className="w-4 h-4" />;
      case 'system_design': return <Target className="w-4 h-4" />;
      case 'problem_solving': return <Lightbulb className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-screen">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center">
              <Trophy className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Interview Results
          </h1>
          {interviewData && (
            <div className="mb-6">
              <h2 className="text-xl text-gray-700 dark:text-gray-300 mb-2">
                {interviewData.jobPosition} • {interviewData.jobExperience} years
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {interviewData.jobDesc}
              </p>
            </div>
          )}
          
          {/* Overall Score */}
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto border border-white/20 dark:border-slate-700/50">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {overallRating}/10
              </div>
              <div className="text-lg text-gray-700 dark:text-gray-300 mb-4">
                {getRatingText(overallRating)}
              </div>
              <Progress value={overallRating * 10} className="h-3 mb-4" />
              <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Evaluation Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    AI Evaluation Status
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {feedbackList.filter(a => a.rating).length} of {feedbackList.length} answers evaluated
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {isEvaluating && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(evaluationProgress)}%
                      </span>
                  </div>
                  )}
                  <Button
                    onClick={evaluateAllAnswers}
                    disabled={isEvaluating}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    {isEvaluating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Evaluating...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Evaluate All Answers
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Feedback List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          {feedbackList.map((feedback, index) => (
            <Card
              key={feedback.id}
              className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
            >
            <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                        {index + 1}
                      </div>
                      <Badge variant="outline" className="flex items-center space-x-1">
                        {getCategoryIcon(feedback.category)}
                        <span className="capitalize">{feedback.category || 'general'}</span>
                      </Badge>
                      <Badge variant="outline">
                        {feedback.difficulty || 'mid'} level
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      {feedback.question}
              </CardTitle>
                  </div>
                  {feedback.rating && (
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getRatingColor(feedback.rating)}`}>
                        {feedback.rating}/10
                      </div>
                      <div className={`text-sm ${getRatingColor(feedback.rating)}`}>
                        {getRatingText(feedback.rating)}
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Expected vs User Answer */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2 text-blue-600" />
                      Expected Answer
                    </h4>
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-gray-800 dark:text-gray-200 text-sm">
                        {feedback.expectedAnswer}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Mic className="w-4 h-4 mr-2 text-green-600" />
                      Your Answer
                    </h4>
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-gray-800 dark:text-gray-200 text-sm">
                        {feedback.userAnswer}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Feedback */}
                {feedback.rating ? (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                      <Brain className="w-4 h-4 mr-2 text-purple-600" />
                      AI Evaluation & Feedback
                    </h4>

        {/* Detailed Feedback */}
                    <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <p className="text-gray-800 dark:text-gray-200 mb-4">
                        {feedback.aiFeedback}
                      </p>
                      
                      {/* Detailed Scores */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                            {feedback.technicalAccuracy}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Technical Accuracy
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-green-600 dark:text-green-400">
                            {feedback.communication}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Communication
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                            {feedback.problemSolving}/10
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Problem Solving
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Details */}
                    <div>
                        <Button
                        variant="outline"
                        onClick={() => toggleExpanded(index)}
                        className="w-full"
                        >
                          {expandedItems[index] ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-2" />
                            Hide Details
                          </>
                          ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-2" />
                            Show Detailed Feedback
                          </>
                          )}
                        </Button>

                  {expandedItems[index] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                          className="mt-4 space-y-4"
                        >
                          {/* Strengths */}
                          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                            <h5 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                              Strengths
                            </h5>
                            <ul className="list-disc list-inside space-y-1 text-green-700 dark:text-green-300">
                              {JSON.parse(feedback.strengths || '[]').map((strength, idx) => (
                                <li key={idx}>{strength}</li>
                              ))}
                            </ul>
                          </div>
                          
                          {/* Areas for Improvement */}
                          <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                            <h5 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                              Areas for Improvement
                            </h5>
                            <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                              {JSON.parse(feedback.areasForImprovement || '[]').map((area, idx) => (
                                <li key={idx}>{area}</li>
                              ))}
                            </ul>
                        </div>

                          {/* Specific Suggestions */}
                          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                            <h5 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                              Specific Suggestions
                            </h5>
                            <ul className="list-disc list-inside space-y-1 text-blue-700 dark:text-blue-300">
                              {JSON.parse(feedback.specificSuggestions || '[]').map((suggestion, idx) => (
                                <li key={idx}>{suggestion}</li>
                              ))}
                            </ul>
                        </div>

                          {/* Overall Assessment */}
                          <div className="bg-gray-50 dark:bg-gray-950/20 p-4 rounded-lg border border-gray-200 dark:border-gray-800">
                            <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                              Overall Assessment
                            </h5>
                            <p className="text-gray-700 dark:text-gray-300">
                              {feedback.overallAssessment}
                          </p>
                        </div>
                    </motion.div>
                  )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Brain className="w-8 h-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Pending AI Evaluation
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      This answer hasn't been evaluated yet. Click "Evaluate All Answers" above to get AI feedback.
                    </p>
                  </div>
                )}
              </CardContent>
                </Card>
            ))}
        </motion.div>

        {/* Navigation Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <div className="flex justify-center space-x-4">
            <Button
              onClick={() => router.push('/dashboard')}
              variant="outline"
              className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
            >
              <Home className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button
              onClick={() => router.push('/dashboard/interview/new')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Play className="w-4 h-4 mr-2" />
              Start New Interview
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Feedback;
