"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { chatSession } from "@/utils/GeminiAiModel";
import { LoaderCircle, Play, Zap, Target, Award } from "lucide-react";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { db } from "@/utils/db";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

function AddNewInterView() {
  const [openDailog, setOpenDailog] = useState(false);
  const [jobPosition, setJobPosition] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobExperience, setExperience] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { user } = useUser();
  const router = useRouter();

  const cleanJsonString = (str) => {
    console.log("Original response:", str);

    // Remove all occurrences of "```json", "```", and any language specifier
    str = str.replace(/```(?:json|javascript|js|)?\n?/g, "");
    console.log("After removing code blocks:", str);

    // Remove any leading/trailing whitespace
    str = str.trim();
    console.log("After trimming:", str);

    try {
      // Try parsing as is first
      return JSON.parse(str);
    } catch (e) {
      console.log("First parse attempt failed:", e);
      try {
        // If that fails, try to find and extract just the JSON array/object
        const match = str.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
        if (match) {
          const extracted = match[0];
          console.log("Extracted JSON:", extracted);
          return JSON.parse(extracted);
        }
      } catch (e) {
        console.log("Second parse attempt failed:", e);
        throw new Error("Failed to parse JSON response from AI");
      }
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const InputPrompt = `Job Position: ${jobPosition}, Job Description: ${jobDesc}, Years of Experience: ${jobExperience} 
      Please provide ${process.env.NEXT_PUBLIC_INTERVIEW_QUESTION_COUNT} interview questions with answers in the following JSON format:
      [
        {
          "question": "question text here",
          "answer": "answer text here"
        }
      ]
      Please ensure the response is valid JSON without any markdown or code block formatting.`;

      const result = await chatSession.sendMessage(InputPrompt);
      const response = await result.response;

      console.log("Raw AI Response:", response);

      // Extract the text content from the response
      const responseText = response.text();
      console.log("Response text:", responseText);

      const parsedJson = cleanJsonString(responseText);

      if (parsedJson) {
        const resp = await db
          .insert(MockInterview)
          .values({
            mockId: uuidv4(),
            jsonMockResp: JSON.stringify(parsedJson),
            jobPosition,
            jobDesc,
            jobExperience,
            createdBy: user?.primaryEmailAddress?.emailAddress,
            createdAt: moment().format("DD-MM-yyyy"),
          })
          .returning({ mockId: MockInterview.mockId });

        if (resp && resp[0]?.mockId) {
          setOpenDailog(false);
          router.push(`/dashboard/interview/${resp[0].mockId}`);
        } else {
          setError("Failed to create interview session");
        }
      }
    } catch (error) {
      console.error("Error processing interview:", error);
      setError(`Failed to process interview questions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="relative group cursor-pointer"
        onClick={() => setOpenDailog(true)}
      >
        <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-6 hover:bg-white/30 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:bg-white/30 transition-all duration-300">
              <Play className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Start New Interview
              </h3>
              <p className="text-blue-100 text-sm">
                Create custom interview session
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <Dialog open={openDailog} onOpenChange={setOpenDailog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-2xl text-center mb-2">
              🚀 Create Your Mock Interview
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600 dark:text-gray-300">
              Tell us about your job position and we'll generate AI-powered
              questions tailored just for you.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Features Preview */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-xl">
              <div className="text-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                  AI-Powered
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-xs font-medium text-green-800 dark:text-green-200">
                  Role-Specific
                </p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xs font-medium text-purple-800 dark:text-purple-200">
                  Instant Feedback
                </p>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <p className="text-red-600 dark:text-red-300 text-sm">
                  {error}
                </p>
              </motion.div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  🎯 Job Role / Position
                </label>
                <Input
                  placeholder="e.g., Full Stack Developer, DevOps Engineer, Product Manager"
                  required
                  value={jobPosition}
                  onChange={(event) => setJobPosition(event.target.value)}
                  className="border-gray-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  🛠️ Tech Stack & Skills
                </label>
                <Textarea
                  placeholder="e.g., React, Node.js, AWS, Docker, Kubernetes, Agile methodologies"
                  required
                  value={jobDesc}
                  onChange={(event) => setJobDesc(event.target.value)}
                  className="border-gray-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 min-h-[80px] dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                  ⏰ Years of Experience
                </label>
                <Input
                  placeholder="e.g., 3"
                  type="number"
                  max="100"
                  min="0"
                  required
                  value={jobExperience}
                  onChange={(event) => setExperience(event.target.value)}
                  className="border-gray-300 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-500 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpenDailog(false)}
                className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <LoaderCircle className="animate-spin w-4 h-4" />
                    <span>Generating Questions...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    <span>Start Interview</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewInterView;
