import { Agent } from "@mastra/core/agent";
import { createResearchMemory } from '../config/libsql-storage';
import { GeminiLiveVoice } from "@mastra/voice-google-gemini-live";
import { playAudio, getMicrophoneStream } from "@mastra/node-audio";
import { google } from '@ai-sdk/google';
import { PinoLogger } from "@mastra/loggers";

const logger = new PinoLogger({ level: 'info' });

logger.info("Initializing Voice Agent...");

export const voiceAgent = new Agent({
    id: 'voice-agent',
 name: 'Voice Agent',
 instructions: 'You are a helpful assistant with real - time voice capabilities.',
 memory: createResearchMemory(),
 // Model used for text generation; voice provider handles realtime audio
 model: google('gemini-2.5-flash'),
 voice: new GeminiLiveVoice({
 apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
 model: 'gemini-live-2.5-flash-preview-native-audio',
 speaker: 'Puck',
 debug: true,
 // Vertex AI option:
 // vertexAI: true,
 // project: 'your - gcp - project',
 // location: 'us - central1',
 // serviceAccountKeyFile: '/ path / to / service - account.json',
 }),
});

await voiceAgent.voice.connect();

voiceAgent.voice.on('speaker', (audio) => {
 playAudio(audio);
});

voiceAgent.voice.on('writing', ({ role, text }) => {
 logger.info(`${role}: ${text}`);
});

await voiceAgent.voice.speak('Hello, how can I help you today?');

const micStream = getMicrophoneStream();
await voiceAgent.voice.send(micStream);
