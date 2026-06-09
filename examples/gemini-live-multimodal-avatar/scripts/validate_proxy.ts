/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import WebSocket from 'ws';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// --- Setup ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PROXY_URL = 'ws://localhost:8080/api/live-avatar/ws/google.cloud.aiplatform.v1beta1.LlmBidiService/BidiGenerateContent';
const MODEL = 'publishers/google/models/gemini-3.1-flash-live-preview-04-2026';
const AVATAR_NAME = process.env.GOOGLE_1P_AVATAR_NAME || 'Piper';

console.log(`\n🚀 Starting Proxy Integration Validation`);
console.log(`📍 Proxy URL: ${PROXY_URL}`);
console.log(`🤖 Target Model: ${MODEL}`);
console.log(`👤 Avatar Name: ${AVATAR_NAME}`);
console.log(`-------------------------------------------\n`);

async function runValidation() {
    const ws = new WebSocket(PROXY_URL);
    let setupComplete = false;
    let turnComplete = false;
    let responseCount = 0;
    let timeout: NodeJS.Timeout;

    const cleanup = (exitCode: number) => {
        clearTimeout(timeout);
        ws.close();
        process.exit(exitCode);
    };

    timeout = setTimeout(() => {
        if (responseCount > 0) {
            console.log(`\n✅ SUCCESS: Received ${responseCount} response chunks from Gemini. Proxy is healthy!`);
            cleanup(0);
        } else {
            console.error('❌ TIMEOUT: Test failed to complete within 30 seconds.');
            cleanup(1);
        }
    }, 30000);

    ws.on('open', () => {
        console.log('✅ Connected to Go Proxy (Simulated SDK Path)');
        
        // Step 1: Send Setup Handshake (v2.2.0 flattened protocol)
        const setupMessage = {
            setup: {
                model: MODEL,
                generationConfig: {
                    responseModalities: ["VIDEO"], // Consistently generates media chunks for validation
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: "Aoede"
                            }
                        }
                    }
                },
                avatarConfig: {
                    avatarName: AVATAR_NAME
                },
                systemInstruction: {
                    parts: [{ text: "You are a validation bot. Reply with 'ACK' if you hear me." }]
                }
            }
        };

        console.log('📤 Sending Setup message...');
        ws.send(JSON.stringify(setupMessage));
    });

    ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        
        if (msg.setupComplete) {
            console.log('✅ Received setupComplete from Gemini (via Proxy)');
            setupComplete = true;

            // Step 2: Send dummy audio (16kHz PCM, mono, 1 second of silence)
            const dummyAudio = Buffer.alloc(32000).toString('base64');
            const audioMessage = {
                realtimeInput: {
                    mediaChunks: [{
                        data: dummyAudio,
                        mimeType: "audio/pcm;rate=16000"
                    }]
                }
            };

            console.log('📤 Sending 1 second of dummy audio...');
            ws.send(JSON.stringify(audioMessage));
        }

        if (msg.serverContent?.modelTurn) {
            responseCount++;
            if (responseCount % 10 === 0) {
                process.stdout.write('.'); // Progress indicator
            }
            const text = msg.serverContent.modelTurn.parts?.[0]?.text;
            if (text) {
                console.log(`\n🤖 Model Text: "${text}"`);
            }
        }

        if (msg.serverContent?.turnComplete) {
            console.log('\n✅ Turn Complete. Proxy is fully functional!');
            turnComplete = true;
            cleanup(0);
        }
    });

    ws.on('error', (err) => {
        console.error('❌ WebSocket Error:', err.message);
        cleanup(1);
    });

    ws.on('close', (code, reason) => {
        if (!turnComplete) {
            console.error(`❌ Connection closed unexpectedly: Code ${code} - ${reason.toString()}`);
            if (code === 1006) {
                console.log('\n💡 Tip: Code 1006 usually means the backend server crashed or failed to upgrade the connection.');
                console.log('   Check the Go backend console output for error messages.');
            }
            cleanup(1);
        }
    });
}

runValidation().catch(err => {
    console.error('💥 Unexpected failure:', err);
    process.exit(1);
});
