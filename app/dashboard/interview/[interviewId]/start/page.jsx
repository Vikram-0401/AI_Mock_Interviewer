"use client";
import { db } from "@/utils/db";
import { MockInterview } from "@/utils/schema";
import { eq } from "drizzle-orm";
import React, { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Target,
  Trophy,
  Play,
  Pause,
} from "lucide-react";
import QuestionsSection from "./_components/QuestionsSection";
import RecordAnsSection from "./_components/RecordAnsSection";
import Link from "next/link";

function StartInterview({ params }) {
  // Unwrap params for Next.js 15 compatibility
  const { interviewId } = use(params);
  
  const [interviewData, setInterviewData] = useState();
  const [mockInterviewQuestion, setMockInterviewQuestion] = useState();
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Recording state management
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);

  useEffect(() => {
    setMounted(true);
    GetInterviewDetails();
  }, []);

  const GetInterviewDetails = async () => {
    const result = await db
      .select()
      .from(MockInterview)
      .where(eq(MockInterview.mockId, interviewId));

    const jsonMockResp = JSON.parse(result[0].jsonMockResp);
    console.log(jsonMockResp);
    setMockInterviewQuestion(jsonMockResp);
    setInterviewData(result[0]);
  };

  const handleAnswerSubmit = async (answerData) => {
    try {
      console.log("Answer submitted:", answerData);
      // Here you can add logic to save the answer to database
      // For now, we'll just log it

      // Reset recording states after successful submission
      setRecordedBlob(null);
      setAudioUrl(null);
      setIsRecording(false);

      // Move to next question
      if (activeQuestionIndex < mockInterviewQuestion?.length - 1) {
        setActiveQuestionIndex(activeQuestionIndex + 1);
      }
    } catch (error) {
      console.error("Error handling answer submission:", error);
    }
  };

  const handleQuestionChange = (questionIndex) => {
    setActiveQuestionIndex(questionIndex);
  };

  const progressPercentage = mockInterviewQuestion
    ? ((activeQuestionIndex + 1) / mockInterviewQuestion.length) * 100
    : 0;

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Mock Interview Session
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {interviewData?.role || "Technical Interview"} •{" "}
                {interviewData?.company || "Company"}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 dark:border-slate-700/50">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Question {activeQuestionIndex + 1} of{" "}
                  {mockInterviewQuestion?.length || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Started
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Complete
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Questions Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <QuestionsSection
              mockInterviewQuestion={mockInterviewQuestion}
              activeQuestionIndex={activeQuestionIndex}
              onQuestionChange={handleQuestionChange}
            />
          </motion.div>

          {/* Recording Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <RecordAnsSection
              currentQuestion={
                mockInterviewQuestion?.[activeQuestionIndex]?.question || ""
              }
              onAnswerSubmit={handleAnswerSubmit}
              isRecording={isRecording}
              setIsRecording={setIsRecording}
              recordedBlob={recordedBlob}
              setRecordedBlob={setRecordedBlob}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
              audioUrl={audioUrl}
              setAudioUrl={setAudioUrl}
            />
          </motion.div>
        </div>

        {/* Navigation Footer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12"
        >
          <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  {activeQuestionIndex > 0 && (
                    <Button
                      onClick={() =>
                        setActiveQuestionIndex(activeQuestionIndex - 1)
                      }
                      variant="outline"
                      className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous Question
                    </Button>
                  )}
                </div>

                <div className="flex items-center space-x-4">
                  {activeQuestionIndex < mockInterviewQuestion?.length - 1 && (
                    <Button
                      onClick={() =>
                        setActiveQuestionIndex(activeQuestionIndex + 1)
                      }
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      Next Question
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}

                  {activeQuestionIndex ===
                    mockInterviewQuestion?.length - 1 && (
                    <Link
                      href={
                        "/dashboard/interview/" +
                        interviewData?.mockId +
                        "/feedback"
                      }
                    >
                      <Button className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white">
                        <Trophy className="w-4 h-4 mr-2" />
                        End Interview
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

export default StartInterview;
