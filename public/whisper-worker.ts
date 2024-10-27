import {
  AutoTokenizer,
  AutoProcessor,
  WhisperForConditionalGeneration,
  TextStreamer,
  full,
  WhisperModel, // Ensure this is the correct type for the model
} from '@huggingface/transformers';

const MAX_NEW_TOKENS = 64;

class AutomaticSpeechRecognitionPipeline {
  static model_id: string | null = null;
  static tokenizer = null;
  static processor = null;
  static model: WhisperModel | null = null; // Explicitly define the type

  static async getInstance(progress_callback: ((x: any) => void) | null = null) {
    this.model_id = 'onnx-community/whisper-base';
    this.tokenizer ??= AutoTokenizer.from_pretrained(this.model_id, {
      progress_callback,
    });
    this.processor ??= AutoProcessor.from_pretrained(this.model_id, {
      progress_callback,
    });
    this.model ??= WhisperForConditionalGeneration.from_pretrained(this.model_id, {
      dtype: {
        encoder_model: 'fp32',
        decoder_model_merged: 'q4',
      },
      device: 'webgpu',
      progress_callback,
    }) as WhisperModel; // Type assertion if necessary

    return Promise.all([this.tokenizer, this.processor, this.model]);
  }
}

let processing = false;

async function generate({ audio, language }: { audio: Float32Array; language: string }) {
  if (processing) return;
  processing = true;

  console.log('Worker: Starting generation process'); // Debug: Log start of generation
  console.log('Audio data length:', audio.length); // Debug: Log audio data length

  self.postMessage({ status: 'start' });

  const [tokenizer, processor, model] = await AutomaticSpeechRecognitionPipeline.getInstance();

  if (!processor || !model) {
    console.error('Worker: Failed to initialize processor or model'); // Debug: Log initialization failure
    self.postMessage({ status: 'error', message: 'Failed to initialize processor or model.' });
    processing = false;
    return;
  }

  console.log('Worker: Model and processor initialized'); // Debug: Log successful initialization

  let startTime;
  let numTokens = 0;

  const callback_function = (output: any) => {
    startTime ??= performance.now();
    let tps;
    if (numTokens++ > 0) {
      tps = numTokens / (performance.now() - startTime) * 1000;
    }
    self.postMessage({
      status: 'update',
      output, tps, numTokens,
    });
  }

  const streamer = new TextStreamer(tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function,
  });

  const inputs = await processor.process(audio);
  console.log('Worker: Audio processed, generating output'); // Debug: Log before generation

  const outputs = await model.generate({
    ...inputs,
    max_new_tokens: MAX_NEW_TOKENS,
    language,
    streamer,
  });

  const outputText = tokenizer.batch_decode(outputs, { skip_special_tokens: true });

  console.log('Worker: Generation complete. Output:', outputText); // Debug: Log the final output

  self.postMessage({
    status: 'complete',
    output: outputText,
  });

  processing = false;
}

async function load() {
  self.postMessage({
    status: 'loading',
    data: 'Loading model...'
  });

  const [tokenizer, processor, model] = await AutomaticSpeechRecognitionPipeline.getInstance(x => {
    self.postMessage(x);
  });

  self.postMessage({
    status: 'loading',
    data: 'Compiling shaders and warming up model...'
  });

  await model.generate({
    input_features: full([1, 80, 3000], 0.0),
    max_new_tokens: 1,
  });

  self.postMessage({ status: 'ready' });
}

self.addEventListener('message', async (e) => {
  const { type, data } = e.data;
  switch (type) {
    case 'load':
      load();
      break;
    case 'generate':
      generate(data);
      break;
  }
});
