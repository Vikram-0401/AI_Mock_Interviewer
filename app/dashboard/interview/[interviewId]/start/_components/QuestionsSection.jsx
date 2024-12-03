import { Lightbulb, Volume2 } from "lucide-react";
import React, { useEffect, useState } from "react";

function QuestionsSection({ mockInterviewQuestion, activeQuestionIndex }) {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const synth = window.speechSynthesis;

      const populateVoices = () => {
        const availableVoices = synth.getVoices();
        setVoices(availableVoices);
        // Optionally set a default voice
        if (availableVoices.length > 0 && !selectedVoice) {
          setSelectedVoice(availableVoices[2]); // Select the first available voice
        }
      };

      populateVoices();
      synth.onvoiceschanged = populateVoices; // Update voices when they change
    }
  }, [selectedVoice]);

  const textToSpeech = (text) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.voice = selectedVoice; // Set the selected voice
      window.speechSynthesis.speak(speech);
    } else {
      alert("Sorry, your browser does not support text-to-speech");
    }
  };

  return (
    mockInterviewQuestion && (
      <div className="p-5 border rounded-lg my-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {mockInterviewQuestion.map((question, index) => (
            <h2
              key={index}
              className={`p-2 bg-secondary rounded-full text-xs md:text-sm text-center cursor-pointer
              ${activeQuestionIndex === index && "bg-primary text-white"}`}
            >
              Question #{index + 1}
            </h2>
          ))}
        </div>
        <h2 className="my-5 text-md md:text-lg">
          {mockInterviewQuestion[activeQuestionIndex]?.question}
        </h2>
        <Volume2
          className="cursor-pointer"
          onClick={() =>
            textToSpeech(mockInterviewQuestion[activeQuestionIndex]?.question)
          }
        />
        <div className="border rounded-lg p-5 bg-blue-100 mt-20">
          <h2 className="flex gap-2 items-center text-primary">
            <Lightbulb />
            <strong>Note:</strong>
          </h2>
          <h2 className="text-sm text-primary my-2 font-semibold">
            Click on Record Answer when you want to answer the question. At the
            end of the interview, we will give you the feedback along with the
            correct answer for each question and your answer to compare it.
          </h2>
        </div>
      </div>
    )
  );
}

export default QuestionsSection;
