"use client";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
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
} from "lucide-react";
import { useRouter } from "next/navigation";

function Feedback({ params }) {
  // Unwrap params for Next.js 15 compatibility
  const { interviewId } = use(params);

  const [feedbackList, setFeedbackList] = useState([]);
  const [expandedItems, setExpandedItems] = useState({});
  const [overallRating, setOverallRating] = useState(0);
  const router = useRouter();

  useEffect(() => {
    GetFeedback();
  }, []);

  const GetFeedback = async () => {
    const result = await db
      .select()
      .from(UserAnswer)
      .where(eq(UserAnswer.mockIdRef, interviewId))
      .orderBy(UserAnswer.id);

    console.log(result);
    setFeedbackList(result);

    // Calculate overall rating
    if (result.length > 0) {
      const totalRating = result.reduce(
        (sum, item) => sum + (item.rating || 0),
        0
      );
      const averageRating = totalRating / result.length;
      setOverallRating(Math.round(averageRating * 10) / 10);
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
            🎉 Congratulations! Interview Complete!
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            You've successfully completed your mock interview. Here's your
            detailed feedback and performance analysis.
          </p>
        </motion.div>

        {/* Overall Performance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-xl bg-gradient-to-r from-green-500 to-teal-600 overflow-hidden">
            <CardContent className="p-8 text-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-yellow-300" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Overall Rating</h3>
                  <div className="text-4xl font-bold text-yellow-300">
                    {overallRating}/10
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-blue-200" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    Questions Answered
                  </h3>
                  <div className="text-4xl font-bold text-blue-200">
                    {feedbackList.length}
                  </div>
                </div>

                <div className="text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-green-200" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Performance</h3>
                  <div className="text-2xl font-bold text-green-200">
                    {getRatingText(overallRating)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <span>Performance Breakdown</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Overall Progress
                  </span>
                  <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    {Math.round((overallRating / 10) * 100)}%
                  </span>
                </div>
                <Progress value={(overallRating / 10) * 100} className="h-3" />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Beginner (0-3)</span>
                  <span>Intermediate (4-6)</span>
                  <span>Advanced (7-8)</span>
                  <span>Expert (9-10)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Detailed Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            <span>Detailed Question Analysis</span>
          </h2>

          <div className="space-y-4">
            {feedbackList.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * index }}
              >
                <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                  <CardHeader
                    className="cursor-pointer"
                    onClick={() => toggleExpanded(index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg text-gray-900 dark:text-white mb-2">
                          Question {index + 1}
                        </CardTitle>
                        <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
                          {item.question}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant="secondary"
                          className={`${getRatingBgColor(
                            item.rating
                          )} ${getRatingColor(item.rating)}`}
                        >
                          {item.rating}/10
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                          {expandedItems[index] ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {expandedItems[index] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <CardContent className="pt-0 space-y-4">
                        {/* Your Answer */}
                        <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                          <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2 flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>Your Answer</span>
                          </h4>
                          <p className="text-red-700 dark:text-red-300 text-sm">
                            {item.userAns || "No answer recorded"}
                          </p>
                        </div>

                        {/* Correct Answer */}
                        <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                          <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>Expected Answer</span>
                          </h4>
                          <p className="text-green-700 dark:text-green-200 text-sm">
                            {item.correctAns || "No expected answer provided"}
                          </p>
                        </div>

                        {/* Feedback */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2 flex items-center space-x-2">
                            <Award className="w-4 h-4" />
                            <span>AI Feedback</span>
                          </h4>
                          <p className="text-blue-700 dark:text-blue-200 text-sm">
                            {item.feedback || "No feedback available"}
                          </p>
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => router.push("/dashboard")}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>

            <Button
              onClick={() => router.push("/dashboard/interview/new")}
              variant="outline"
              size="lg"
              className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
            >
              <Target className="w-5 h-5 mr-2" />
              Practice Again
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default Feedback;
