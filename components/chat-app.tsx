'use client'

import { useState, useRef, useEffect } from 'react'
import { Moon, Sun, Upload, Send, Mic } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
// import { WhisperWorker } from '../workers/whisper.worker';

// Import the sqlDBSearchTool only on the server-side
// let sqlDBSearchTool: { func: (args: { query: string; return_direct: boolean }) => Promise<string> } | null = null;
// if (typeof window === 'undefined') {
//   import('../ai/tools/sqlDBsearchTool').then(module => {
//     sqlDBSearchTool = module.sqlDBSearchTool;
//   });
// }

// Example query (commented out as it's not being used)
/*
const searchDB = async () => {
  if (typeof window !== 'undefined') {
    console.error('SQLite operations are not supported in the browser');
    return null;
  }
  return await sqlDBSearchTool.func({
    query: "SELECT * FROM users WHERE name LIKE '%John%'",
    return_direct: true
  });
};
*/

import { nanoid } from 'nanoid'

export const ChatApp = () => {
  const [darkMode, setDarkMode] = useState(false)
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I assist you today?", sender: "ai" },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  // const workerRef = useRef<Worker | null>(null)
  const [threadId] = useState(() => nanoid())

  const toggleDarkMode = () => setDarkMode(!darkMode)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages]);

  // useEffect(() => {
  //   console.log('ChatAppComponent mounted');
  //   if (typeof window !== 'undefined') {
  //     try {
  //       console.log('Initializing Web Worker');
  //       // Update the worker initialization to use the correct path
  //       workerRef.current = new Worker(
  //         new URL('../workers/whisper.worker.ts', import.meta.url),
  //         { type: 'module' }
  //       );

  //       if (workerRef.current) {
  //         workerRef.current.postMessage({ type: 'load' });
  //         console.log('Load message sent to worker');

  //         workerRef.current.onerror = (error) => {
  //           console.error('Web Worker error:', error);
  //         };

  //         workerRef.current.onmessage = (event) => {
  //           console.log('Message received from worker:', event.data);
  //           const { status, data, output } = event.data;

  //           switch (status) {
  //             case 'loading':
  //               console.log('Worker loading:', data);
  //               break;
  //             case 'ready':
  //               console.log('Worker ready');
  //               break;
  //             case 'start':
  //               console.log('Transcription started');
  //               break;
  //             case 'update':
  //               console.log('Transcription update:', output);
  //               if (output) setInputMessage(prev => prev + output);
  //               break;
  //             case 'complete':
  //               console.log('Transcription complete. Full output:', output);
  //               if (output && output[0]) {
  //                 console.log('Setting input message to:', output[0]);
  //                 setInputMessage(output[0]);
  //               }
  //               setIsRecording(false);
  //               break;
  //             case 'error':
  //               console.error('Worker error:', data);
  //               break;
  //           }
  //         };
  //       }
  //     } catch (error) {
  //       console.error('Error initializing Web Worker:', error);
  //     }

  //     return () => {
  //       workerRef.current?.terminate();
  //     };
  //   }
  // }, []);

  useEffect(() => {
    console.log(`Record button ${isRecording ? 'disabled' : 'enabled'}`); // Debug: Log record button state change
  }, [isRecording]);

  const sendMessage = async () => {
    if (inputMessage.trim()) {
      console.log('Sending message:', inputMessage);
      console.log('Thread ID:', threadId);
      const userMessage = { id: messages.length + 1, text: inputMessage, sender: "user" }
      setMessages(prevMessages => [...prevMessages, userMessage])
      setInputMessage("")
      setIsLoading(true)

      try {
        const response = await fetch('/api/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            message: inputMessage,
            thread_id: threadId
          }),
        });

        console.log('API Response status:', response.status);

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Received data from API:', data);

        // Update how we handle the response
        const aiMessage = { 
          id: messages.length + 2, 
          text: data.message,
          sender: "ai" 
        }
        console.log('Creating AI message:', aiMessage);

        setMessages(prevMessages => [...prevMessages, aiMessage])
      } catch (error) {
        console.error("Error sending message:", error)
        setMessages(prevMessages => [...prevMessages, { 
          id: messages.length + 2, 
          text: "Sorry, there was an error processing your request.", 
          sender: "ai" 
        }])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        console.log('Starting recording...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          } 
        });
        
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
            console.log('Audio chunk received:', event.data.size);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          console.log('Processing audio...');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const arrayBuffer = await audioBlob.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Get audio data and resample if necessary
            const channelData = audioBuffer.getChannelData(0);
            console.log('Audio processed, sending to worker...');
            
            // workerRef.current?.postMessage({
            //   type: 'generate',
            //   data: { 
            //     audio: channelData,
            //     language: 'en'
            //   }
            // }, [channelData.buffer]);
            
          } catch (error) {
            console.error('Error processing audio:', error);
          }
        };

        // Start recording with a 20-second time limit
        mediaRecorderRef.current.start(1000); // Collect data every second
        setIsRecording(true);
        
        // Automatically stop after 20 seconds
        setTimeout(() => {
          if (mediaRecorderRef.current?.state === 'recording') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
          }
        }, 20000);

      } catch (error) {
        console.error('Error starting recording:', error);
        setIsRecording(false);
      }
    } else {
      console.log('Stopping recording...');
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    }
  };

  return (
    <div className={`flex flex-col h-[80vh] max-w-2xl mx-auto ${darkMode ? 'dark' : ''}`}>
      <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-500 shadow-xl rounded-lg overflow-hidden">
        <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Multimodal Chat</h1>
          <Button variant="ghost" size="icon" onClick={toggleDarkMode}>
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
        </header>
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                  }`}
                >
                  {message.sender === 'ai' && (
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                  )}
                  <p>{message.text}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-2">
            <Button variant="outline" size="icon" className="shrink-0">
              <Upload className="h-4 w-4" />
            </Button>
            <Input
              type="text"
              placeholder="Type a message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="flex-1"
              disabled={isLoading || isRecording}
            />
            <Button
              variant="outline"
              size="icon"
              className={`shrink-0 ${isRecording ? 'text-red-500' : 'text-gray-500'}`}
              onClick={toggleRecording}
              disabled={isLoading}
              data-testid="record-button"
            >
              <Mic className="h-4 w-4" />
            </Button>
            <Button onClick={sendMessage} className="shrink-0" disabled={isLoading || isRecording}>
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Sending...' : 'Send'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
