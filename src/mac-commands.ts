import { exec } from 'child_process'


export function textToSpeech(voice: string = 'Samantha', timeout: number = 0, message: string) {
  exec(`say ${voice} -r ${timeout} ${message}`)
}
