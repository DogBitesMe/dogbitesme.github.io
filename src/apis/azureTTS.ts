import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { azureSynthesisErrorNotify } from '../components/Notification';

const speechSynthesizeWithAzure = async (
  subscriptionKey: string,
  region: string,
  text: string,
  voiceName: string,
  language: string
): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    console.time('Azure speech synthesis');
    const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, region);
    speechConfig.speechRecognitionLanguage = language;
    speechConfig.speechSynthesisVoiceName = voiceName;
    const player = new sdk.SpeakerAudioDestination();
    const audioConfig = sdk.AudioConfig.fromSpeakerOutput(player);
    //const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);
    const speechSynthesizer = new sdk.SpeechSynthesizer(speechConfig); //要用自己的方法撥放聲音，所以不用audioConfig
    //alert(`Azure speech synthesis ${subscriptionKey} ${region} ${text} ${voiceName} ${language}`);
    speechSynthesizer.speakTextAsync(
      text,
      result => {
        console.timeEnd('Azure speech synthesis');
        speechSynthesizer.close();
        resolve(result.audioData);
      },
      error => {
        console.log(error);
        azureSynthesisErrorNotify();
        speechSynthesizer.close();
        reject(error);
      }
    );
    //return player;
  });
};
export default speechSynthesizeWithAzure;
