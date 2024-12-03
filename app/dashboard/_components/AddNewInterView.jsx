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
import { LoaderCircle } from "lucide-react";
import { MockInterview } from "@/utils/schema";
import { v4 as uuidv4 } from "uuid";
import { useUser } from "@clerk/nextjs";
import moment from "moment";
import { db } from "@/utils/db";
import { useRouter } from "next/navigation";

function AddNewInterView() {
  const [openDailog, setOpenDailog] = useState(false); // Keep original naming
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
      const response = await result.response.text();

      console.log("Raw AI Response:", response);

      const parsedJson = cleanJsonString(response);

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
          setOpenDailog(false); // Fixed: using correct state setter
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
      <div
        className="p-10 border rounded-lg bg-slate-300 hover:scale-105 hover:shadow cursor-pointer transition-all"
        onClick={() => setOpenDailog(true)}
      >
        <h2 className="text-lg text-center">+ Add New</h2>
      </div>
      <Dialog open={openDailog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl">
              Tell us more about your job Interview
            </DialogTitle>
            <DialogDescription>
            <form onSubmit={onSubmit}>
  <div>
    <h2 className="font-semibold">
      <strong>Add Details about your Job position/role, Job description and years of experience</strong>
    </h2>

    {error && (
      <div className="text-red-500 my-2 text-sm">{error}</div>
    )}

    <div className="mt-7 my-3">
      <label className="font-semibold">Job Role/Job Position</label>
      <Input
        placeholder="Ex: Full Stack Developer"
        required
        onChange={(event) => setJobPosition(event.target.value)}
      />
    </div>

    <div className="my-3">
      <label className="font-semibold">Job Description/Tech Stack (In Short)</label>
      <Textarea
        placeholder="Ex: React, Angular, NextJs, Mysql"
        required
        onChange={(event) => setJobDesc(event.target.value)}
      />
    </div>
    
    <div className="my-3">
      <label className="font-semibold">Years of Experience</label>
      <Input
        placeholder="Ex: 5"
        type="number"
        max="100"
        required
        onChange={(event) => setExperience(event.target.value)}
      />
    </div>
  </div>

  <div className="flex gap-5 justify-end">
    <Button
      type="button"
      variant="ghost"
      onClick={() => setOpenDailog(false)}
    >
      Cancel
    </Button>
    <Button type="submit" disabled={loading}>
      {loading ? (
        <div className="flex items-center gap-2">
          <LoaderCircle className="animate-spin" />
          <span>Generating From AI</span>
        </div>
      ) : (
        "Start Interview"
      )}
    </Button>
  </div>
</form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddNewInterView;
