"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Loader2, Sparkles } from "lucide-react";
import { processVoiceCommand } from "../lib/api";

export default function VoiceAssistant() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'vi-VN'; // Vietnamese

        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setFeedback("Đang nghe...");
        };

        recognitionRef.current.onresult = async (event: any) => {
          setIsListening(false);
          const transcript = event.results[0][0].transcript;
          setFeedback(`Đã nghe: "${transcript}"`);
          
          try {
            setIsProcessing(true);
            const data = await processVoiceCommand(transcript);
            setFeedback(data.message || "Xử lý thành công!");
            
            // Dispatch a custom event so TaskBoard can refetch if it's open
            if (data.intent === 'CREATE_PROJECT_WITH_TASKS') {
              window.dispatchEvent(new CustomEvent('aios-project-created'));
            }
          } catch (error) {
            console.error("Voice processing error:", error);
            setFeedback("Lỗi khi xử lý giọng nói.");
          } finally {
            setIsProcessing(false);
            setTimeout(() => setFeedback(null), 5000);
          }
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          setFeedback("Lỗi microphone.");
          setTimeout(() => setFeedback(null), 3000);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error(e);
        }
      } else {
        alert("Trình duyệt không hỗ trợ nhận diện giọng nói (Web Speech API). Vui lòng dùng Chrome/Edge.");
      }
    }
  };

  return (
    <div className="relative flex items-center">
      {feedback && (
        <div className="absolute right-[50px] top-1/2 -translate-y-1/2 mr-2 whitespace-nowrap bg-zinc-800 text-white text-xs px-3 py-1.5 rounded-md shadow-lg pointer-events-none animate-in fade-in slide-in-from-right-2 z-50">
          {feedback}
        </div>
      )}
      
      <button 
        onClick={toggleListening}
        disabled={isProcessing}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all shadow-md z-50 ${
          isListening 
            ? "bg-red-500 hover:bg-red-600 shadow-red-500/30 animate-pulse" 
            : isProcessing 
              ? "bg-zinc-400 cursor-not-allowed" 
              : "bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20 hover:scale-105"
        }`}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <Mic className="w-5 h-5" />
        ) : (
          <Sparkles className="w-5 h-5" />
        )}
      </button>
    </div>
  );
}
