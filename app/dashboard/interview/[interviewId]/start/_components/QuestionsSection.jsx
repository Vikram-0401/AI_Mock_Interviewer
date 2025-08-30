import { Lightbulb, Volume2, Target, Clock, CheckCircle, SkipForward } from "lucide-react";
import React, { useEffect, useState, useRef } from "react";
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function QuestionsSection({ 
  mockInterviewQuestion, 
  activeQuestionIndex, 
  onQuestionChange, 
  answeredQuestions, 
  isCurrentQuestionAnswered,
  isCurrentQuestionSkipped,
  skippedQuestions
}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const speechRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const synth = window.speechSynthesis;
      synthRef.current = synth;

      const initializeVoices = () => {
        // Get all available voices
        const voices = synth.getVoices();
        
        // Look specifically for English (Received Pronunciation) voice
        let targetVoice = voices.find(voice => 
          voice.name === 'English (Received Pronunciation)' ||
          voice.name === 'en-GB-Standard-A' ||
          voice.name === 'en-GB-Standard-B' ||
          voice.name === 'en-GB-Standard-C' ||
          voice.name === 'en-GB-Standard-D'
        );

        // If not found, look for any British English voice
        if (!targetVoice) {
          targetVoice = voices.find(voice => 
            voice.lang === 'en-GB' && 
            !voice.name.includes('Test') &&
            !voice.name.includes('Demo')
          );
        }

        // Fallback to any English voice if British not available
        if (!targetVoice) {
          targetVoice = voices.find(voice => 
            voice.lang.startsWith('en') && 
            !voice.name.includes('Test') &&
            !voice.name.includes('Demo')
          );
        }

        if (targetVoice) {
          setSelectedVoice(targetVoice);
          console.log('Selected voice:', targetVoice.name, targetVoice.lang);
        }
      };

      // Initialize voices immediately if available
      if (synth.getVoices().length > 0) {
        initializeVoices();
      }

      // Listen for voice changes
      synth.onvoiceschanged = initializeVoices;

      return () => {
        if (speechRef.current) {
          synth.cancel();
        }
        synth.onvoiceschanged = null;
      };
    }
  }, []);

  const forceStopSpeech = () => {
    if (synthRef.current) {
      // Force stop all speech synthesis
      synthRef.current.cancel();
      synthRef.current.pause();
      
      // Reset the synthesis object
      setTimeout(() => {
        if (synthRef.current) {
          synthRef.current.resume();
        }
      }, 100);
    }
    
    if (speechRef.current) {
      speechRef.current = null;
    }
    
    setIsSpeaking(false);
  };

  const textToSpeech = (text) => {
    if (!text) return;

    // Force stop any existing speech
    forceStopSpeech();

    // Wait a bit to ensure previous speech is completely stopped
    setTimeout(() => {
      if (typeof window !== "undefined" && "speechSynthesis" in window && synthRef.current) {
        try {
          // Create new speech utterance
          const speech = new SpeechSynthesisUtterance();
          speechRef.current = speech;
          
          // Set text
          speech.text = text;
          
          // Set voice if available
          if (selectedVoice) {
            speech.voice = selectedVoice;
          }
          
          // Optimize speech settings for standard quality
          speech.rate = 0.8;        // Slower rate for clarity
          speech.pitch = 1.0;       // Natural pitch
          speech.volume = 0.9;      // Good volume level
          speech.lang = 'en-GB';    // Force British English
          
          // Event handlers
          speech.onstart = () => {
            setIsSpeaking(true);
            console.log('Speech started with voice:', speech.voice?.name);
          };
          
          speech.onend = () => {
            setIsSpeaking(false);
            speechRef.current = null;
            console.log('Speech ended');
          };
          
          speech.onerror = (event) => {
            console.error('Speech error:', event.error);
            setIsSpeaking(false);
            speechRef.current = null;
          };
          
          // Start speaking
          synthRef.current.speak(speech);
          
        } catch (error) {
          console.error('Error in textToSpeech:', error);
          setIsSpeaking(false);
          speechRef.current = null;
        }
      } else {
        alert("Sorry, your browser does not support text-to-speech");
      }
    }, 150); // Wait 150ms to ensure previous speech is stopped
  };

  const handleQuestionClick = (questionIndex) => {
    // Stop any current speech when changing questions
    forceStopSpeech();
    
    if (onQuestionChange) {
      onQuestionChange(questionIndex);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      forceStopSpeech();
    };
  }, []);

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
            {mockInterviewQuestion.map((question, index) => {
              const isAnswered = answeredQuestions.has(index);
              const isSkipped = skippedQuestions.has(index);
              const isActive = activeQuestionIndex === index;
              
              return (
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
                      isActive
                        ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg"
                        : isAnswered
                        ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800"
                        : isSkipped
                        ? "bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    <div className="flex items-center justify-center space-x-2">
                      {isAnswered ? (
                        <CheckCircle className="w-4 h-4 text-green-500 dark:text-green-400" />
                      ) : isSkipped ? (
                        <SkipForward className="w-4 h-4 text-orange-500 dark:text-orange-400" />
                      ) : (
                        <span className="text-sm font-medium">
                          {index + 1}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                {activeQuestionIndex + 1} of {mockInterviewQuestion.length}
              </Badge>
              {isCurrentQuestionAnswered && (
                <Badge variant="outline" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Answered
                </Badge>
              )}
              {isCurrentQuestionSkipped && (
                <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600">
                  <SkipForward className="w-3 h-3 mr-1" />
                  Skipped
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
              {mockInterviewQuestion[activeQuestionIndex]?.question}
            </p>
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-slate-700">
              <div className="flex items-center space-x-3">
                {isSpeaking ? (
                  <Button
                    onClick={forceStopSpeech}
                    variant="outline"
                    size="sm"
                    className="border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900 dark:text-white"
                  >
                    <Volume2 className="w-4 h-4 mr-2 text-red-600" />
                    Stop
                  </Button>
                ) : (
                  <Button
                    onClick={() => textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.question)}
                    variant="outline"
                    size="sm"
                    className="border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 dark:text-white"
                  >
                    <Volume2 className="w-4 h-4 mr-2" />
                    Listen
                  </Button>
                )}
              </div>
              
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
