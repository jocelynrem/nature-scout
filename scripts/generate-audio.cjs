const fs = require('node:fs/promises');
const path = require('node:path');

const { tasks, readAlouds } = require('../content.js');

const apiKey = process.env.GEMINI_API_KEY;
const outputDir = path.join(__dirname, '..', 'audio');
const force = process.argv.includes('--force');
const maxRetries = 6;

if (!apiKey) {
  console.error('Missing GEMINI_API_KEY in the environment.');
  process.exit(1);
}

function buildJobs() {
  const jobs = [
    { id: 'intro', text: readAlouds.intro },
    { id: 'main-instruction', text: readAlouds.mainInstruction },
  ];

  for (const task of tasks) {
    jobs.push({ id: `task-${task.id}-clue`, text: task.clue });
    jobs.push({ id: `task-${task.id}-question`, text: task.question });
    jobs.push({
      id: `task-${task.id}-fact`,
      text: `Great discovery! ${task.fact}`,
    });
  }

  return jobs;
}

function base64ToBuffer(base64) {
  return Buffer.from(base64, 'base64');
}

function pcmToWavBuffer(pcmData, sampleRate) {
  const header = Buffer.alloc(44);
  const dataLength = pcmData.length;

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);

  return Buffer.concat([header, pcmData]);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelayMs(result, attempt) {
  const retryInfo = result?.error?.details?.find(
    (detail) => detail['@type'] === 'type.googleapis.com/google.rpc.RetryInfo',
  );
  const retryDelay = retryInfo?.retryDelay;

  if (typeof retryDelay === 'string' && retryDelay.endsWith('s')) {
    const seconds = Number.parseFloat(retryDelay.slice(0, -1));
    if (!Number.isNaN(seconds)) {
      return Math.ceil(seconds * 1000) + 1000;
    }
  }

  return Math.min(60000, 20000 * (attempt + 1));
}

async function synthesize(text, attempt = 0) {
  const payload = {
    model: 'gemini-2.5-flash-preview-tts',
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } },
      },
    },
  };

  const response = await fetch(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify(payload),
    },
  );

  const result = await response.json();

  if (!response.ok) {
    if (response.status === 429 && attempt < maxRetries) {
      const delayMs = getRetryDelayMs(result, attempt);
      console.log(
        `Rate limited by Gemini TTS. Waiting ${Math.ceil(delayMs / 1000)}s before retrying...`,
      );
      await sleep(delayMs);
      return synthesize(text, attempt + 1);
    }

    throw new Error(
      `Gemini TTS request failed: ${response.status} ${JSON.stringify(result, null, 2)}`,
    );
  }

  const part = result.candidates?.[0]?.content?.parts?.[0];

  if (!part?.inlineData?.data) {
    throw new Error(
      `Gemini TTS response did not include audio data.\n${JSON.stringify(result, null, 2)}`,
    );
  }

  const match = part.mimeType?.match(/rate=(\d+)/);
  const sampleRate = match ? parseInt(match[1], 10) : 24000;
  const pcmBuffer = base64ToBuffer(part.inlineData.data);
  return pcmToWavBuffer(pcmBuffer, sampleRate);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const jobs = buildJobs();

  await fs.mkdir(outputDir, { recursive: true });

  for (const job of jobs) {
    const outputPath = path.join(outputDir, `${job.id}.wav`);

    if (!force && (await fileExists(outputPath))) {
      console.log(`Skipping ${job.id} (already exists)`);
      continue;
    }

    console.log(`Generating ${job.id}`);
    const wavBuffer = await synthesize(job.text);
    await fs.writeFile(outputPath, wavBuffer);
  }

  console.log(`Generated audio files in ${outputDir}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
