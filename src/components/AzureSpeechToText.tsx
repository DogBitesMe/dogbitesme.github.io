import React, { useState } from 'react';
import * as sdk from 'microsoft-cognitiveservices-speech-sdk';
import { existEnvironmentVariable, getEnvironmentVariable } from '../helpers/utils';

interface AzureSpeechToTextProps {
  subscriptionKey: string;
  region: string;
  isListening: boolean;
  language?: string;
  setTranscript: (update: ((prevTranscript: string) => string) | string) => void;
  setIsListening: (update: ((prevIsListening: boolean) => boolean) | boolean) => void;
  setWaiting: (update: ((prevWaiting: boolean) => boolean) | boolean) => void;
  notify: any;
  accessCode: string;
}

const AzureSpeechToText: React.FC<AzureSpeechToTextProps> = ({
  subscriptionKey,
  region,
  isListening,
  language = 'en-US',
  setIsListening,
  setTranscript,
  setWaiting,
  notify,
  accessCode,
}) => {
  const [recognizer, setRecognizer] = useState<sdk.SpeechRecognizer | null>(null);

  React.useEffect(() => {
    if (isListening) {
      startSpeechRecognition();
    } else {
      if (recognizer) {
        recognizer.stopContinuousRecognitionAsync();
      } else {
        // console.log('Recognizer is null');
      }
    }
  }, [isListening]);

  const startSpeechRecognition = () => {

    if (accessCode !== getEnvironmentVariable('ACCESS_CODE')) {
      notify.invalidAccessCodeNotify();
      setIsListening(false);
      setWaiting(false);
      return;
    }

    //alert(`startSpeechRecognition ${subscriptionKey}, ${region}, ${language}`);
    /*
    在iPhone上必須先取得使用者的同意才能使用麥克風
    語音辨識服務必須在getUserMedia的then裡面才能呼叫不然會沒有反應
     */
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (stream) {

      var mimeType: string;
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
        mimeType = 'audio/mpeg';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      }
      else {
        console.error("no suitable mimetype found for this device");
        mimeType = "none";
      }
      alert(`supportedAudioType:${mimeType}`);
      setWaiting(true);

      if (subscriptionKey === '' || region === '') {
        notify.emptyAzureKeyNotify();
        setIsListening(false);
        setWaiting(false);
        return;
      }


      const speechConfig = sdk.SpeechConfig.fromSubscription(subscriptionKey, region);
      speechConfig.speechRecognitionLanguage = language;

      const audioConfig = sdk.AudioConfig.fromDefaultMicrophoneInput();
      const newRecognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

      newRecognizer.recognizing = (s, e) => {
        console.log(`Recognizing: ${e.result.text}`);
      };

      newRecognizer.recognized = (s, e) => {
        console.log(`Recognized: ${e.result.text}`);
        if (e.result.text !== undefined) {
          setTranscript(e.result.text);
        }
      };

      newRecognizer.canceled = (s, e) => {
        // @ts-ignore
        if (e.errorCode === sdk.CancellationErrorCode.ErrorAPIKey) {
          console.error('Invalid or incorrect subscription key');
        } else {
          console.log(`Canceled: ${e.errorDetails}`);
          notify.azureRecognitionErrorNotify();
        }
        setIsListening(false);
        setWaiting(false);
      };

      newRecognizer.sessionStopped = (s, e) => {
        console.log('Session stopped');
        newRecognizer.stopContinuousRecognitionAsync();
        setIsListening(false);
        setWaiting(false);
      };

      newRecognizer.startContinuousRecognitionAsync(
        () => {
          setWaiting(false);
          console.log('Listening...');
        },
        error => {
          console.log(`Error: ${error}`);
          notify.azureRecognitionErrorNotify();
          newRecognizer.stopContinuousRecognitionAsync();
          setIsListening(false);
        }
      );

      setRecognizer(newRecognizer);

    })
      .catch(function (e) {
        console.log(`get media err:${e}`);
        alert(`Get media err:${e}`);
      });



  };

  return null;
};

export default AzureSpeechToText;
