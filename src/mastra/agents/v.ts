import { Agent } from "@mastra/core/agent";
import { GeminiLiveVoice } from "@mastra/voice-google-gemini-live";
import { playAudio, getMicrophoneStream } from "@mastra/node-audio";
import { google } from '@ai-sdk/google';

const agent = new Agent({
 name: 'Agent',
 instructions: 'You are a helpful assistant with real - time voice capabilities.',
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

await agent.voice.connect();

agent.voice.on('speaker', (audio) => {
 playAudio(audio);
});

agent.voice.on('writing', ({ role, text }) => {
 console.log(`${role}: ${text}`);
});

await agent.voice.speak('Hello, how can I help you today?');

const micStream = getMicrophoneStream();
await agent.voice.send(micStream);
