import { Lightbulb, Volume2, Target, Clock, CheckCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function QuestionsSection({ mockInterviewQuestion, activeQuestionIndex, onQuestionChange }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const synth = window.speechSynthesis;

      const populateVoices = () => {
        const availableVoices = synth.getVoices();
        setVoices(availableVoices);
        // Select a more natural-sounding voice
        if (availableVoices.length > 0 && !selectedVoice) {
          // Try to find a more natural voice (Google, Microsoft, or premium voices)
          const preferredVoice = availableVoices.find(voice => 
            voice.name.includes('Google') || 
            voice.name.includes('Microsoft') || 
            voice.name.includes('Premium') ||
            voice.name.includes('Natural') ||
            voice.name.includes('Enhanced')
          ) || availableVoices[0];
          setSelectedVoice(preferredVoice);
        }
      };

      populateVoices();
      synth.onvoiceschanged = populateVoices;
    }
  }, [selectedVoice]);

  const textToSpeech = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Stop any current speech
      window.speechSynthesis.cancel();
      
      const speech = new SpeechSynthesisUtterance(text);
      speech.voice = selectedVoice;
      
      // Improve speech quality
      speech.rate = 0.9; // Slightly slower for clarity
      speech.pitch = 1.0; // Natural pitch
      speech.volume = 1.0; // Full volume
      
      // Add pauses for better natural flow
      const enhancedText = text
        .replace(/\./g, '... ') // Add pauses after sentences
        .replace(/\!/g, '!... ') // Add pauses after exclamations
        .replace(/\?/g, '?... '); // Add pauses after questions
      
      speech.text = enhancedText;
      
      window.speechSynthesis.speak(speech);
    } else {
      alert("Sorry, your browser does not support text-to-speech");
    }
  };

  const handleQuestionClick = (questionIndex) => {
    if (onQuestionChange) {
      onQuestionChange(questionIndex);
    }
  };

  if (!mockInterviewQuestion) {
    return (
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">
            <div className="w-16 h-16 bg-gray-200 dark:bg-slate-600 rounded-full mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-1/2 mx-auto"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Question Navigation */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Target className="w-5 h-5 text-blue-600" />
            <span>Question Navigation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {mockInterviewQuestion.map((question, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div
                  onClick={() => handleQuestionClick(index)}
                  className={`p-3 rounded-xl text-center cursor-pointer transition-all duration-200 ${
                    activeQuestionIndex === index
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                      : index < activeQuestionIndex
                      ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    {index < activeQuestionIndex ? (
                      <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                    ) : (
                      <span className="text-sm font-medium">
                        {index + 1}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current Question */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
              <Clock className="w-5 h-5 text-orange-600" />
              <span>Question {activeQuestionIndex + 1}</span>
            </CardTitle>
            <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {activeQuestionIndex + 1} of {mockInterviewQuestion.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
              {mockInterviewQuestion[activeQuestionIndex]?.question}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
              <Button
                onClick={() => textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.question)}
                variant="outline"
                size="sm"
                className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Listen
              </Button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>Take your time to think</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-100 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Pro Tips for This Question
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Think about your past experiences</li>
                <li>• Use the STAR method for behavioral questions</li>
                <li>• Be specific with examples</li>
                <li>• Show enthusiasm and confidence</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuestionsSection;
