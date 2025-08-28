"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Mic,
  Square,
  Play,
  Pause,
  Video,
  Camera,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import Webcam from "react-webcam";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const RecordAnsSection = ({
  currentQuestion,
  onAnswerSubmit,
  isRecording,
  setIsRecording,
  recordedBlob,
  setRecordedBlob,
  isPlaying,
  setIsPlaying,
  audioUrl,
  setAudioUrl,
}) => {
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const streamRef = useRef(null);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);

  // Initialize MediaRecorder when component mounts
  useEffect(() => {
    initializeMediaRecorder();

    // Cleanup function
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Re-initialize MediaRecorder when question changes
  useEffect(() => {
    if (currentQuestion && hasPermission) {
      // Reset states for new question
      setIsRecording(false);
      setRecordedBlob(null);
      setAudioUrl(null);
      setIsPlaying(false);

      // Re-initialize MediaRecorder for new question
      setTimeout(() => {
        reinitializeMediaRecorder();
      }, 100);
    }
  }, [currentQuestion, hasPermission]);

  const initializeMediaRecorder = async () => {
    try {
      console.log("Requesting microphone permission...");
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      console.log("Microphone permission granted, creating MediaRecorder...");

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log("Data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          setRecordedBlob(event.data);
          const url = URL.createObjectURL(event.data);
          setAudioUrl(url);
        }
      };

      mediaRecorderRef.current.onstart = () => {
        console.log("Recording started");
      };

      mediaRecorderRef.current.onstop = () => {
        console.log("Recording stopped");
        // Don't stop tracks here - we'll reuse the stream
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        toast.error("Recording error occurred");
      };

      setHasPermission(true);
      console.log("MediaRecorder initialized successfully");
    } catch (error) {
      console.error("Error accessing microphone:", error);
      if (error.name === "NotAllowedError") {
        toast.error(
          "Microphone permission denied. Please allow microphone access and refresh the page."
        );
      } else if (error.name === "NotFoundError") {
        toast.error(
          "No microphone found. Please connect a microphone and refresh the page."
        );
      } else {
        toast.error(
          "Unable to access microphone. Please check permissions and refresh the page."
        );
      }
      setHasPermission(false);
    }
  };

  // Re-initialize MediaRecorder for new recording sessions
  const reinitializeMediaRecorder = async () => {
    try {
      // Stop existing stream if any
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Request new stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // Create new MediaRecorder
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log("Data available:", event.data.size, "bytes");
        if (event.data.size > 0) {
          setRecordedBlob(event.data);
          const url = URL.createObjectURL(event.data);
          setAudioUrl(url);
        }
      };

      mediaRecorderRef.current.onstart = () => {
        console.log("Recording started");
      };

      mediaRecorderRef.current.onstop = () => {
        console.log("Recording stopped");
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        toast.error("Recording error occurred");
      };

      console.log("MediaRecorder re-initialized successfully");
      return true;
    } catch (error) {
      console.error("Error re-initializing MediaRecorder:", error);
      toast.error("Failed to initialize recording. Please try again.");
      return false;
    }
  };

  const startRecording = async () => {
    console.log(
      "Start recording clicked, current state:",
      mediaRecorderRef.current?.state
    );

    if (!hasPermission) {
      toast.error(
        "Microphone permission not granted. Please refresh the page and allow microphone access."
      );
      return;
    }

    // Check if MediaRecorder is ready, if not, re-initialize
    if (
      !mediaRecorderRef.current ||
      mediaRecorderRef.current.state === "inactive"
    ) {
      const success = await reinitializeMediaRecorder();
      if (!success) return;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "inactive"
    ) {
      try {
        mediaRecorderRef.current.start();
        setIsRecording(true);
        setRecordedBlob(null);
        setAudioUrl(null);
        toast.success("Recording started...");
        console.log("Recording started successfully");
      } catch (error) {
        console.error("Error starting recording:", error);
        toast.error("Failed to start recording. Please try again.");
      }
    } else {
      console.log("MediaRecorder not ready or already recording");
      toast.error(
        "Recording system not ready. Please wait a moment and try again."
      );
    }
  };

  const stopRecording = () => {
    console.log(
      "Stop recording clicked, current state:",
      mediaRecorderRef.current?.state
    );

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      try {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        toast.success("Recording stopped");
        console.log("Recording stopped successfully");
      } catch (error) {
        console.error("Error stopping recording:", error);
        toast.error("Failed to stop recording. Please try again.");
      }
    } else {
      console.log("MediaRecorder not recording");
      toast.error("No active recording to stop.");
    }
  };

  const togglePlayback = () => {
    if (audioUrl) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleSubmit = async () => {
    if (!recordedBlob) {
      toast.error("Please record an answer first");
      return;
    }

    setIsProcessing(true);
    try {
      // Convert blob to base64 for submission
      const reader = new FileReader();
      reader.onload = () => {
        const base64Audio = reader.result.split(",")[1];
        onAnswerSubmit({
          question: currentQuestion,
          audioData: base64Audio,
          transcript: transcript || "Audio recorded (no transcript available)",
          timestamp: new Date().toISOString(),
        });

        // Reset states
        setRecordedBlob(null);
        setAudioUrl(null);
        setTranscript("");
        toast.success("Answer submitted successfully!");
      };
      reader.readAsDataURL(recordedBlob);
    } catch (error) {
      console.error("Error submitting answer:", error);
      toast.error("Failed to submit answer. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Webcam Video Display */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-lg text-gray-900 dark:text-white">
            <Video className="w-5 h-5 text-purple-600" />
            <span>Your Video Feed</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 p-6">
              <div className="flex items-center justify-center">
                <div className="relative">
                  <Webcam
                    mirrored={true}
                    style={{
                      height: 300,
                      width: "100%",
                      borderRadius: "16px",
                      boxShadow:
                        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    }}
                  />
                  {isRecording && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-2"
                    >
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      <span>REC</span>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recording Controls */}
      <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-gray-900 dark:text-white">
            <Mic className="w-5 h-5 text-red-600" />
            <span>Record Your Answer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Permission Status */}
          {!hasPermission && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Microphone access required
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    Please refresh the page and allow microphone permissions.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recording Controls */}
          <div className="flex items-center justify-center space-x-4">
            {!isRecording ? (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={startRecording}
                  size="lg"
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isProcessing || !hasPermission}
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
              </motion.div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  onClick={stopRecording}
                  size="lg"
                  className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  disabled={isProcessing}
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              </motion.div>
            )}
          </div>

          {/* Manual Reset Button */}
          <div className="flex justify-center">
            <Button
              onClick={async () => {
                try {
                  await reinitializeMediaRecorder();
                  setRecordedBlob(null);
                  setAudioUrl(null);
                  setIsRecording(false);
                  setIsPlaying(false);
                  toast.success("Recording system reset successfully!");
                } catch (error) {
                  toast.error("Failed to reset recording system");
                }
              }}
              variant="outline"
              size="sm"
              className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset Recording System
            </Button>
          </div>

          {/* Recording Status */}
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center space-x-3 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-700 dark:text-red-300 font-medium">
                Recording in progress...
              </span>
            </motion.div>
          )}

          {/* Playback Controls */}
          {audioUrl && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-center">
                <Button
                  onClick={togglePlayback}
                  variant="outline"
                  size="lg"
                  className="border-blue-300 dark:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200"
                  disabled={isProcessing}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause Playback
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Play Recording
                    </>
                  )}
                </Button>
              </div>

              {/* Audio Player */}
              <div className="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={handleAudioEnded}
                  className="w-full"
                  controls
                />
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          {recordedBlob && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="pt-4"
            >
              <Button
                onClick={handleSubmit}
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Submit Answer
                  </>
                )}
              </Button>
            </motion.div>
          )}

          {/* Debug Info (only in development) */}
          {process.env.NODE_ENV === "development" && (
            <div className="p-3 bg-gray-100 dark:bg-slate-700 rounded-lg text-xs space-y-1 text-gray-700 dark:text-gray-300">
              <p>Debug: Permission: {hasPermission ? "Yes" : "No"}</p>
              <p>
                Debug: Recorder State:{" "}
                {mediaRecorderRef.current?.state || "Not initialized"}
              </p>
              <p>Debug: Is Recording: {isRecording ? "Yes" : "No"}</p>
              <p>
                Debug: Stream Active: {streamRef.current?.active ? "Yes" : "No"}
              </p>
              <p>
                Debug: Current Question: {currentQuestion ? "Set" : "Not set"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecordAnsSection;
