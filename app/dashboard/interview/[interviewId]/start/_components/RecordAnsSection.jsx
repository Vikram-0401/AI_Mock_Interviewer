"use client";
import Webcam from "react-webcam";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import useSpeechToText from "react-hook-speech-to-text";
import { Mic } from "lucide-react";
import { toast } from "sonner";
import { chatSession } from "@/utils/GeminiAiModel";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { useUser } from "@clerk/nextjs";
import moment from "moment";

function RecordAnsSection({
  mockInterviewQuestion,
  activeQuestionIndex,
  interviewData,
}) {
  const [userAnswer, setUserAnswer] = useState("");
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const {
    error,
    interimResult,
    isRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
    setResults,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
  });

  useEffect(() => {
    if (results.length > 0) {
      setUserAnswer(
        (prevAns) => prevAns + results[results.length - 1]?.transcript
      );
    }
  }, [results]);

  useEffect(() => {
    if (!isRecording && userAnswer.length > 10) {
      UpdateUserAnswer();
    }
  }, [isRecording]);

  const StartStopRecording = () => {
    if (isRecording) {
      stopSpeechToText();
    } else {
      startSpeechToText();
    }
  };

  const UpdateUserAnswer = async () => {
    try {
      setLoading(true);

      const currentQuestion =
        mockInterviewQuestion[activeQuestionIndex]?.question;
      if (!currentQuestion) {
        throw new Error("Question not found");
      }

      // More explicit prompt to ensure proper JSON formatting
      const feedbackPrompt = `
        You are an AI interviewer evaluating the following response:
        
        Question: "${currentQuestion}"
        Answer: "${userAnswer}"
        
        Provide a rating and feedback in valid JSON format using exactly this structure:
        {
          "rating": [a number between 1 and 10],
          "feedback": [2-3 sentences of constructive feedback]
        }
        
        Important: Respond ONLY with the JSON object, no additional text or markdown.
      `;

      const result = await chatSession.sendMessage(feedbackPrompt);
      const responseText = result.response.text();

      // // Log the raw response for debugging
      // console.log("Raw AI Response:", responseText);

      // Clean up the response
      let cleanJson = responseText
        .replace(/```json\s*|\s*```/g, "") // Remove code blocks
        .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
        .replace(/^\s+|\s+$/g, "") // Trim whitespace
        .replace(/\n/g, " ") // Remove newlines
        .trim();

      console.log("Cleaned JSON string:", cleanJson);

      let JsonFeedbackResponse;
      try {
        JsonFeedbackResponse = JSON.parse(cleanJson);
        console.log("Parsed JSON:", JsonFeedbackResponse);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error(`Failed to parse AI response: ${parseError.message}`);
      }

      // Validate the response structure
      if (typeof JsonFeedbackResponse?.rating !== "number") {
        throw new Error("Rating must be a number");
      }
      if (
        typeof JsonFeedbackResponse?.feedback !== "string" ||
        !JsonFeedbackResponse.feedback.trim()
      ) {
        throw new Error("Feedback must be a non-empty string");
      }

      // Format the rating to ensure it's within bounds
      const rating = Math.min(
        Math.max(Math.round(JsonFeedbackResponse.rating), 1),
        10
      );

      const resp = await db.insert(UserAnswer).values({
        mockIdRef: interviewData?.mockId,
        question: currentQuestion,
        correctAns: mockInterviewQuestion[activeQuestionIndex]?.answer,
        userAns: userAnswer,
        feedback: JsonFeedbackResponse.feedback.trim(),
        rating: rating,
        userEmail: user?.primaryEmailAddress?.emailAddress,
        createdAt: moment().format("DD-MM-YYYY"),
      });

      toast.success("Answer recorded successfully");
      setUserAnswer("");
      setResults([]);
    } catch (error) {
      console.error("Error updating answer:", error);

      // More specific error messages
      if (error.message.includes("JSON")) {
        toast.error("Failed to process AI response. Please try again.");
      } else if (error.message.includes("rating")) {
        toast.error("Invalid rating in AI response. Please try again.");
      } else if (error.message.includes("feedback")) {
        toast.error("Invalid feedback in AI response. Please try again.");
      } else {
        toast.error(error.message || "Failed to record answer");
      }
    } finally {
      setLoading(false);
    }
  };

  // Add a debug button in development
  const debugUserAnswer = () => {
    console.log(
      "Current Question:",
      mockInterviewQuestion[activeQuestionIndex]?.question
    );
    console.log("User Answer:", userAnswer);
    console.log("Interview Data:", interviewData);
  };

  return (
    <div className="flex items-center justify-center flex-col">
      <div className="flex flex-col mt-20 justify-center items-center bg-primary rounded-lg p-5">
        <Webcam
          mirrored={true}
          style={{
            height: 300,
            width: "100%",
            zIndex: 10,
          }}
        />
      </div>
      <Button
        disabled={loading}
        variant="outline"
        className="my-10"
        onClick={StartStopRecording}
      >
        {isRecording ? (
          <div className="flex items-center gap-2 text-red-600">
            <Mic /> Stop Recording
          </div>
        ) : (
          "Record Answer"
        )}
      </Button>
      {process.env.NODE_ENV === "development" && (
        <Button
          onClick={debugUserAnswer}
          variant="ghost"
          size="sm"
          className="mt-2"
        >
          Debug Info
        </Button>
      )}
    </div>
  );
}

export default RecordAnsSection;
